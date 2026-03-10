'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // 環境に合わせてパスを調整してください
import { TournamentSettings, PlayerEntry } from '@/types/tournament';


interface AdminPanelProps {
  initialPlayers: PlayerEntry[];
  initialSettings: TournamentSettings;
}

export default function AdminPanel({ initialSettings }: AdminPanelProps) {
  const [settings, setSettings] = useState<TournamentSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

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

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
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
  );
}