'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Users, Loader2 } from 'lucide-react';

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

// ステータス定義 (デザイン変更)
const STATUS_OPTIONS = [
  {
    value: 'waiting',
    label: '待機',
    // 薄い茶色の枠線、背景白
    className: 'bg-white text-gray-400 border-gray-300 hover:bg-gray-50',
  },
  {
    value: 'called',
    label: '呼出',
    // 緑色、点滅アニメーション
    className: 'bg-bk-green text-white border-bk-green animate-pulse shadow-md',
  },
  {
    value: 'shooting',
    label: '行射',
    // 赤色
    className: 'bg-bk-red text-white border-bk-red',
  },
  {
    value: 'finished',
    label: '終了',
    // 茶色（完了）
    className: 'bg-bk-brown text-white border-bk-brown',
  },
] as const;

export default function CallingStatusClient({ players, currentTab }: Props) {
  const router = useRouter();

  // 更新中のグループインデックスを保持するState
  const [updatingGroupIndex, setUpdatingGroupIndex] = useState<number | null>(
    null,
  );

  // 現在のタブに応じたターゲットカラム設定
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

  // 1. フィルタリングとソート
  const sortedPlayers = useMemo(() => {
    const filtered = players.filter((p) => (p as any)[targetOrderKey] !== null);
    return filtered.sort((a, b) => {
      const orderA = (a as any)[targetOrderKey] || 0;
      const orderB = (b as any)[targetOrderKey] || 0;
      return orderA - orderB;
    });
  }, [players, targetOrderKey]);

  // 2. グループ化 (5人ずつ)
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const playerGroups = chunkArray(sortedPlayers, 5);

  // ステータス一括更新ハンドラ
  const handleStatusChange = async (
    groupPlayers: PlayerData[],
    newStatus: string,
    groupIndex: number,
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

  // タブのデザインクラス
  const getTabClass = (tabName: string) => {
    const baseClass =
      'flex-1 py-3 px-1 text-center font-black text-sm md:text-base transition-all duration-200 border-b-4 outline-none uppercase font-pop';
    const activeClass =
      'border-bk-orange text-bk-brown bg-white shadow-sm rounded-t-lg';
    const inactiveClass =
      'border-transparent text-gray-500 hover:text-bk-brown hover:bg-bk-brown/5';
    return `${baseClass} ${
      currentTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* タブ切り替え */}
      <div className="flex bg-white/50 p-2 rounded-xl overflow-hidden border-2 border-bk-brown mb-6">
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
          午後1
        </button>
        <button
          onClick={() => handleTabChange('pm1')}
          className={getTabClass('pm1')}
        >
          午後2
        </button>
      </div>

      <div className="space-y-6">
        {/* 全グループを一覧表示 */}
        {playerGroups.length > 0 ? (
          playerGroups.map((group, groupIndex) => {
            // 現在のグループの代表ステータスを取得
            const currentGroupStatus =
              (group[0] as any)[targetStatusColumn] || 'waiting';

            const pairIndex = groupIndex + 1;
            const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場';

            const isUpdating = updatingGroupIndex === groupIndex;

            return (
              <div
                key={groupIndex}
                className="bg-white border-4 border-bk-brown rounded-3xl shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)] overflow-hidden flex flex-col md:flex-row"
              >
                {/* 左側：メンバーリストエリア */}
                <div className="flex-1 p-5 border-b-4 md:border-b-0 md:border-r-4 border-bk-brown/10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-bk-brown text-white text-sm font-black px-4 py-1.5 rounded-full uppercase flex items-center shadow-sm">
                      <Users size={16} className="mr-2" /> GROUP {pairIndex}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-gray-500">
                      - {shajo}
                    </span>
                    <span className="ml-auto text-xs font-bold text-bk-brown bg-bk-beige px-2 py-1 rounded">
                      立順: {(group[0] as any)[targetOrderKey] ?? '?'} 〜{' '}
                      {(group[group.length - 1] as any)[targetOrderKey] ?? '?'}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {group.map((p, idx) => (
                      <li
                        key={p.id}
                        className="flex items-center text-sm p-2 rounded-xl hover:bg-bk-beige/30 transition-colors border-2 border-transparent hover:border-bk-brown/10"
                      >
                        {/* 射位番号 */}
                        <span className="w-8 h-8 flex-shrink-0 text-center font-black text-white bg-bk-green rounded-full flex items-center justify-center mr-3 text-sm shadow-sm border-2 border-bk-brown">
                          {idx + 1}
                        </span>
                        {/* ゼッケン */}
                        <span className="w-16 flex-shrink-0 font-pop font-black text-bk-brown text-xs mr-3 bg-white border-2 border-bk-brown px-1 py-1 rounded text-center">
                          No.{p.bib_number}
                        </span>
                        {/* 名前と所属 */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-bk-brown truncate text-base">
                            {p.player_name}
                          </div>
                          <div className="text-xs text-gray-500 font-bold truncate">
                            {p.team_name}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 右側：ステータス操作エリア */}
                <div className="w-full md:w-56 bg-bk-beige/20 p-5 flex flex-col justify-center gap-3">
                  <div className="text-center mb-1">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      STATUS
                    </span>
                  </div>

                  {/* 現在の状態ラベル */}
                  <div
                    className={`
                        text-center py-3 rounded-xl font-black text-xl mb-2 border-4 transition-all uppercase
                        ${
                          STATUS_OPTIONS.find(
                            (o) => o.value === currentGroupStatus,
                          )?.className ||
                          'bg-white border-gray-300 text-gray-400'
                        }
                    `}
                  >
                    {isUpdating ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin mr-2" /> 更新中...
                      </span>
                    ) : (
                      STATUS_OPTIONS.find((o) => o.value === currentGroupStatus)
                        ?.label
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleStatusChange(group, option.value, groupIndex)
                        }
                        disabled={isUpdating}
                        className={`
                          py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all uppercase
                          ${
                            currentGroupStatus === option.value
                              ? 'opacity-40 cursor-default bg-gray-200 text-gray-500 border-gray-300'
                              : 'bg-white text-bk-brown border-bk-brown/30 hover:border-bk-brown hover:bg-bk-brown hover:text-white active:scale-95 shadow-sm'
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
          })
        ) : (
          <div className="text-center py-16 text-gray-400 font-bold bg-white/50 rounded-3xl border-4 border-dashed border-gray-300">
            表示対象の選手がいません
          </div>
        )}
      </div>
    </div>
  );
}
