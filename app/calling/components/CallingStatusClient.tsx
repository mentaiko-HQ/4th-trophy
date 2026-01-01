'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Users } from 'lucide-react';

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

// ステータス定義（値、ラベル、表示色）
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

  // 更新処理中のグループインデックスを保持するState（ローディング表示用）
  const [updatingGroupIndex, setUpdatingGroupIndex] = useState<number | null>(
    null
  );

  // ★追加: Supabase Realtime による自動更新 (DB変更検知)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('calling-status-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 全て
          schema: 'public',
          table: 'entries', // entriesテーブルを監視
        },
        () => {
          // 変更があったら画面をリフレッシュ（最新データを取得）
          // これによりポーリングなしで即座に他の端末の変更が反映されます
          router.refresh();
        }
      )
      .subscribe();

    // クリーンアップ関数: コンポーネントのアンマウント時に購読を解除
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // 現在のタブに応じた「ステータスカラム名」と「立順カラム名」を決定
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
  // そのタブでの立順（order_xxx）が設定されている選手のみを抽出し、立順の昇順に並べ替える
  const sortedPlayers = useMemo(() => {
    const filtered = players.filter((p) => (p as any)[targetOrderKey] !== null);
    return filtered.sort((a, b) => {
      const orderA = (a as any)[targetOrderKey] || 0;
      const orderB = (b as any)[targetOrderKey] || 0;
      return orderA - orderB;
    });
  }, [players, targetOrderKey]);

  // 2. グループ化
  // 5人ずつ（1立分）に分割する
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
    groupIndex: number
  ) => {
    setUpdatingGroupIndex(groupIndex); // 対象グループのローディング開始
    const supabase = createClient();

    try {
      const ids = groupPlayers.map((p) => p.id);
      // 対象グループ全員のステータスを一括更新
      const { error } = await supabase
        .from('entries')
        .update({ [targetStatusColumn]: newStatus })
        .in('id', ids);

      if (error) throw error;

      // 更新成功時は自動的にRealtime検知が走ってrefreshされますが、
      // 念のため手動でもrefreshを呼んでおくと確実です
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setUpdatingGroupIndex(null); // ローディング終了
    }
  };

  const handleTabChange = (tab: string) => {
    router.push(`/calling?tab=${tab}`);
  };

  // タブのデザインクラス生成
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
      {/* タブ切り替え */}
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
          午後1
        </button>
        <button
          onClick={() => handleTabChange('pm1')}
          className={getTabClass('pm1')}
        >
          午後2
        </button>
      </div>

      <div className="space-y-4">
        {/* 全グループを一覧表示 (ページネーションなし) */}
        {playerGroups.length > 0 ? (
          playerGroups.map((group, groupIndex) => {
            // 現在のグループの代表ステータスを取得（先頭の人を基準）
            const currentGroupStatus =
              (group[0] as any)[targetStatusColumn] || 'waiting';

            const pairIndex = groupIndex + 1; // グループインデックス + 1 = 組番号
            const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場'; // 偶数インデックス(奇数組)は第一、奇数インデックス(偶数組)は第二

            return (
              <div
                key={groupIndex}
                className="bg-white border border-[#7DA3A1]/30 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
                {/* 左側：メンバーリストエリア */}
                <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-[#7DA3A1]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#34675C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center">
                      <Users size={14} className="mr-1" /> 第{pairIndex}組 (
                      {shajo})
                    </span>
                    <span className="text-sm font-bold text-[#7DA3A1]">
                      立順: {(group[0] as any)[targetOrderKey] ?? '?'} 〜{' '}
                      {(group[group.length - 1] as any)[targetOrderKey] ?? '?'}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {group.map((p, idx) => (
                      <li
                        key={p.id}
                        className="flex items-center text-sm p-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        {/* 射位番号 (1-5) */}
                        <span className="w-8 text-center font-bold text-white bg-[#34675C] rounded-full h-6 flex items-center justify-center mr-3 text-xs shadow-sm">
                          {idx + 1}
                        </span>
                        {/* ゼッケン */}
                        <span className="w-16 font-mono text-[#324857] text-xs mr-2 font-bold bg-gray-100 px-1 py-0.5 rounded text-center">
                          No.{p.bib_number}
                        </span>
                        {/* 名前と所属 */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#324857] truncate">
                            {p.player_name}
                          </div>
                          <div className="text-xs text-[#7DA3A1] truncate">
                            {p.team_name}
                          </div>
                        </div>
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

                  {/* 現在の状態ラベル */}
                  <div
                    className={`text-center py-2 rounded-lg font-bold text-lg mb-2 shadow-sm border transition-all ${
                      STATUS_OPTIONS.find((o) => o.value === currentGroupStatus)
                        ?.color || 'bg-white'
                    }`}
                  >
                    {
                      STATUS_OPTIONS.find((o) => o.value === currentGroupStatus)
                        ?.label
                    }
                  </div>

                  {/* ステータス変更ボタン群 */}
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
                            currentGroupStatus === option.value
                              ? 'opacity-50 cursor-default bg-gray-200 text-gray-500 border-gray-200'
                              : 'bg-white text-[#324857] border-[#7DA3A1]/30 hover:bg-white hover:text-[#86AC41] hover:border-[#86AC41] shadow-sm active:scale-95'
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
          <div className="text-center py-12 text-[#7DA3A1] bg-white rounded-xl border border-dashed border-[#7DA3A1]/50">
            表示対象の選手がいません
          </div>
        )}
      </div>
    </div>
  );
}
