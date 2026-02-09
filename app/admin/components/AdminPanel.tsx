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
  Check,
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
      `大会データ_${new Date().toISOString().slice(0, 10)}.csv`,
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
      `採点簿_AM1_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  // データリセット (全削除)
  const handleResetData = async () => {
    if (
      !window.confirm(
        '【警告】全てのデータを完全に削除します。\n実行前にバックアップ(エクスポート)を推奨します。\n本当によろしいですか？',
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
        '全選手の「スコア」「順位」をクリアしますか？\n選手データや立順は保持されます。\n(リハーサル後の本番準備などに使用します)',
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
      'バックアップの名前を入力してください (例: 予選終了後)',
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
        `【警告】現在のデータを破棄し、バックアップ「${label}」の状態に戻します。\n本当によろしいですか？`,
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans text-bk-brown">
      {/* タブナビゲーション */}
      <div className="flex space-x-2 bg-white/50 p-2 rounded-2xl border-2 border-bk-brown overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', label: 'ダッシュボード', icon: Activity },
          { id: 'players', label: '参加者管理', icon: Users },
          { id: 'settings', label: '大会設定', icon: Settings },
          { id: 'data', label: 'データ管理', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex-1 flex items-center justify-center py-3 px-4 rounded-full text-sm font-black transition-all whitespace-nowrap border-2
              ${
                activeTab === tab.id
                  ? 'bg-bk-brown text-white border-bk-brown shadow-sm'
                  : 'bg-white text-bk-brown border-transparent hover:border-bk-brown hover:bg-bk-beige'
              }
            `}
          >
            <tab.icon size={18} className="mr-2" strokeWidth={2.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================================================================
          ダッシュボード (進行管理 & お知らせ)
         ================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 進行フェーズ管理 */}
          <div className="bg-white p-6 rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.15)] flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 border-b-2 border-bk-brown/10 pb-4">
              <h2 className="text-xl font-black text-bk-brown flex items-center">
                <Activity className="mr-3 text-bk-blue" /> 進行状況
              </h2>
              <label className="flex items-center cursor-pointer text-sm">
                <span className="mr-2 text-bk-brown font-bold">
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
                    className={`block w-12 h-7 rounded-full transition-colors border-2 border-bk-brown ${settings.show_phase ? 'bg-bk-green' : 'bg-gray-300'}`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full border-2 border-bk-brown transition-transform ${settings.show_phase ? 'transform translate-x-5' : ''}`}
                  ></div>
                </div>
              </label>
            </div>

            <div className="space-y-3 mb-6 flex-grow">
              {[
                {
                  val: 'preparing',
                  label: '準備中。。。',
                  color: 'bg-teal-100 border-teal-700 text-teal-900',
                },
                {
                  val: 'qualifier',
                  label: '予選進行中',
                  color: 'bg-blue-100 border-blue-700 text-blue-900',
                },
                {
                  val: 'tally',
                  label: '集計中',
                  color: 'bg-bk-orange border-bk-brown text-bk-brown',
                },
                {
                  val: 'final',
                  label: '決勝進行中',
                  color: 'bg-bk-red border-bk-brown text-white',
                },
                {
                  val: 'finished',
                  label: '全日程終了',
                  color: 'bg-gray-200 border-gray-600 text-gray-800',
                },
              ].map((phase) => (
                <label
                  key={phase.val}
                  className={`
                  flex items-center p-3 rounded-xl border-4 cursor-pointer transition-all active:scale-[0.99]
                  ${
                    settings.current_phase === phase.val
                      ? `${phase.color} shadow-sm`
                      : 'bg-white border-gray-200 text-gray-500 hover:border-bk-brown/50'
                  }
                `}
                >
                  <div
                    className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3
                    ${settings.current_phase === phase.val ? 'bg-white border-bk-brown' : 'border-gray-300'}
                  `}
                  >
                    {settings.current_phase === phase.val && (
                      <div className="w-3 h-3 bg-bk-brown rounded-full" />
                    )}
                  </div>
                  <span className="font-black text-lg">{phase.label}</span>
                  {settings.current_phase === phase.val && (
                    <span className="ml-auto text-xs bg-bk-brown text-white px-3 py-1 rounded-full font-bold">
                      NOW
                    </span>
                  )}
                </label>
              ))}
            </div>

            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-bk-brown text-white font-black py-4 rounded-xl hover:bg-bk-brown/90 transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(80,35,20,0.3)] active:translate-y-[2px] active:shadow-none"
            >
              {isSaving ? (
                <RefreshCw className="animate-spin mr-2" />
              ) : (
                <Save className="mr-2" />
              )}
              設定を更新する
            </button>
          </div>

          {/* お知らせ配信 */}
          <div className="bg-white p-6 rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.15)] flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 border-b-2 border-bk-brown/10 pb-4">
              <h2 className="text-xl font-black text-bk-brown flex items-center">
                <Megaphone className="mr-3 text-bk-orange" /> お知らせ
              </h2>
              <label className="flex items-center cursor-pointer text-sm">
                <span className="mr-2 text-bk-brown font-bold">
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
                    className={`block w-12 h-7 rounded-full transition-colors border-2 border-bk-brown ${settings.show_announcement ? 'bg-bk-orange' : 'bg-gray-300'}`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full border-2 border-bk-brown transition-transform ${settings.show_announcement ? 'transform translate-x-5' : ''}`}
                  ></div>
                </div>
              </label>
            </div>

            <div className="mb-4 flex-grow">
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase">
                Message to Display
              </p>
              <textarea
                value={settings.announcement || ''}
                onChange={(e) =>
                  handleSettingChange('announcement', e.target.value)
                }
                className="w-full p-4 border-4 border-gray-300 rounded-xl focus:outline-none focus:border-bk-orange text-bk-brown font-medium min-h-30 resize-none h-48 placeholder:text-gray-300"
                placeholder="例: 只今昼食休憩中です。再開は13:00を予定しています。"
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-bk-orange text-bk-brown font-black py-4 rounded-xl hover:bg-bk-orange/90 transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(80,35,20,0.3)] active:translate-y-[2px] active:shadow-none border-2 border-bk-brown"
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

      {/* =================================================================
          参加者管理 (欠席設定)
         ================================================================= */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-4 border-bk-orange p-5 rounded-2xl shadow-sm flex items-start">
            <AlertTriangle
              className="text-bk-orange mr-4 shrink-0 mt-0.5"
              size={28}
              strokeWidth={2.5}
            />
            <div className="text-sm text-bk-brown">
              <p className="font-black text-lg mb-1">WARNING: 欠席処理</p>
              <p className="font-medium leading-relaxed">
                「欠席にする」ボタンを押すと、対象者はリストから除外され、
                <strong>後続の全選手の立順が自動的に繰り上がります。</strong>
                <br />
                この操作はシステム上で取り消す（元に戻す）ことができません。操作は慎重に行ってください。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.15)] overflow-hidden">
            <div className="p-5 border-b-4 border-bk-brown bg-bk-beige/20 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-black text-bk-brown flex items-center uppercase">
                <Users className="mr-3" /> Player List{' '}
                <span className="ml-2 text-sm bg-white px-3 py-1 rounded-full border-2 border-bk-brown">
                  {filteredPlayers.length}
                </span>
              </h2>
              <div className="relative w-full sm:w-72">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="NAME / TEAM / No."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:border-bk-brown focus:ring-0"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-bk-brown uppercase bg-bk-beige/50 border-b-2 border-bk-brown">
                  <tr>
                    <th className="px-6 py-4 font-black">No.</th>
                    <th className="px-6 py-4 font-black">Name / Team</th>
                    <th className="px-6 py-4 font-black text-center">Status</th>
                    <th className="px-6 py-4 font-black text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {filteredPlayers.map((player: any) => (
                    <tr
                      key={player.id}
                      className={`transition-colors ${player.is_absent ? 'bg-gray-50' : 'hover:bg-bk-beige/10'}`}
                    >
                      <td className="px-6 py-4 font-black text-bk-brown font-pop text-lg">
                        {player.bib_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-base text-bk-brown">
                          {player.participants?.name}
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          {player.participants?.teams?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {player.is_absent ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gray-200 text-gray-500 border border-gray-300">
                            欠席
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-bk-green text-white border border-bk-brown shadow-[2px_2px_0px_0px_rgba(80,35,20,0.5)]">
                            出席
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!player.is_absent && (
                          <button
                            onClick={() => handleMakeAbsent(player)}
                            disabled={isSaving}
                            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-black bg-white text-bk-red border-2 border-bk-red hover:bg-bk-red hover:text-white transition-all active:scale-95 shadow-sm"
                          >
                            <UserX size={16} className="mr-2" strokeWidth={3} />{' '}
                            欠席にする
                          </button>
                        )}
                        {player.is_absent && (
                          <span className="text-xl font-black text-gray-300">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-400 font-bold text-lg"
                      >
                        NO DATA
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          大会設定
         ================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.15)]">
          <h2 className="text-xl font-black text-bk-brown mb-8 flex items-center border-b-2 border-bk-brown/10 pb-4">
            <Settings className="mr-3 text-bk-brown" /> BASE SETTINGS
          </h2>

          <div className="grid grid-cols-1 gap-8 max-w-lg">
            <div>
              <label className="block text-base font-black text-bk-brown mb-3 flex items-center">
                <Trophy
                  size={20}
                  className="mr-2 text-bk-orange fill-bk-orange"
                />{' '}
                個人入賞枠数
              </label>
              <p className="text-xs font-bold text-gray-500 mb-3">
                上位何位までを入賞（表彰対象）とするか設定します。
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={settings.individual_prize_count || 0}
                  onChange={(e) =>
                    handleSettingChange(
                      'individual_prize_count',
                      Number(e.target.value),
                    )
                  }
                  className="w-24 p-3 border-4 border-bk-brown rounded-xl text-center font-black text-xl font-pop focus:outline-none focus:border-bk-orange"
                />
                <span className="text-lg font-bold text-bk-brown">位まで</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t-2 border-bk-brown/10 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-bk-brown text-white font-black py-3 px-8 rounded-xl hover:bg-bk-brown/90 transition-all flex items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none"
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

      {/* =================================================================
          データ管理 (新規追加)
         ================================================================= */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          {/* 1. バックアップと復元 (スナップショット) */}
          <div className="bg-white p-6 rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.15)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-bk-brown/10 pb-4 gap-4">
              <h2 className="text-xl font-black text-bk-brown flex items-center uppercase">
                <Archive className="mr-3 text-purple-600" /> BACKUP & RESTORE
              </h2>
              <button
                onClick={handleCreateSnapshot}
                disabled={isSaving}
                className="w-full sm:w-auto text-sm bg-purple-600 text-white px-5 py-3 rounded-xl font-black hover:bg-purple-700 flex items-center justify-center border-2 border-bk-brown shadow-sm active:translate-y-0.5"
              >
                <Save size={18} className="mr-2" /> SAVE SNAPSHOT
              </button>
            </div>
            <div className="space-y-3">
              {snapshots.length === 0 && (
                <p className="text-gray-400 font-bold text-center py-6">
                  バックアップデータはありません。
                </p>
              )}
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-bk-brown/30 transition-colors"
                >
                  <div>
                    <p className="font-bold text-bk-brown text-lg">
                      {snap.label}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1">
                      {new Date(snap.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreSnapshot(snap.id, snap.label)}
                    disabled={isSaving}
                    className="text-xs font-black border-2 border-purple-500 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 flex items-center active:scale-95"
                  >
                    <History size={16} className="mr-1.5" /> RESTORE
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSVインポート */}
            <div className="bg-white p-6 rounded-3xl border-4 border-bk-brown shadow-sm">
              <h2 className="text-lg font-black text-bk-brown mb-4 flex items-center uppercase">
                <Upload className="mr-2 text-bk-blue" /> Data Import
              </h2>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <FileText
                    className="text-blue-600 mr-2 mt-1 shrink-0"
                    size={20}
                  />
                  <div className="text-xs font-bold text-blue-900">
                    <p className="mb-2">CSV FORMAT (Header required)</p>
                    <code className="block bg-white p-2 rounded border border-blue-200 font-mono text-[10px] break-all leading-relaxed">
                      bib_number, player_name, team_name, dan_rank, carriage,
                      order_am1, order_am2, order_pm1
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-4 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-white hover:border-bk-brown transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isSaving ? (
                      <RefreshCw className="w-8 h-8 mb-3 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-bk-brown" />
                    )}
                    <p className="mb-1 text-sm text-gray-500 font-bold group-hover:text-bk-brown">
                      Click to upload CSV
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
            <div className="bg-white p-6 rounded-3xl border-4 border-bk-brown shadow-sm">
              <h2 className="text-lg font-black text-bk-brown mb-4 flex items-center uppercase">
                <Download className="mr-2 text-bk-green" /> Data Export
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center py-4 border-2 border-bk-brown rounded-xl hover:bg-bk-beige text-sm font-black text-bk-brown transition-all shadow-sm active:translate-y-0.5"
                >
                  <FileText size={18} className="mr-2 text-gray-500" /> ALL DATA
                  (Backup)
                </button>
                <button
                  onClick={handleExportScoreSheet}
                  className="w-full flex items-center justify-center py-4 border-2 border-bk-brown rounded-xl hover:bg-bk-beige text-sm font-black text-bk-brown transition-all shadow-sm active:translate-y-0.5"
                >
                  <FileText size={18} className="mr-2 text-gray-500" /> SCORE
                  SHEET (AM1)
                </button>
              </div>
            </div>
          </div>

          {/* 3. リセット操作 */}
          <div className="bg-white p-6 rounded-3xl border-4 border-bk-red shadow-sm">
            <h2 className="text-lg font-black text-bk-red mb-4 flex items-center uppercase">
              <AlertTriangle className="mr-2" /> DANGER ZONE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleResetScores}
                disabled={isSaving}
                className="py-3 px-4 rounded-xl bg-red-50 text-bk-red font-black text-sm hover:bg-red-100 flex items-center justify-center border-2 border-red-200"
              >
                <RotateCcw size={16} className="mr-2" /> スコアのみクリア
              </button>
              <button
                onClick={handleResetStatuses}
                disabled={isSaving}
                className="py-3 px-4 rounded-xl bg-red-50 text-bk-red font-black text-sm hover:bg-red-100 flex items-center justify-center border-2 border-red-200"
              >
                <RotateCcw size={16} className="mr-2" /> 進行状況リセット
              </button>
              <button
                onClick={handleResetData}
                disabled={isSaving}
                className="py-3 px-4 rounded-xl bg-bk-red text-white font-black text-sm hover:bg-[#a31b00] flex items-center justify-center shadow-md border-2 border-bk-brown"
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
