'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // 環境に合わせてパスを調整してください
import { TournamentSettings, PlayerEntry } from '@/types/tournament';
import { Search, UserX, AlertTriangle } from 'lucide-react';

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
      .eq('id', settings.id); // 型定義にidを追加したため、そのまま参照可能

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
    </div>
  );
}