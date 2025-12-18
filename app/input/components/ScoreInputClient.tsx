'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Target, Loader2, Plus, Minus } from 'lucide-react';

// 【修正箇所】export を明示して外部から参照可能にする
export type PlayerData = {
  id: string;
  team_name: string;
  player_name: string;
  bib_number: string | number;
  order_am1: number | null;
  order_am2: number | null;
  order_pm1: number | null;
  score_am1: number | null;
  score_am2: number | null;
  score_pm1: number | null;
  total_score: number;
  provisional_ranking: number | null;
  playoff_type: 'izume' | 'enkin' | null;
  semifinal_score: number | null;
  semifinal_results: number | null;
};

type Props = {
  players: PlayerData[];
  currentTab: string;
};

// --------------------------------------------------
// モーダルコンポーネント（予選スコア入力用）
// --------------------------------------------------
const ScoreInputModal = ({
  label,
  maxScore,
  groupPlayers,
  groupIndex,
  onClose,
  onSaveSuccess,
}: {
  label: string;
  maxScore: number;
  groupPlayers: PlayerData[];
  groupIndex: number;
  onClose: () => void;
  onSaveSuccess: () => void;
}) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialScores: Record<string, number> = {};
    groupPlayers.forEach((p) => {
      let currentScore: number | null = null;
      if (label === '午前1') currentScore = p.score_am1;
      else if (label === '午前2') currentScore = p.score_am2;
      else if (label === '午後1') currentScore = p.score_pm1;

      if (currentScore !== null) {
        initialScores[p.id] = currentScore;
      }
    });
    setScores(initialScores);
  }, [groupPlayers, label]);

  const handleScoreSelect = (id: string, score: number) => {
    setScores((prev) => ({ ...prev, [id]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      let targetColumn = '';
      if (label === '午前1') targetColumn = 'score_am1';
      else if (label === '午前2') targetColumn = 'score_am2';
      else if (label === '午後1') targetColumn = 'score_pm1';

      if (!targetColumn) throw new Error('保存先のカラムが特定できません');

      const updates = Object.entries(scores).map(async ([id, score]) => {
        const { error } = await supabase
          .from('entries')
          .update({ [targetColumn]: score })
          .eq('id', id);
        if (error) throw error;
      });

      await Promise.all(updates);
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllSelected = Object.keys(scores).length === groupPlayers.length;
  const pairIndex = Math.floor(groupIndex / 2) + 1;
  const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#324857]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center bg-[#34675C] px-6 py-4 border-b border-[#324857]/10">
          <div>
            <h3 className="text-xl font-bold text-white">
              {label} - 第{pairIndex}組-{shajo}
            </h3>
            <span className="text-sm text-[#7DA3A1] text-white/80">
              範囲: 0 〜 {maxScore}中
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#86AC41] p-2 font-bold transition-colors"
          >
            ✕ 閉じる
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-[#F0F4F5]">
          <form id="score-form" onSubmit={handleSubmit} className="space-y-6">
            {groupPlayers.map((player) => {
              let orderNumber: number | null = null;
              if (label === '午前1') orderNumber = player.order_am1;
              else if (label === '午前2') orderNumber = player.order_am2;
              else if (label === '午後1') orderNumber = player.order_pm1;

              return (
                <div
                  key={player.id}
                  className="bg-white p-4 rounded-lg border border-[#7DA3A1]/30 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="inline-block bg-[#324857] text-white text-xs font-bold px-2 py-0.5 rounded mr-2">
                        立順: {orderNumber ?? '-'}
                      </span>
                      <span className="inline-block bg-[#7DA3A1]/20 text-[#324857] text-xs font-bold px-2 py-0.5 rounded border border-[#7DA3A1]/30">
                        No.{player.bib_number}
                      </span>
                      <div className="font-bold text-lg mt-1 text-[#324857]">
                        {player.player_name}
                      </div>
                      <div className="text-xs text-[#7DA3A1] font-bold">
                        {player.team_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: maxScore + 1 }).map((_, score) => {
                      const isSelected = scores[player.id] === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreSelect(player.id, score)}
                          className={`
                            flex-1 min-w-[3rem] h-12 rounded-lg font-bold text-lg transition-all
                            ${
                              isSelected
                                ? 'bg-[#86AC41] text-white shadow-md ring-2 ring-[#34675C] scale-105'
                                : 'bg-white text-[#324857] border border-[#7DA3A1]/50 hover:bg-[#7DA3A1]/20'
                            }
                          `}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </form>
        </div>

        <div className="bg-white px-6 py-4 border-t border-[#7DA3A1]/30 flex justify-between items-center">
          <span className="text-sm font-bold text-[#324857]">
            入力状況:{' '}
            <span
              className={isAllSelected ? 'text-[#86AC41]' : 'text-[#324857]'}
            >
              {Object.keys(scores).length}
            </span>{' '}
            / {groupPlayers.length}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#7DA3A1] font-bold hover:bg-[#F0F4F5] rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              form="score-form"
              disabled={!isAllSelected || isSubmitting}
              className={`
                        px-6 py-2 rounded-lg font-bold text-white shadow-sm transition-all
                        ${
                          isAllSelected && !isSubmitting
                            ? 'bg-[#34675C] hover:bg-[#86AC41] hover:shadow-md'
                            : 'bg-gray-300 cursor-not-allowed'
                        }
                    `}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中...
                </div>
              ) : (
                '保存する'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// メインコンポーネント: 成績入力画面
// --------------------------------------------------
export default function ScoreInputClient({ players, currentTab }: Props) {
  const router = useRouter();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePlayoffSelect = async (
    playerId: string,
    type: 'izume' | 'enkin' | null
  ) => {
    setLoadingId(playerId);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('entries')
        .update({ playoff_type: type })
        .eq('id', playerId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('更新に失敗しました');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateValue = async (
    playerId: string,
    column: 'semifinal_score' | 'semifinal_results',
    currentValue: number | null,
    delta: number
  ) => {
    setLoadingId(playerId);
    const supabase = createClient();

    const baseValue = currentValue ?? 0;
    const newValue = Math.max(0, baseValue + delta);

    try {
      const { error } = await supabase
        .from('entries')
        .update({ [column]: newValue })
        .eq('id', playerId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('更新に失敗しました');
    } finally {
      setLoadingId(null);
    }
  };

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const playerGroups = chunkArray(players, 5);

  let label = '午前1';
  let maxScore = 2;
  if (currentTab === 'am2') {
    label = '午前2';
    maxScore = 2;
  }
  if (currentTab === 'pm1') {
    label = '午後1';
    maxScore = 4;
  }
  if (currentTab === 'final') {
    label = '決勝';
    maxScore = 0;
  }

  const handleTabChange = (tab: string) => {
    router.push(`/input?tab=${tab}`);
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
    <div className="max-w-3xl mx-auto pb-10">
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
        <button
          onClick={() => handleTabChange('final')}
          className={getTabClass('final')}
        >
          決勝・集計
        </button>
      </div>

      {currentTab === 'final' ? (
        <div className="space-y-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white border border-[#E8ECEF] rounded-xl shadow-sm overflow-hidden"
            >
              {/* 1行目 */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {player.provisional_ranking && (
                    <div className="flex flex-col items-center justify-center w-10 h-10 bg-[#34675C] rounded-full text-white shadow-sm flex-shrink-0">
                      <span className="text-xs font-bold leading-none">
                        Rank
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {player.provisional_ranking}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold bg-[#E8ECEF] text-[#7B8B9A] px-1.5 py-0.5 rounded">
                        No.{player.bib_number}
                      </span>
                      <div className="font-bold text-[#324857] truncate text-lg">
                        {player.player_name}
                      </div>
                    </div>
                    <div className="text-xs text-[#7B8B9A] truncate font-bold">
                      {player.team_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2行目 */}
              <div className="flex border-t border-[#E8ECEF] bg-[#F8FAFC]">
                <div className="flex-1 py-3 flex flex-col items-center justify-center border-r border-[#E8ECEF]">
                  <div className="flex items-center text-xs text-[#7B8B9A] mb-1 font-medium">
                    <Target size={14} className="mr-1" />
                    <span>合計的中数</span>
                  </div>
                  <div className="text-xl font-bold text-[#324857]">
                    {player.total_score}
                    <span className="text-xs font-normal text-[#7B8B9A] ml-1">
                      中
                    </span>
                  </div>
                </div>

                <div className="flex-1 py-3 flex flex-col items-center justify-center">
                  <div className="flex items-center text-xs text-[#7B8B9A] mb-1 font-medium">
                    <Trophy size={14} className="mr-1" />
                    <span>暫定順位</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-[#324857]">
                      {player.provisional_ranking
                        ? `${player.provisional_ranking}位`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3行目: 決勝区分選択エリア (修正箇所) */}
              <div className="p-3 bg-white border-t border-[#E8ECEF] grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 射詰エリア */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#E8ECEF] bg-gray-50/50">
                  {/* 射詰ボタン (小さく) */}
                  <button
                    onClick={() =>
                      handlePlayoffSelect(
                        player.id,
                        player.playoff_type === 'izume' ? null : 'izume'
                      )
                    }
                    disabled={loadingId === player.id}
                    className={`
                        py-1.5 px-3 rounded text-xs font-bold transition-all border flex items-center justify-center whitespace-nowrap h-8
                        ${
                          player.playoff_type === 'izume'
                            ? 'bg-[#CD2C58] text-white border-[#CD2C58] shadow-sm'
                            : 'bg-white text-[#7DA3A1] border-[#7DA3A1]/30 hover:border-[#CD2C58] hover:text-[#CD2C58]'
                        }
                      `}
                  >
                    {loadingId === player.id &&
                    player.playoff_type !== 'izume' ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    射詰
                  </button>

                  {/* 射詰的中数カウンター */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-[#7B8B9A] font-bold mb-1 mr-1">
                      射詰的中数
                    </span>
                    <div className="flex items-center bg-white rounded-md border border-[#E8ECEF] shadow-sm h-8">
                      <button
                        onClick={() =>
                          handleUpdateValue(
                            player.id,
                            'semifinal_score',
                            player.semifinal_score,
                            -1
                          )
                        }
                        disabled={loadingId === player.id}
                        className="px-2 py-1 text-gray-500 hover:text-[#CD2C58] hover:bg-red-50 rounded-l-md disabled:opacity-50 h-full flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-bold text-[#324857] text-sm">
                        {player.semifinal_score ?? 0}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateValue(
                            player.id,
                            'semifinal_score',
                            player.semifinal_score,
                            1
                          )
                        }
                        disabled={loadingId === player.id}
                        className="px-2 py-1 text-gray-500 hover:text-[#CD2C58] hover:bg-red-50 rounded-r-md disabled:opacity-50 h-full flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 遠近エリア */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#E8ECEF] bg-gray-50/50">
                  {/* 遠近ボタン (小さく) */}
                  <button
                    onClick={() =>
                      handlePlayoffSelect(
                        player.id,
                        player.playoff_type === 'enkin' ? null : 'enkin'
                      )
                    }
                    disabled={loadingId === player.id}
                    className={`
                        py-1.5 px-3 rounded text-xs font-bold transition-all border flex items-center justify-center whitespace-nowrap h-8
                        ${
                          player.playoff_type === 'enkin'
                            ? 'bg-[#34675C] text-white border-[#34675C] shadow-sm'
                            : 'bg-white text-[#7DA3A1] border-[#7DA3A1]/30 hover:border-[#34675C] hover:text-[#34675C]'
                        }
                      `}
                  >
                    {loadingId === player.id &&
                    player.playoff_type !== 'enkin' ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    遠近
                  </button>

                  {/* 射遠順位カウンター */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-[#7B8B9A] font-bold mb-1 mr-1">
                      射遠順位
                    </span>
                    <div className="flex items-center bg-white rounded-md border border-[#E8ECEF] shadow-sm h-8">
                      <button
                        onClick={() =>
                          handleUpdateValue(
                            player.id,
                            'semifinal_results',
                            player.semifinal_results,
                            -1
                          )
                        }
                        disabled={loadingId === player.id}
                        className="px-2 py-1 text-gray-500 hover:text-[#34675C] hover:bg-green-50 rounded-l-md disabled:opacity-50 h-full flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-bold text-[#324857] text-sm">
                        {player.semifinal_results ?? 0}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateValue(
                            player.id,
                            'semifinal_results',
                            player.semifinal_results,
                            1
                          )
                        }
                        disabled={loadingId === player.id}
                        className="px-2 py-1 text-gray-500 hover:text-[#34675C] hover:bg-green-50 rounded-r-md disabled:opacity-50 h-full flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="text-center py-10 text-[#7DA3A1]">
              データがありません
            </div>
          )}
        </div>
      ) : (
        // 予選タブUI
        <div className="space-y-4">
          {playerGroups.map((group, groupIndex) => {
            const filledCount = group.filter((p) => {
              if (label === '午前1') return p.score_am1 !== null;
              if (label === '午前2') return p.score_am2 !== null;
              if (label === '午後1') return p.score_pm1 !== null;
              return false;
            }).length;

            const isComplete = filledCount === group.length;
            const pairIndex = Math.floor(groupIndex / 2) + 1;
            const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場';

            return (
              <div
                key={groupIndex}
                className="bg-white border border-[#7DA3A1]/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[#324857] border-l-4 border-[#86AC41] pl-3">
                        第{pairIndex}組-{shajo}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isComplete
                            ? 'bg-[#86AC41]/20 text-[#34675C]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isComplete
                          ? '入力完了'
                          : `入力済み: ${filledCount}/${group.length}`}
                      </span>
                    </div>
                    <div className="text-sm text-[#7DA3A1] pl-3 truncate font-medium">
                      {group.map((p) => p.player_name).join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGroupIndex(groupIndex)}
                    className={`
                      w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2
                      ${
                        isComplete
                          ? 'bg-[#34675C] hover:bg-[#324857]'
                          : 'bg-[#86AC41] hover:bg-[#34675C]'
                      }
                    `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    {isComplete ? '修正する' : '成績入力'}
                  </button>
                </div>
              </div>
            );
          })}

          {playerGroups.length === 0 && (
            <div className="text-center py-10 text-[#7DA3A1] bg-white rounded-xl border border-dashed border-[#7DA3A1]/50">
              表示対象の選手がいません
            </div>
          )}
        </div>
      )}

      {selectedGroupIndex !== null && (
        <ScoreInputModal
          label={label}
          maxScore={maxScore}
          groupPlayers={playerGroups[selectedGroupIndex]}
          groupIndex={selectedGroupIndex}
          onClose={() => setSelectedGroupIndex(null)}
          onSaveSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
