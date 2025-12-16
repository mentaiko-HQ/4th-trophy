'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export type PlayerData = {
  id: string;
  team_name: string;
  player_name: string;
  bib_number: string | number;
  order_am1: number | null;
  order_am2: number | null;
  order_pm1: number | null;
  status_am1: string;
  status_am2: string;
  status_pm1: string;
};

type Props = {
  players: PlayerData[];
  currentTab: string;
};

// ステータス定義
const STATUS_OPTIONS = [
  {
    value: 'waiting',
    label: '待機',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  {
    value: 'called',
    label: '呼出',
    color: 'bg-[#CD2C58] text-white border-[#CD2C58] animate-pulse',
  },
  {
    value: 'shooting',
    label: '行射',
    color: 'bg-blue-600 text-white border-blue-600',
  },
  {
    value: 'finished',
    label: '終了',
    color: 'bg-green-600 text-white border-green-600',
  },
] as const;

export default function CallingStatusClient({ players, currentTab }: Props) {
  const router = useRouter();
  const [updatingGroupIndex, setUpdatingGroupIndex] = useState<number | null>(
    null
  );

  // 5人ごとに分割
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };
  const playerGroups = chunkArray(players, 5);

  // タブ設定
  let targetStatusColumn = 'status_am1';
  let targetOrderKey: keyof PlayerData = 'order_am1';

  if (currentTab === 'am2') {
    targetStatusColumn = 'status_am2';
    targetOrderKey = 'order_am2';
  }
  if (currentTab === 'pm1') {
    targetStatusColumn = 'status_pm1';
    targetOrderKey = 'order_pm1';
  }

  // ステータス更新処理（グループ一括）
  const handleStatusChange = async (
    groupPlayers: PlayerData[],
    newStatus: string,
    groupIndex: number
  ) => {
    setUpdatingGroupIndex(groupIndex);
    const supabase = createClient();

    try {
      // グループ全員のIDを取得
      const ids = groupPlayers.map((p) => p.id);

      // 一括アップデート
      const { error } = await supabase
        .from('entries')
        .update({ [targetStatusColumn]: newStatus })
        .in('id', ids);

      if (error) throw error;

      // 画面リフレッシュ
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setUpdatingGroupIndex(null);
    }
  };

  // タブ切り替え
  const handleTabChange = (tab: string) => {
    router.push(`/calling?tab=${tab}`);
  };

  const getTabClass = (tabName: string) => {
    const baseClass =
      'flex-1 py-4 text-center font-bold text-sm sm:text-base transition-all duration-200 border-b-4 outline-none';
    const activeClass =
      'border-[#CD2C58] text-[#CD2C58] bg-white shadow-sm z-10 relative';
    const inactiveClass =
      'border-transparent text-gray-500 hover:text-[#CD2C58] hover:bg-[#FFE6D4]';
    return `${baseClass} ${
      currentTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* タブナビゲーション */}
      <div className="flex bg-[#FFE6D4] p-1 rounded-t-xl overflow-hidden border-b border-[#FFC69D] mb-6">
        <button
          onClick={() => handleTabChange('am1')}
          className={`rounded-t-lg ${getTabClass('am1')}`}
        >
          午前1
        </button>
        <button
          onClick={() => handleTabChange('am2')}
          className={`rounded-t-lg ${getTabClass('am2')}`}
        >
          午前2
        </button>
        <button
          onClick={() => handleTabChange('pm1')}
          className={`rounded-t-lg ${getTabClass('pm1')}`}
        >
          午後1
        </button>
      </div>

      <div className="space-y-4">
        {playerGroups.map((group, groupIndex) => {
          // グループの代表ステータスを取得（基本は全員同じはずだが、先頭の人の値を使用）
          const currentStatusVal =
            (group[0] as any)[targetStatusColumn] || 'waiting';
          const pairIndex = Math.floor(groupIndex / 2) + 1;
          const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場';

          // 立順の開始・終了番号
          const startOrder = (group[0] as any)[targetOrderKey];
          const endOrder = (group[group.length - 1] as any)[targetOrderKey];

          return (
            <div
              key={groupIndex}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              {/* 左側：メンバーリストエリア */}
              <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#FFE6D4] text-[#CD2C58] text-xs font-bold px-3 py-1 rounded-full">
                    第{pairIndex}組-{shajo}
                  </span>
                  <span className="text-sm font-bold text-gray-500">
                    立順: {startOrder ?? '?'} 〜 {endOrder ?? '?'}
                  </span>
                </div>

                <ul className="space-y-2">
                  {group.map((p, idx) => (
                    <li key={p.id} className="flex items-center text-sm">
                      <span className="w-6 text-center font-bold text-gray-400 mr-2">
                        {idx + 1}
                      </span>
                      <span className="w-16 font-mono text-gray-500 text-xs mr-2">
                        ID:{p.bib_number}
                      </span>
                      <span className="font-bold text-gray-800 mr-2">
                        {p.player_name}
                      </span>
                      <span className="text-xs text-gray-400 truncate flex-1 text-right">
                        {p.team_name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 右側：ステータス操作エリア */}
              <div className="w-full md:w-48 bg-gray-50 p-4 flex flex-col justify-center gap-2">
                <div className="text-center mb-1">
                  <span className="text-xs font-bold text-gray-400">
                    現在の状態
                  </span>
                </div>

                {/* 現在のステータス表示 */}
                <div
                  className={`text-center py-2 rounded-lg font-bold text-lg mb-2 shadow-sm border ${
                    STATUS_OPTIONS.find((o) => o.value === currentStatusVal)
                      ?.color || 'bg-white'
                  }`}
                >
                  {
                    STATUS_OPTIONS.find((o) => o.value === currentStatusVal)
                      ?.label
                  }
                </div>

                {/* 切り替えボタン群 */}
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleStatusChange(group, option.value, groupIndex)
                      }
                      disabled={updatingGroupIndex === groupIndex}
                      className={`
                        py-2 px-1 rounded text-xs font-bold border transition-all
                        ${
                          currentStatusVal === option.value
                            ? 'opacity-50 cursor-default bg-gray-200 text-gray-500 border-gray-200' // 選択中は無効化
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-white hover:text-[#CD2C58] hover:border-[#CD2C58] shadow-sm'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {playerGroups.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-[#FFC69D]">
            表示対象の選手がいません
          </div>
        )}
      </div>
    </div>
  );
}
