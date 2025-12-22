'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface AdminPanelProps {
  initialPlayers: any[];
  initialSettings: any;
}

export default function AdminPanel({
  initialPlayers,
  initialSettings,
}: AdminPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'players' | 'settings'
  >('dashboard');
  const [players, setPlayers] = useState(initialPlayers);
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // ----------------------------------------------------------------
  // データ更新ハンドラ
  // ----------------------------------------------------------------

  // 欠席処理（一方通行・立順繰り上げ）
  const handleMakeAbsent = async (player: any) => {
    const confirmMessage = `${player.participants?.name} (No.${player.bib_number}) を欠席にしますか？\n\n【重要】\n・この操作は取り消せません。\n・後続の選手の立順が自動的に繰り上がります。`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase.rpc('handle_absent_player', {
        target_player_id: player.id,
      });

      if (error) throw error;

      alert('欠席処理が完了しました。立順を繰り上げました。');

      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('処理に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 設定の保存
  const saveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('tournament_settings')
      .update({
        announcement: settings.announcement,
        individual_prize_count: settings.individual_prize_count,
        // team_prize_count: settings.team_prize_count, // 削除: 団体入賞枠は更新対象外
        current_phase: settings.current_phase,
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* タブナビゲーション */}
      <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
        {[
          { id: 'dashboard', label: 'ダッシュボード', icon: Activity },
          { id: 'players', label: '参加者管理', icon: Users },
          { id: 'settings', label: '大会設定', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md text-sm font-bold transition-all ${
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

      {/* =================================================================
          ダッシュボード
         ================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 進行フェーズ管理 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="mr-2 text-blue-600" /> 進行状況の管理
            </h2>
            <div className="space-y-3">
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
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                {isSaving ? (
                  <RefreshCw className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2" />
                )}
                進行状況を更新
              </button>
            </div>
          </div>

          {/* お知らせ配信 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Megaphone className="mr-2 text-orange-500" /> 運営からのお知らせ
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                閲覧ページの上部に表示されるメッセージです。
              </p>
              <textarea
                value={settings.announcement || ''}
                onChange={(e) =>
                  handleSettingChange('announcement', e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[120px]"
                placeholder="例: 只今昼食休憩中です。再開は13:00を予定しています。"
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
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
        <div className="space-y-4">
          {/* 注意文 */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm flex items-start">
            <AlertTriangle
              className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5"
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
                        {player.is_absent && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        該当する選手が見つかりません
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-2">
            <Settings className="mr-2" /> 大会基本設定
          </h2>

          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Trophy size={16} className="mr-1 text-yellow-600" />{' '}
                個人入賞枠数
              </label>
              <p className="text-xs text-gray-500 mb-2">
                上位何位までを入賞（表彰対象）とするか設定します。
              </p>
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

            {/* 団体入賞枠設定は削除しました */}
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
    </div>
  );
}
