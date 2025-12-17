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

// ステータス定義 (色調整)
const STATUS_OPTIONS = [
  {
    value: 'waiting',
    label: '待機',
    color: 'bg-[#F0F4F5] text-[#7DA3A1] border-[#7DA3A1]/30',
  },
  {
    value: 'called',
    label: '呼出',
    color: 'bg-[#86AC41] text-white border-[#86AC41] animate-pulse shadow-md',
  },
  {
    value: 'shooting',
    label: '行射',
    color: 'bg-[#34675C] text-white border-[#34675C]',
  },
  {
    value: 'finished',
    label: '終了',
    color: 'bg-[#324857] text-white border-[#324857]',
  },
] as const;

export default function CallingStatusClient({ players, currentTab }: Props) {
  const router = useRouter();
  const [updatingGroupIndex, setUpdatingGroupIndex] = useState<number | null>(
    null
  );

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };
  const playerGroups = chunkArray(players, 5);

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

  const handleStatusChange = async (
    groupPlayers: PlayerData[],
    newStatus: string,
    groupIndex: number
  ) => {
    setUpdatingGroupIndex(groupIndex);
    const supabase = createClient();

    try {
      const ids = groupPlayers.map((p) => p.id);
      const { error } = await supabase
        .from('entries')
        .update({ [targetStatusColumn]: newStatus })
        .in('id', ids);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setUpdatingGroupIndex(null);
    }
  };

  const handleTabChange = (tab: string) => {
    router.push(`/calling?tab=${tab}`);
  };

  const getTabClass = (tabName: string) => {
    const baseClass =
      'flex-1 py-4 text-center font-bold text-sm sm:text-base transition-all duration-200 border-b-4 outline-none';
    const activeClass =
      'border-[#34675C] text-[#34675C] bg-white shadow-sm z-10 relative rounded-t-lg';
    const inactiveClass =
      'border-transparent text-[#7DA3A1] hover:text-[#34675C] hover:bg-[#7DA3A1]/10';
    return `${baseClass} ${
      currentTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex bg-[#7DA3A1]/20 p-1 rounded-t-xl overflow-hidden border-b border-[#7DA3A1]/30 mb-6">
        <button
          onClick={() => handleTabChange('am1')}
          className={getTabClass('am1')}
        >
          午前1
        </button>
        <button
          onClick={() => handleTabChange('am2')}
          className={getTabClass('am2')}
        >
          午前2
        </button>
        <button
          onClick={() => handleTabChange('pm1')}
          className={getTabClass('pm1')}
        >
          午後1
        </button>
      </div>

      <div className="space-y-4">
        {playerGroups.map((group, groupIndex) => {
          const currentStatusVal =
            (group[0] as any)[targetStatusColumn] || 'waiting';
          const pairIndex = Math.floor(groupIndex / 2) + 1;
          const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場';

          const startOrder = (group[0] as any)[targetOrderKey];
          const endOrder = (group[group.length - 1] as any)[targetOrderKey];

          return (
            <div
              key={groupIndex}
              className="bg-white border border-[#7DA3A1]/30 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              {/* 左側：メンバーリストエリア */}
              <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-[#7DA3A1]/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#34675C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    第{pairIndex}組-{shajo}
                  </span>
                  <span className="text-sm font-bold text-[#7DA3A1]">
                    立順: {startOrder ?? '?'} 〜 {endOrder ?? '?'}
                  </span>
                </div>

                <ul className="space-y-2">
                  {group.map((p, idx) => (
                    <li key={p.id} className="flex items-center text-sm">
                      <span className="w-6 text-center font-bold text-[#7DA3A1] mr-2 bg-[#F0F4F5] rounded">
                        {idx + 1}
                      </span>
                      <span className="w-16 font-mono text-[#324857] text-xs mr-2 font-bold">
                        ID:{p.bib_number}
                      </span>
                      <span className="font-bold text-[#324857] mr-2">
                        {p.player_name}
                      </span>
                      <span className="text-xs text-[#7DA3A1] truncate flex-1 text-right">
                        {p.team_name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 右側：ステータス操作エリア */}
              <div className="w-full md:w-48 bg-[#F0F4F5] p-4 flex flex-col justify-center gap-2">
                <div className="text-center mb-1">
                  <span className="text-xs font-bold text-[#7DA3A1]">
                    現在の状態
                  </span>
                </div>

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
                            ? 'opacity-50 cursor-default bg-gray-200 text-gray-500 border-gray-200'
                            : 'bg-white text-[#324857] border-[#7DA3A1]/30 hover:bg-white hover:text-[#86AC41] hover:border-[#86AC41] shadow-sm'
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
          <div className="text-center py-12 text-[#7DA3A1] bg-white rounded-xl border border-dashed border-[#7DA3A1]/50">
            表示対象の選手がいません
          </div>
        )}
      </div>
    </div>
  );
}
