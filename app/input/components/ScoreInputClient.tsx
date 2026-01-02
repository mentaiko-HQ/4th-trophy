'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Trophy,
  Target,
  Loader2,
  Plus,
  Minus,
  Edit2,
  Check,
  Calculator,
  RotateCcw,
} from 'lucide-react';

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
  final_ranking?: number | null;
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
    setScores((prev) => {
      const currentScore = prev[id];
      if (currentScore === score) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: score };
    });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#324857]/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 修正: max-w-7xl に拡張して横幅を確保 */}
      <div className="bg-white w-full max-w-7xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center bg-[#34675C] px-6 py-4 border-b border-[#324857]/10 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">
              {label} - 第{pairIndex}組-{shajo}
            </h3>
            <span className="text-sm text-white/80">
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

        <div className="p-4 overflow-y-auto flex-1 bg-[#F0F4F5]">
          {/* 修正: md:grid-cols-5 で横並びに変更 */}
          <form
            id="score-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-5 gap-3 h-full content-start"
          >
            {groupPlayers.map((player) => {
              let orderNumber: number | null = null;
              if (label === '午前1') orderNumber = player.order_am1;
              else if (label === '午前2') orderNumber = player.order_am2;
              else if (label === '午後1') orderNumber = player.order_pm1;

              return (
                <div
                  key={player.id}
                  className="bg-white p-3 rounded-lg border border-[#7DA3A1]/30 shadow-sm flex flex-col h-full"
                >
                  {/* ヘッダー情報 */}
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <span className="inline-block bg-[#324857] text-white text-xs font-bold px-2 py-0.5 rounded">
                      立順: {orderNumber ?? '-'}
                    </span>
                    <span className="font-mono text-[#324857] text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">
                      No.{player.bib_number}
                    </span>
                  </div>

                  {/* 選手情報 */}
                  <div className="mb-4 text-center flex-1 flex flex-col justify-center">
                    <div className="font-bold text-lg leading-tight text-[#324857] mb-1">
                      {player.player_name}
                    </div>
                    <div className="text-xs text-[#7DA3A1] font-bold truncate">
                      {player.team_name}
                    </div>
                  </div>

                  {/* スコアボタンエリア */}
                  <div className="flex flex-col gap-2 mt-auto">
                    {Array.from({ length: maxScore + 1 }).map((_, score) => {
                      const isSelected = scores[player.id] === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreSelect(player.id, score)}
                          className={`
                            w-full h-10 rounded-md font-bold text-lg transition-all border
                            ${
                              isSelected
                                ? 'bg-[#86AC41] text-white border-[#86AC41] shadow-md ring-2 ring-[#34675C] ring-offset-1 z-10'
                                : 'bg-white text-[#324857] border-[#E8ECEF] hover:bg-gray-50 hover:border-[#7DA3A1]/50'
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

        <div className="bg-white px-6 py-4 border-t border-[#7DA3A1]/30 flex justify-between items-center shrink-0">
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

  // Optimistic UI用のローカル状態
  const [optimisticPlayers, setOptimisticPlayers] =
    useState<PlayerData[]>(players);

  // 編集中のデータを保持するState
  const [editingData, setEditingData] = useState<Record<string, PlayerData>>(
    {}
  );

  // 保存処理中のID
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 直近で保存したデータを一時的に保持する
  const [lastSavedData, setLastSavedData] = useState<
    Record<string, PlayerData>
  >({});

  // 計算中・リセット中フラグ
  const [isProcessing, setIsProcessing] = useState(false);

  // Supabase Realtime による自動更新
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('score-input-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // サーバーからのデータ(players)が更新されたらローカル状態も同期する
  useEffect(() => {
    setOptimisticPlayers((prevOptimistic) => {
      return players.map((serverPlayer) => {
        const saved = lastSavedData[serverPlayer.id];

        if (saved) {
          const isServerDataUpdated =
            serverPlayer.semifinal_score === saved.semifinal_score &&
            serverPlayer.semifinal_results === saved.semifinal_results &&
            serverPlayer.playoff_type === saved.playoff_type;

          if (isServerDataUpdated) {
            return serverPlayer;
          } else {
            return { ...serverPlayer, ...saved };
          }
        }

        return serverPlayer;
      });
    });
  }, [players, lastSavedData]);

  const startEditing = (player: PlayerData) => {
    setEditingData((prev) => ({
      ...prev,
      [player.id]: { ...player },
    }));
  };

  const toggleLocalPlayoffType = (
    playerId: string,
    type: 'izume' | 'enkin'
  ) => {
    setEditingData((prev) => {
      const current = prev[playerId];
      if (!current) return prev;

      const newType = current.playoff_type === type ? null : type;
      return {
        ...prev,
        [playerId]: { ...current, playoff_type: newType },
      };
    });
  };

  const updateLocalValue = (
    playerId: string,
    field: 'semifinal_score' | 'semifinal_results',
    delta: number
  ) => {
    setEditingData((prev) => {
      const current = prev[playerId];
      if (!current) return prev;

      const baseVal = current[field] ?? 0;
      const newVal = Math.max(0, baseVal + delta);
      return {
        ...prev,
        [playerId]: { ...current, [field]: newVal },
      };
    });
  };

  const savePlayoffData = async (playerId: string) => {
    const dataToSave = editingData[playerId];
    if (!dataToSave) return;

    setLoadingId(playerId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          playoff_type: dataToSave.playoff_type,
          semifinal_score: dataToSave.semifinal_score,
          semifinal_results: dataToSave.semifinal_results,
        })
        .eq('id', playerId);

      if (error) throw error;

      setLastSavedData((prev) => {
        const currentOptimistic = optimisticPlayers.find(
          (p) => p.id === playerId
        );
        const merged = { ...currentOptimistic, ...dataToSave } as PlayerData;
        return { ...prev, [playerId]: merged };
      });

      setOptimisticPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, ...dataToSave } : p))
      );

      router.refresh();

      setEditingData((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    } catch (error) {
      console.error('Update error:', error);
      alert('更新に失敗しました');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCalculateFinalRanking = async () => {
    if (
      !window.confirm(
        '現在の入力内容に基づいて最終順位を計算・確定します。\nよろしいですか？'
      )
    ) {
      return;
    }
    setIsProcessing(true);
    const supabase = createClient();

    try {
      const sortedPlayers = [...optimisticPlayers].sort((a, b) => {
        if (b.total_score !== a.total_score)
          return b.total_score - a.total_score;

        const aResult = a.semifinal_results;
        const bResult = b.semifinal_results;

        if (aResult !== null && bResult !== null) return aResult - bResult;
        if (aResult !== null) return -1;
        if (bResult !== null) return 1;

        return Number(a.bib_number) - Number(b.bib_number);
      });

      const BATCH_SIZE = 10;
      for (let i = 0; i < sortedPlayers.length; i += BATCH_SIZE) {
        const batch = sortedPlayers.slice(i, i + BATCH_SIZE);
        const promises = batch.map((player, index) => {
          const rank = i + index + 1;
          return supabase
            .from('entries')
            .update({ final_ranking: rank })
            .eq('id', player.id);
        });
        await Promise.all(promises);
      }

      alert('最終順位の計算と保存が完了しました。');
      router.refresh();
    } catch (error) {
      console.error('Calculation error:', error);
      alert('計算処理に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetFinalRanking = async () => {
    if (
      !window.confirm(
        '【警告】\n最終順位をリセットしますか？\n成績閲覧ページの順位表示は「未定」に戻ります。'
      )
    ) {
      return;
    }
    setIsProcessing(true);
    const supabase = createClient();

    try {
      const allIds = optimisticPlayers.map((p) => p.id);
      const BATCH_SIZE = 50;

      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batchIds = allIds.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
          .from('entries')
          .update({ final_ranking: null })
          .in('id', batchIds);

        if (error) throw error;
      }

      alert('最終順位をリセットしました。');
      router.refresh();
    } catch (error) {
      console.error('Reset error:', error);
      alert('リセット処理に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const createPlayerGroups = <T,>(array: T[]): T[][] => {
    const totalPlayers = array.length;
    if (totalPlayers === 0) return [];

    const maxPerGroup = 5;
    const totalGroups = Math.ceil(totalPlayers / maxPerGroup);
    const numGroupsOf4 = totalGroups * maxPerGroup - totalPlayers;

    if (numGroupsOf4 > totalGroups) {
      const baseSize = Math.floor(totalPlayers / totalGroups);
      const remainder = totalPlayers % totalGroups;
      const groups: T[][] = [];
      let startIndex = 0;
      for (let i = 0; i < totalGroups; i++) {
        const size = baseSize + (i < remainder ? 1 : 0);
        groups.push(array.slice(startIndex, startIndex + size));
        startIndex += size;
      }
      return groups;
    }

    const numGroupsOf5 = totalGroups - numGroupsOf4;
    const groups: T[][] = [];
    let startIndex = 0;

    for (let i = 0; i < numGroupsOf5; i++) {
      groups.push(array.slice(startIndex, startIndex + 5));
      startIndex += 5;
    }
    for (let i = 0; i < numGroupsOf4; i++) {
      groups.push(array.slice(startIndex, startIndex + 4));
      startIndex += 4;
    }
    return groups;
  };

  const playerGroups = createPlayerGroups(optimisticPlayers);

  let label = '午前1';
  let maxScore = 2;
  if (currentTab === 'am2') {
    label = '午後1';
    maxScore = 2;
  }
  if (currentTab === 'pm1') {
    label = '午後2';
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
          午後1
        </button>
        <button
          onClick={() => handleTabChange('pm1')}
          className={getTabClass('pm1')}
        >
          午後2
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
          <div className="bg-white p-4 rounded-xl border border-[#34675C]/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-[#34675C]">順位確定操作</span>
              <br />
              <span className="text-xs text-gray-400">
                ※閲覧ページの表示に影響します
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleResetFinalRanking}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-white text-red-500 border border-red-500 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
                <span className="ml-2">リセット</span>
              </button>

              <button
                onClick={handleCalculateFinalRanking}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-[#34675C] text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-[#2a524a] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-5 w-5" />
                )}
                最終順位計算
              </button>
            </div>
          </div>

          {optimisticPlayers.map((originalPlayer) => {
            const isEditing = !!editingData[originalPlayer.id];
            const player = isEditing
              ? editingData[originalPlayer.id]!
              : originalPlayer;
            const isLoading = loadingId === player.id;

            return (
              <div
                key={player.id}
                className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
                  isEditing
                    ? 'border-[#34675C] ring-1 ring-[#34675C] shadow-md'
                    : 'border-[#E8ECEF]'
                }`}
              >
                {/* 1行目: 選手情報 + 合計的中数 */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 overflow-hidden">
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

                  <div className="flex flex-col items-end ml-2 flex-shrink-0">
                    <div className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                      Total
                    </div>
                    <div className="text-xl font-bold text-[#324857]">
                      {player.total_score}
                      <span className="text-xs font-normal text-[#7B8B9A] ml-0.5">
                        中
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3行目: 修正/決定ボタン & 決勝区分・カウンター入力エリア */}
                <div className="p-3 bg-white border-t border-[#E8ECEF] flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <button
                        onClick={() => savePlayoffData(player.id)}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center w-16 h-16 bg-[#34675C] text-white rounded-lg shadow-sm hover:bg-[#2a524a] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin mb-1" />
                        ) : (
                          <Check size={24} className="mb-1" />
                        )}
                        <span className="text-xs font-bold">決定</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(player)}
                        className="flex flex-col items-center justify-center w-16 h-16 bg-white text-[#34675C] border-2 border-[#34675C] rounded-lg shadow-sm hover:bg-[#34675C]/5 active:scale-95 transition-all"
                      >
                        <Edit2 size={24} className="mb-1" />
                        <span className="text-xs font-bold">修正</span>
                      </button>
                    )}
                  </div>

                  <div
                    className={`flex-1 flex flex-wrap items-center justify-center gap-4 p-2 rounded-lg border bg-gray-50/50 transition-colors ${
                      isEditing
                        ? 'border-[#34675C]/30 bg-white'
                        : 'border-[#E8ECEF]'
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center transition-opacity ${
                        !isEditing ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <span className="text-[10px] text-[#7B8B9A] font-bold mb-1">
                        方式
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            toggleLocalPlayoffType(player.id, 'izume')
                          }
                          disabled={!isEditing}
                          className={`
                                py-1.5 px-3 rounded text-xs font-bold transition-all border flex items-center justify-center whitespace-nowrap h-8
                                ${
                                  player.playoff_type === 'izume'
                                    ? 'bg-[#CD2C58] text-white border-[#CD2C58] shadow-sm'
                                    : 'bg-white text-[#7DA3A1] border-[#7DA3A1]/30 hover:border-[#CD2C58] hover:text-[#CD2C58]'
                                }
                              `}
                        >
                          射詰
                        </button>
                        <button
                          onClick={() =>
                            toggleLocalPlayoffType(player.id, 'enkin')
                          }
                          disabled={!isEditing}
                          className={`
                                py-1.5 px-3 rounded text-xs font-bold transition-all border flex items-center justify-center whitespace-nowrap h-8
                                ${
                                  player.playoff_type === 'enkin'
                                    ? 'bg-[#34675C] text-white border-[#34675C] shadow-sm'
                                    : 'bg-white text-[#7DA3A1] border-[#7DA3A1]/30 hover:border-[#34675C] hover:text-[#34675C]'
                                }
                              `}
                        >
                          遠近
                        </button>
                      </div>
                    </div>

                    <div
                      className={`flex flex-col items-center transition-opacity ${
                        !isEditing ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <span className="text-[10px] text-[#7B8B9A] font-bold mb-1">
                        射詰的中
                      </span>
                      <div className="flex items-center bg-white rounded-md border border-[#E8ECEF] shadow-sm h-8">
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_score', -1)
                          }
                          disabled={!isEditing}
                          className="px-2 py-1 text-gray-500 hover:text-[#CD2C58] hover:bg-red-50 rounded-l-md disabled:opacity-50 h-full flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-bold text-[#324857] text-sm">
                          {player.semifinal_score ?? 0}
                        </span>
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_score', 1)
                          }
                          disabled={!isEditing}
                          className="px-2 py-1 text-gray-500 hover:text-[#CD2C58] hover:bg-red-50 rounded-r-md disabled:opacity-50 h-full flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`flex flex-col items-center transition-opacity ${
                        !isEditing ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <span className="text-[10px] text-[#7B8B9A] font-bold mb-1">
                        射遠順位
                      </span>
                      <div className="flex items-center bg-white rounded-md border border-[#E8ECEF] shadow-sm h-8">
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_results', -1)
                          }
                          disabled={!isEditing}
                          className="px-2 py-1 text-gray-500 hover:text-[#34675C] hover:bg-green-50 rounded-l-md disabled:opacity-50 h-full flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-bold text-[#324857] text-sm">
                          {player.semifinal_results ?? 0}
                        </span>
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_results', 1)
                          }
                          disabled={!isEditing}
                          className="px-2 py-1 text-gray-500 hover:text-[#34675C] hover:bg-green-50 rounded-r-md disabled:opacity-50 h-full flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
