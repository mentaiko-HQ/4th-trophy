'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Users,
  Settings,
  Megaphone,
  Save,
  Search,
  UserX,
  RefreshCw,
  Trophy,
  Activity,
  AlertTriangle,
  Database,
  Upload,
  Trash2,
  FileText,
  Download,
  RotateCcw,
  Archive,
  History,
  PlayCircle,
} from 'lucide-react';

interface AdminPanelProps {
  initialPlayers: any[];
  initialSettings: any;
}

// スナップショット型定義
type Snapshot = {
  id: string;
  created_at: string;
  label: string;
};

export default function AdminPanel({
  initialPlayers,
  initialSettings,
}: AdminPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'players' | 'settings' | 'data'
  >('dashboard');
  const [players, setPlayers] = useState(initialPlayers);
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // スナップショット一覧用
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------
  // スナップショットの取得
  // ----------------------------------------------------------------
  const fetchSnapshots = async () => {
    const { data, error } = await supabase
      .from('tournament_snapshots')
      .select('id, created_at, label')
      .order('created_at', { ascending: false });

    if (data) setSnapshots(data);
  };

  // タブ切り替え時にスナップショットを再取得
  useEffect(() => {
    if (activeTab === 'data') {
      fetchSnapshots();
    }
  }, [activeTab]);

  // ----------------------------------------------------------------
  // データ更新ハンドラ (通常)
  // ----------------------------------------------------------------

  // 欠席処理
  const handleMakeAbsent = async (player: any) => {
    const confirmMessage = `${player.participants?.name} (No.${player.bib_number}) を欠席にしますか？\n\n【重要】\n・この操作は取り消せません。\n・後続の選手の立順が自動的に繰り上がります。`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsSaving(true);
      const { error } = await supabase.rpc('handle_absent_player', {
        target_player_id: player.id,
      });
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

  // 設定保存
  const saveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('tournament_settings')
      .update({
        announcement: settings.announcement,
        individual_prize_count: settings.individual_prize_count,
        current_phase: settings.current_phase,
        show_phase: settings.show_phase,
        show_announcement: settings.show_announcement,
      })
      .eq('id', settings.id);

    setIsSaving(false);
    if (error) alert('保存に失敗しました');
    else alert('設定を保存しました');
    router.refresh();
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  // ----------------------------------------------------------------
  // データ管理: インポート & エクスポート & リセット
  // ----------------------------------------------------------------

  // CSVダウンロード処理 (共通)
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), content], {
      type: 'text/csv;charset=utf-8;',
    }); // BOM付きUTF-8
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // 全データエクスポート
  const handleExportData = () => {
    if (!players || players.length === 0) {
      alert('データがありません');
      return;
    }

    // ヘッダー
    const header =
      'No,氏名,所属,段位,所作,AM1立順,AM2立順,PM1立順,AM1的中,AM2的中,PM1的中,合計,暫定順位,最終順位,射詰,射遠順位,ステータス(AM1),欠席\n';

    // データ行
    const rows = players
      .map((p: any) => {
        const parts = p.participants || {};
        const team = parts.teams || {};
        return [
          p.bib_number,
          `"${parts.name || ''}"`,
          `"${team.name || ''}"`,
          parts.dan_rank || '',
          parts.carriage || '',
          p.order_am1 || '',
          p.order_am2 || '',
          p.order_pm1 || '',
          p.score_am1 ?? '',
          p.score_am2 ?? '',
          p.score_pm1 ?? '',
          p.total_score ?? 0,
          p.provisional_ranking ?? '',
          p.final_ranking ?? '',
          p.semifinal_score ?? '',
          p.semifinal_results ?? '',
          p.status_am1 || '',
          p.is_absent ? '欠席' : '',
        ].join(',');
      })
      .join('\n');

    downloadCSV(
      header + rows,
      `大会データ_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // 採点簿 (空枠付き) エクスポート
  const handleExportScoreSheet = () => {
    if (!players || players.length === 0) return;

    // ヘッダー
    const header = '立順,No,氏名,所属,1射目,2射目,3射目,4射目,小計,確認印\n';

    // データ行 (AM1の立順でソートして出力する例)
    const sorted = [...players]
      .filter((p: any) => !p.is_absent && p.order_am1)
      .sort((a: any, b: any) => (a.order_am1 || 0) - (b.order_am1 || 0));

    const rows = sorted
      .map((p: any) => {
        const parts = p.participants || {};
        const team = parts.teams || {};
        return [
          p.order_am1,
          p.bib_number,
          `"${parts.name || ''}"`,
          `"${team.name || ''}"`,
          '',
          '',
          '',
          '',
          '',
          '', // 空欄
        ].join(',');
      })
      .join('\n');

    downloadCSV(
      header + rows,
      `採点簿_AM1_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // データリセット (全削除)
  const handleResetData = async () => {
    if (
      !window.confirm(
        '【警告】全てのデータを完全に削除します。\n実行前にバックアップ(エクスポート)を推奨します。\n本当によろしいですか？'
      )
    )
      return;
    if (!window.confirm('【最終確認】この操作は取り消せません。実行しますか？'))
      return;

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

  // スコアのみクリア
  const handleResetScores = async () => {
    if (
      !window.confirm(
        '全選手の「スコア」「順位」をクリアしますか？\n選手データや立順は保持されます。\n(リハーサル後の本番準備などに使用します)'
      )
    )
      return;

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('reset_scores_only');
      if (error) throw error;
      alert('スコアをクリアしました。');
      router.refresh();
    } catch (error) {
      alert('失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ステータスのみリセット
  const handleResetStatuses = async () => {
    if (
      !window.confirm('全選手の進行状況(呼出/行射など)を「待機」に戻しますか？')
    )
      return;

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('reset_statuses_only');
      if (error) throw error;
      alert('ステータスをリセットしました。');
      router.refresh();
    } catch (error) {
      alert('失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // CSVインポート (既存機能)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        setIsSaving(true);
        const rows = text
          .split('\n')
          .map((row) => row.trim())
          .filter((row) => row);
        const headers = rows[0].split(',').map((h) => h.trim());

        const requiredColumns = ['bib_number', 'player_name', 'team_name'];
        const missing = requiredColumns.filter((col) => !headers.includes(col));
        if (missing.length > 0)
          throw new Error(`必須カラム不足: ${missing.join(', ')}`);

        const jsonData = rows.slice(1).map((row) => {
          const values = row.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || null;
          });
          return obj;
        });

        const { error } = await supabase.rpc('import_tournament_data', {
          data: jsonData,
        });
        if (error) throw error;

        alert(`${jsonData.length}件インポートしました。`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh();
      } catch (error: any) {
        alert(`インポート失敗: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsText(file);
  };

  // ----------------------------------------------------------------
  // スナップショット管理
  // ----------------------------------------------------------------

  const handleCreateSnapshot = async () => {
    const label = prompt(
      'バックアップの名前を入力してください (例: 予選終了後)'
    );
    if (!label) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('create_snapshot', {
        p_label: label,
      });
      if (error) throw error;
      alert('バックアップを作成しました。');
      fetchSnapshots();
    } catch (error) {
      alert('作成に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreSnapshot = async (id: string, label: string) => {
    if (
      !window.confirm(
        `【警告】現在のデータを破棄し、バックアップ「${label}」の状態に戻します。\n本当によろしいですか？`
      )
    )
      return;

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('restore_snapshot', {
        p_snapshot_id: id,
      });
      if (error) throw error;
      alert('データを復元しました。');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('復元に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // フィルタリング
  // ----------------------------------------------------------------
  const filteredPlayers = players.filter((player: any) => {
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* タブナビゲーション */}
      <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'ダッシュボード', icon: Activity },
          { id: 'players', label: '参加者管理', icon: Users },
          { id: 'settings', label: '大会設定', icon: Settings },
          { id: 'data', label: 'データ管理', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <tab.icon size={18} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ダッシュボード */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Activity className="mr-2 text-blue-600" /> 進行状況の管理
              </h2>
              <label className="flex items-center cursor-pointer text-sm">
                <span className="mr-2 text-gray-500 font-bold">
                  {settings.show_phase ? '表示中' : '非表示'}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.show_phase ?? true}
                    onChange={(e) =>
                      handleSettingChange('show_phase', e.target.checked)
                    }
                  />
                  <div
                    className={`block w-10 h-6 rounded-full transition-colors ${
                      settings.show_phase ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.show_phase ? 'transform translate-x-4' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
            <div className="space-y-3 mb-4 grow">
              {[
                { val: 'preparing', label: '準備中。。。' },
                { val: 'qualifier', label: '予選進行中' },
                { val: 'tally', label: '集計中' },
                { val: 'final', label: '決勝進行中' },
                { val: 'finished', label: '全日程終了' },
              ].map((phase) => (
                <label
                  key={phase.val}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.current_phase === phase.val
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="phase"
                    value={phase.val}
                    checked={settings.current_phase === phase.val}
                    onChange={(e) =>
                      handleSettingChange('current_phase', e.target.value)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 font-bold text-gray-700">
                    {phase.label}
                  </span>
                  {settings.current_phase === phase.val && (
                    <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      現在
                    </span>
                  )}
                </label>
              ))}
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm active:scale-95"
            >
              {isSaving ? (
                <RefreshCw className="animate-spin mr-2" />
              ) : (
                <Save className="mr-2" />
              )}
              設定を更新
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Megaphone className="mr-2 text-orange-500" />{' '}
                運営からのお知らせ
              </h2>
              <label className="flex items-center cursor-pointer text-sm">
                <span className="mr-2 text-gray-500 font-bold">
                  {settings.show_announcement ? '表示中' : '非表示'}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.show_announcement ?? true}
                    onChange={(e) =>
                      handleSettingChange('show_announcement', e.target.checked)
                    }
                  />
                  <div
                    className={`block w-10 h-6 rounded-full transition-colors ${
                      settings.show_announcement
                        ? 'bg-orange-500'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.show_announcement
                        ? 'transform translate-x-4'
                        : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
            <div className="mb-4 grow">
              <p className="text-sm text-gray-500 mb-2">
                閲覧ページの上部に表示されるメッセージです。
              </p>
              <textarea
                value={settings.announcement || ''}
                onChange={(e) =>
                  handleSettingChange('announcement', e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-30 resize-none h-40"
                placeholder="例: 只今昼食休憩中です。再開は13:00を予定しています。"
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center shadow-sm active:scale-95"
            >
              {isSaving ? (
                <RefreshCw className="animate-spin mr-2" />
              ) : (
                <Save className="mr-2" />
              )}
              お知らせを配信
            </button>
          </div>
        </div>
      )}

      {/* 参加者管理 */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm flex items-start">
            <AlertTriangle
              className="text-yellow-600 mr-3 shrink-0 mt-0.5"
              size={20}
            />
            <div className="text-sm text-yellow-800">
              <p className="font-bold mb-1">欠席処理に関する重要な注意</p>
              <p className="leading-relaxed">
                「欠席にする」ボタンを押すと、対象者はリストから除外され、
                <strong>後続の全選手の立順が自動的に繰り上がります。</strong>
                <br />
                この操作はシステム上で取り消す（元に戻す）ことができません。操作は慎重に行ってください。
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Users className="mr-2" /> 参加者一覧 ({filteredPlayers.length}
                名)
              </h2>
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="名前、チーム、No.で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">No.</th>
                    <th className="px-6 py-3">氏名 / 所属</th>
                    <th className="px-6 py-3 text-center">状態</th>
                    <th className="px-6 py-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player: any) => (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        player.is_absent ? 'bg-gray-100 text-gray-400' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold">
                        {player.bib_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold">
                          {player.participants?.name}
                        </div>
                        <div className="text-xs">
                          {player.participants?.teams?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {player.is_absent ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            欠席
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            出席
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!player.is_absent && (
                          <button
                            onClick={() => handleMakeAbsent(player)}
                            disabled={isSaving}
                            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            <UserX size={14} className="mr-1" /> 欠席にする
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 大会設定 */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-2">
            <Settings className="mr-2" /> 大会基本設定
          </h2>
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Trophy size={16} className="mr-1 text-yellow-600" />{' '}
                個人入賞枠数
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={settings.individual_prize_count || 0}
                  onChange={(e) =>
                    handleSettingChange(
                      'individual_prize_count',
                      Number(e.target.value)
                    )
                  }
                  className="w-24 p-2 border border-gray-300 rounded-lg text-center font-bold"
                />
                <span className="ml-2 text-gray-700">位まで</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-gray-800 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-900 transition-colors flex items-center"
            >
              {isSaving ? (
                <RefreshCw className="animate-spin mr-2" />
              ) : (
                <Save className="mr-2" />
              )}
              設定を保存する
            </button>
          </div>
        </div>
      )}

      {/* データ管理 (新規追加) */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          {/* 1. バックアップと復元 (スナップショット) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Archive className="mr-2 text-purple-600" /> バックアップと復元
              </h2>
              <button
                onClick={handleCreateSnapshot}
                disabled={isSaving}
                className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 flex items-center"
              >
                <Save size={16} className="mr-1" /> 現在の状態を保存
              </button>
            </div>
            <div className="space-y-2">
              {snapshots.length === 0 && (
                <p className="text-gray-400 text-sm">
                  バックアップデータはありません。
                </p>
              )}
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-bold text-gray-800">{snap.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(snap.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreSnapshot(snap.id, snap.label)}
                    disabled={isSaving}
                    className="text-xs border border-purple-500 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-50 flex items-center"
                  >
                    <History size={14} className="mr-1" /> この状態に戻す
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. インポートとエクスポート */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSVインポート */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Upload className="mr-2 text-blue-600" /> データ登録 (CSV)
              </h2>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isSaving ? (
                      <RefreshCw className="w-8 h-8 mb-3 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    )}
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">
                        クリックしてCSVを選択
                      </span>
                    </p>
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

            {/* エクスポート */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Download className="mr-2 text-green-600" /> データ出力 (CSV)
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold text-gray-700"
                >
                  <FileText size={16} className="mr-2 text-gray-500" />{' '}
                  全データ(バックアップ用)
                </button>
                <button
                  onClick={handleExportScoreSheet}
                  className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold text-gray-700"
                >
                  <FileText size={16} className="mr-2 text-gray-500" />{' '}
                  採点簿(AM1・空枠付き)
                </button>
              </div>
            </div>
          </div>

          {/* 3. リセット操作 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
            <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center">
              <AlertTriangle className="mr-2" /> リセット操作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleResetScores}
                disabled={isSaving}
                className="py-3 px-4 rounded-lg bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 flex items-center justify-center border border-red-200"
              >
                <RotateCcw size={16} className="mr-2" /> スコアのみクリア
              </button>
              <button
                onClick={handleResetStatuses}
                disabled={isSaving}
                className="py-3 px-4 rounded-lg bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 flex items-center justify-center border border-red-200"
              >
                <RotateCcw size={16} className="mr-2" /> 進行状況リセット
              </button>
              <button
                onClick={handleResetData}
                disabled={isSaving}
                className="py-3 px-4 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 flex items-center justify-center shadow-md"
              >
                <Trash2 size={16} className="mr-2" /> 全データ完全削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
