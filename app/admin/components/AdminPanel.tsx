'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // 環境に合わせてパスを調整してください
import { TournamentSettings, PlayerEntry } from '@/types/tournament';
import { Search, UserX, AlertTriangle, Trash2, Upload, FileText } from 'lucide-react';

interface AdminPanelProps {
  initialPlayers: PlayerEntry[];
  initialSettings: TournamentSettings;
}

export default function AdminPanel({ initialPlayers, initialSettings }: AdminPanelProps) {
  const [settings, setSettings] = useState<TournamentSettings>(initialSettings);
  const [players, setPlayers] = useState<PlayerEntry[]>(initialPlayers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // サーバーからの更新を受け取るためのエフェクト
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  // 設定保存
  const saveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('tournament_settings')
      .update({
        announcement: settings.announcement,
        individual_prize_count: settings.individual_prize_count,
        team_prize_count: settings.team_prize_count,
        current_phase: settings.current_phase,
        show_phase: settings.show_phase,
        show_announcement: settings.show_announcement,
        show_playoff_players: settings.show_playoff_players,
      })
      .eq('id', settings.id);

    setIsSaving(false);
    if (error) {
      console.error(error);
      alert('保存に失敗しました');
    } else {
      alert('設定を保存しました');
      router.refresh();
    }
  };

  const handleSettingChange = <K extends keyof TournamentSettings>(
    field: K,
    value: TournamentSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // 欠席処理
  const handleMakeAbsent = async (player: PlayerEntry) => {
    const confirmMessage = `${player.participants?.name} (No.${player.bib_number}) を欠席にしますか？\n\n【重要】\n・この操作は取り消せません。\n・後続の選手の立順が自動的に繰り上がります。`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsSaving(true);
      const { error } = await supabase.rpc('handle_absent_player', { target_player_id: player.id });
      if (error) throw error;
      alert('欠席処理が完了しました。');
      router.refresh(); 
    } catch (error) {
      console.error('Error:', error);
      alert('処理に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // CSVインポート
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        setIsSaving(true);
        // 改行コード(\r\n, \n)に対応して分割
        const rows = text.split(/\r?\n/).map(row => row.trim()).filter(row => row);
        const headers = rows[0].split(',').map(h => h.trim());
        
        const requiredColumns = ['bib_number', 'player_name', 'team_name'];
        const missing = requiredColumns.filter(col => !headers.includes(col));
        if (missing.length > 0) throw new Error(`必須カラム不足: ${missing.join(', ')}`);

        const jsonData = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim());
          const obj: Record<string, string | null> = {};
          headers.forEach((header, index) => { obj[header] = values[index] || null; });
          return obj;
        });

        const { error } = await supabase.rpc('import_tournament_data', { data: jsonData });
        if (error) throw error;

        alert(`${jsonData.length}件インポートしました。`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh();
      } catch (error: unknown) {
        if (error instanceof Error) {
          alert(`インポート失敗: ${error.message}`);
        } else {
          alert(`インポート失敗: 予期せぬエラーが発生しました`);
        }
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsText(file);
  };

  // データリセット (全削除)
  const handleResetData = async () => {
    if (!window.confirm('【警告】全てのデータを完全に削除します。\n実行前にバックアップ(エクスポート)を推奨します。\n本当によろしいですか？')) return;
    if (!window.confirm('【最終確認】この操作は取り消せません。実行しますか？')) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('reset_tournament_data');
      if (error) throw error;
      alert('データをリセットしました。');
      router.refresh();
    } catch (error) {
      console.error('Reset error:', error);
      alert('リセットに失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // フィルタリング
  const filteredPlayers = players.filter((player) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    const name = player.participants?.name || '';
    const team = player.participants?.teams?.name || '';
    return (
      name.toLowerCase().includes(lower) ||
      team.toLowerCase().includes(lower) ||
      String(player.bib_number).includes(lower)
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* =================================================================
         大会管理パネル (既存機能)
         ================================================================= */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">大会管理パネル</h2>
        
        <div className="space-y-4">
          {/* お知らせ設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">お知らせ</label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={settings.announcement || ''}
              onChange={(e) => handleSettingChange('announcement', e.target.value)}
            />
          </div>

          {/* 進行フェーズ設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">現在のフェーズ</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={settings.current_phase}
              onChange={(e) => handleSettingChange('current_phase', e.target.value as TournamentSettings['current_phase'])}
            >
              <option value="preparing">準備中</option>
              <option value="qualifier">予選</option>
              <option value="tally">集計中</option>
              <option value="final">決勝</option>
              <option value="finished">終了</option>
            </select>
          </div>

          {/* 入賞数設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">個人入賞枠</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={settings.individual_prize_count}
                onChange={(e) => handleSettingChange('individual_prize_count', parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">団体入賞枠</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={settings.team_prize_count}
                onChange={(e) => handleSettingChange('team_prize_count', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* 表示フラグ設定 */}
          <div className="flex flex-col space-y-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={settings.show_phase}
                onChange={(e) => handleSettingChange('show_phase', e.target.checked)}
              />
              <span className="ml-2">フェーズを表示する</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={settings.show_announcement}
                onChange={(e) => handleSettingChange('show_announcement', e.target.checked)}
              />
              <span className="ml-2">お知らせを表示する</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={settings.show_playoff_players}
                onChange={(e) => handleSettingChange('show_playoff_players', e.target.checked)}
              />
              <span className="ml-2">プレーオフ進出者を表示する</span>
            </label>
          </div>

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`w-full py-2 px-4 rounded-md text-white font-bold ${
              isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>

      {/* =================================================================
         参加者管理 (欠席設定パネル)
         ================================================================= */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">参加者管理 (欠席設定)</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="名前 / 所属 / 番号で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
            <div className="ml-3 text-sm text-yellow-700 leading-relaxed">
              「欠席にする」ボタンを押すと、対象者はリストから除外され、<strong>後続の全選手の立順が自動的に繰り上がります。</strong><br />
              この操作はシステム上で取り消す（元に戻す）ことができません。
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名 / 所属</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className={player.is_absent ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {player.bib_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.participants?.name}</div>
                    <div className="text-sm text-gray-500">{player.participants?.teams?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {player.is_absent ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        欠席
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                        出席
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {!player.is_absent ? (
                      <button
                        onClick={() => handleMakeAbsent(player)}
                        disabled={isSaving}
                        className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50 transition-colors"
                      >
                        <UserX size={16} className="mr-1" />
                        欠席にする
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    該当する選手が見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================
         データ管理 (CSVインポート)
         ================================================================= */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Upload className="mr-2" size={24} />
          データインポート (CSV)
        </h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <FileText className="text-blue-600 mr-2 mt-0.5 shrink-0" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-bold mb-1">CSVフォーマット要件 (1行目は以下のヘッダが必要です)</p>
              <code className="block bg-white p-2 rounded border border-blue-200 font-mono text-xs break-all">
                bib_number, player_name, team_name, dan_rank, carriage, order_am1, order_am2, order_pm1
              </code>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-3 text-gray-400" />
              <p className="mb-1 text-sm text-gray-500 font-medium">クリックしてCSVファイルをアップロード</p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isSaving}
            />
          </label>
        </div>
      </div>

      {/* =================================================================
         データ管理 (Danger Zone)
         ================================================================= */}
      <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
          <AlertTriangle className="mr-2" size={24} />
          Danger Zone (データ初期化)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          現在登録されている大会の全データ（参加者、チーム、エントリー情報、成績など）を完全に削除します。
          この操作は取り消すことができません。
        </p>
        <button
          onClick={handleResetData}
          disabled={isSaving}
          className={`flex items-center justify-center w-full sm:w-auto py-3 px-6 rounded-md text-white font-bold transition-colors ${
            isSaving ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <Trash2 className="mr-2" size={20} />
          {isSaving ? '処理中...' : '全データを完全に削除する'}
        </button>
      </div>

    </div>
  );
}