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
  X,
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
// モーダルコンポーネント
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
      else if (label === '午後2') currentScore = p.score_pm1;

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
      else if (label === '午後2') targetColumn = 'score_pm1';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bk-brown/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center bg-bk-green px-6 py-4 border-b-4 border-bk-brown shrink-0">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white font-pop tracking-tight flex items-center gap-2">
              <span className="bg-bk-brown px-3 py-1 rounded-full text-sm">
                GROUP {pairIndex}
              </span>
              {shajo} - {label}
            </h3>
            <span className="text-sm text-white/90 font-bold ml-1">
              範囲: 0 〜 {maxScore}中
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-bk-beige bg-bk-brown/20 hover:bg-bk-brown/40 p-2 rounded-full transition-colors"
          >
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-bk-beige">
          <form
            id="score-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full content-start"
          >
            {groupPlayers.map((player) => {
              let orderNumber: number | null = null;
              if (label === '午前1') orderNumber = player.order_am1;
              else if (label === '午前2') orderNumber = player.order_am2;
              else if (label === '午後1') orderNumber = player.order_pm1;

              return (
                <div
                  key={player.id}
                  className="bg-white p-3 rounded-2xl border-4 border-bk-brown shadow-sm flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-2 border-b-2 border-bk-brown/10 pb-2">
                    <span className="inline-block bg-bk-brown text-white text-xs font-black px-2 py-0.5 rounded-full">
                      立順: {orderNumber ?? '-'}
                    </span>
                    <span className="font-pop text-bk-brown text-xs font-black bg-bk-orange/20 px-2 py-0.5 rounded-full border border-bk-brown">
                      No.{player.bib_number}
                    </span>
                  </div>

                  <div className="mb-4 text-center flex-1 flex flex-col justify-center">
                    <div className="font-bold text-lg leading-tight text-bk-brown mb-1">
                      {player.player_name}
                    </div>
                    <div className="text-xs text-gray-500 font-bold truncate">
                      {player.team_name}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    {Array.from({ length: maxScore + 1 }).map((_, score) => {
                      const isSelected = scores[player.id] === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreSelect(player.id, score)}
                          className={`
                            w-full h-12 rounded-xl font-black text-xl transition-all border-4 font-pop
                            ${
                              isSelected
                                ? 'bg-bk-red text-white border-bk-brown shadow-[2px_2px_0px_0px_rgba(80,35,20,1)] translate-y-[2px] translate-x-[2px]'
                                : 'bg-white text-bk-brown border-bk-brown hover:bg-bk-orange/20 shadow-[4px_4px_0px_0px_rgba(80,35,20,0.2)] hover:-translate-y-0.5'
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

        <div className="bg-white px-6 py-4 border-t-4 border-bk-brown shrink-0 flex justify-between items-center">
          <span className="text-base font-black text-bk-brown">
            STATUS:{' '}
            <span
              className={
                isAllSelected
                  ? 'text-bk-green text-xl font-pop'
                  : 'text-gray-400 text-xl font-pop'
              }
            >
              {Object.keys(scores).length}
            </span>{' '}
            / {groupPlayers.length}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-bk-brown font-bold hover:bg-bk-beige rounded-full transition-colors border-2 border-transparent hover:border-bk-brown"
            >
              キャンセル
            </button>
            <button
              type="submit"
              form="score-form"
              disabled={!isAllSelected || isSubmitting}
              className={`
                px-8 py-3 rounded-full font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all border-4 border-bk-brown
                ${
                  isAllSelected && !isSubmitting
                    ? 'bg-bk-green hover:bg-[#2a6820] active:translate-y-[2px] active:shadow-none'
                    : 'bg-gray-300 border-gray-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> SAVING...
                </div>
              ) : (
                'SAVE'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// メインコンポーネント
// --------------------------------------------------
export default function ScoreInputClient({ players, currentTab }: Props) {
  const router = useRouter();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null,
  );

  const [optimisticPlayers, setOptimisticPlayers] =
    useState<PlayerData[]>(players);
  const [editingData, setEditingData] = useState<Record<string, PlayerData>>(
    {},
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastSavedData, setLastSavedData] = useState<
    Record<string, PlayerData>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('score-input-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => {
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    setOptimisticPlayers((prevOptimistic) => {
      return players.map((serverPlayer) => {
        const saved = lastSavedData[serverPlayer.id];
        if (saved) {
          const isServerDataUpdated =
            serverPlayer.semifinal_score === saved.semifinal_score &&
            serverPlayer.semifinal_results === saved.semifinal_results &&
            serverPlayer.playoff_type === saved.playoff_type;
          if (isServerDataUpdated) return serverPlayer;
          else return { ...serverPlayer, ...saved };
        }
        return serverPlayer;
      });
    });
  }, [players, lastSavedData]);

  const startEditing = (player: PlayerData) => {
    setEditingData((prev) => ({ ...prev, [player.id]: { ...player } }));
  };

  const toggleLocalPlayoffType = (
    playerId: string,
    type: 'izume' | 'enkin',
  ) => {
    setEditingData((prev) => {
      const current = prev[playerId];
      if (!current) return prev;
      const newType = current.playoff_type === type ? null : type;
      return { ...prev, [playerId]: { ...current, playoff_type: newType } };
    });
  };

  const updateLocalValue = (
    playerId: string,
    field: 'semifinal_score' | 'semifinal_results',
    delta: number,
  ) => {
    setEditingData((prev) => {
      const current = prev[playerId];
      if (!current) return prev;
      const baseVal = current[field] ?? 0;
      const newVal = Math.max(0, baseVal + delta);
      return { ...prev, [playerId]: { ...current, [field]: newVal } };
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
          (p) => p.id === playerId,
        );
        const merged = { ...currentOptimistic, ...dataToSave } as PlayerData;
        return { ...prev, [playerId]: merged };
      });
      setOptimisticPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, ...dataToSave } : p)),
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
        '現在の入力内容に基づいて最終順位を計算・確定します。\nよろしいですか？',
      )
    )
      return;
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
        '【警告】\n最終順位をリセットしますか？\n成績閲覧ページの順位表示は「未定」に戻ります。',
      )
    )
      return;
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
      'flex-1 py-3 px-1 text-center font-black text-sm md:text-base transition-all duration-200 border-b-4 outline-none uppercase font-pop';
    const activeClass =
      'border-bk-orange text-bk-brown bg-white shadow-sm rounded-t-lg';
    const inactiveClass =
      'border-transparent text-gray-500 hover:text-bk-brown hover:bg-bk-brown/5';
    return `${baseClass} ${currentTab === tabName ? activeClass : inactiveClass}`;
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex bg-white/50 p-2 rounded-xl overflow-hidden border-2 border-bk-brown mb-6">
        <button
          onClick={() => handleTabChange('am1')}
          className={getTabClass('am1')}
        >
          午前
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
          <div className="bg-white p-4 rounded-2xl border-4 border-bk-brown shadow-[6px_6px_0px_0px_rgba(80,35,20,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-sm font-bold text-bk-brown">
              <span className="font-black text-bk-red">順位確定操作</span>
              <br />
              <span className="text-xs text-gray-500 font-medium">
                ※閲覧ページの表示に影響します
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleResetFinalRanking}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-white text-bk-red border-2 border-bk-red font-black py-3 px-4 rounded-full shadow-sm hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
                <span className="ml-2">RESET</span>
              </button>

              <button
                onClick={handleCalculateFinalRanking}
                disabled={isProcessing}
                className="flex-1 sm:flex-none bg-bk-brown text-white border-2 border-bk-brown font-black py-3 px-6 rounded-full shadow-sm hover:bg-bk-brown/90 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-5 w-5" />
                )}
                CALC RANK
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
                className={`bg-white border-4 rounded-3xl shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)] overflow-hidden transition-all duration-200 ${isEditing ? 'border-bk-orange ring-4 ring-bk-orange/30 shadow-none scale-[1.01]' : 'border-bk-brown'}`}
              >
                <div className="p-4 flex items-center justify-between bg-white border-b-2 border-bk-brown/10">
                  <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                    {player.provisional_ranking && (
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-bk-green rounded-full text-white shadow-sm shrink-0 border-2 border-bk-brown">
                        <span className="text-[10px] font-black leading-none">
                          RANK
                        </span>
                        <span className="text-xl font-black font-pop leading-none">
                          {player.provisional_ranking}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black bg-bk-brown text-white px-2 py-0.5 rounded-full font-pop">
                          No.{player.bib_number}
                        </span>
                        <div className="font-bold text-bk-brown truncate text-lg">
                          {player.player_name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 truncate font-bold">
                        {player.team_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-2 shrink-0">
                    <div className="text-[10px] text-gray-400 font-black mb-0.5 uppercase">
                      Total
                    </div>
                    <div className="text-3xl font-black font-pop text-bk-red">
                      {player.total_score}
                      <span className="text-xs font-bold text-gray-400 ml-0.5">
                        / 20
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-bk-beige/20 border-t border-bk-brown/10 flex items-center gap-3">
                  <div className="shrink-0">
                    {isEditing ? (
                      <button
                        onClick={() => savePlayoffData(player.id)}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center w-16 h-16 bg-bk-green text-white rounded-2xl border-b-4 border-[#2a6820] shadow-sm hover:translate-y-[2px] hover:border-b-2 hover:shadow-none active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin mb-1" />
                        ) : (
                          <Check size={24} className="mb-1" strokeWidth={3} />
                        )}
                        <span className="text-xs font-black">OK</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(player)}
                        className="flex flex-col items-center justify-center w-16 h-16 bg-white text-bk-brown border-2 border-bk-brown rounded-2xl shadow-[4px_4px_0px_0px_rgba(80,35,20,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all"
                      >
                        <Edit2 size={24} className="mb-1" />
                        <span className="text-xs font-black">EDIT</span>
                      </button>
                    )}
                  </div>
                  <div
                    className={`flex-1 flex flex-wrap items-center justify-center gap-4 p-2 rounded-2xl border-2 transition-colors ${isEditing ? 'border-bk-orange bg-white' : 'border-dashed border-gray-300 bg-transparent'}`}
                  >
                    <div
                      className={`flex flex-col items-center transition-opacity ${!isEditing ? 'opacity-40 pointer-events-none grayscale' : ''}`}
                    >
                      <span className="text-[10px] text-gray-400 font-black mb-1 uppercase">
                        Method
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            toggleLocalPlayoffType(player.id, 'izume')
                          }
                          disabled={!isEditing}
                          className={`py-1 px-3 rounded-full text-xs font-black transition-all border-2 flex items-center justify-center whitespace-nowrap h-8 ${player.playoff_type === 'izume' ? 'bg-bk-red text-white border-bk-red shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-bk-red hover:text-bk-red'}`}
                        >
                          射詰
                        </button>
                        <button
                          onClick={() =>
                            toggleLocalPlayoffType(player.id, 'enkin')
                          }
                          disabled={!isEditing}
                          className={`py-1 px-3 rounded-full text-xs font-black transition-all border-2 flex items-center justify-center whitespace-nowrap h-8 ${player.playoff_type === 'enkin' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-teal-600 hover:text-teal-600'}`}
                        >
                          遠近
                        </button>
                      </div>
                    </div>
                    <div
                      className={`flex flex-col items-center transition-opacity ${!isEditing ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <span className="text-[10px] text-gray-400 font-black mb-1 uppercase">
                        Izume Hit
                      </span>
                      <div className="flex items-center bg-white rounded-full border-2 border-bk-brown overflow-hidden h-8 w-24">
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_score', -1)
                          }
                          disabled={!isEditing}
                          className="w-8 h-full bg-gray-100 hover:bg-bk-red hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center font-black font-pop text-bk-brown text-sm">
                          {player.semifinal_score ?? 0}
                        </span>
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_score', 1)
                          }
                          disabled={!isEditing}
                          className="w-8 h-full bg-gray-100 hover:bg-bk-green hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                    <div
                      className={`flex flex-col items-center transition-opacity ${!isEditing ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <span className="text-[10px] text-gray-400 font-black mb-1 uppercase">
                        Enkin Rank
                      </span>
                      <div className="flex items-center bg-white rounded-full border-2 border-bk-brown overflow-hidden h-8 w-24">
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_results', -1)
                          }
                          disabled={!isEditing}
                          className="w-8 h-full bg-gray-100 hover:bg-bk-red hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center font-black font-pop text-bk-brown text-sm">
                          {player.semifinal_results ?? 0}
                        </span>
                        <button
                          onClick={() =>
                            updateLocalValue(player.id, 'semifinal_results', 1)
                          }
                          disabled={!isEditing}
                          className="w-8 h-full bg-gray-100 hover:bg-bk-green hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {players.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-bold bg-white/50 rounded-2xl border-4 border-dashed border-gray-300">
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
            const pairIndex = groupIndex + 1;
            const shajo = pairIndex % 2 !== 0 ? '第一射場' : '第二射場';
            return (
              <div
                key={groupIndex}
                className="bg-white border-4 border-bk-brown rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-white bg-bk-brown px-4 py-1 rounded-full uppercase">
                        GROUP {pairIndex}{' '}
                        <span className="text-xs font-normal opacity-80 ml-1">
                          - {shajo}
                        </span>
                      </h3>
                    </div>
                    <div className="text-sm font-bold text-gray-600 pl-2 truncate">
                      {group.map((p) => p.player_name).join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGroupIndex(groupIndex)}
                    className={`w-full sm:w-auto px-6 py-3 rounded-full font-black text-white transition-all shadow-sm flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 ${isComplete ? 'bg-bk-brown border-[#3a190f] hover:bg-[#3a190f]' : 'bg-bk-red border-[#a31b00] hover:bg-[#a31b00]'}`}
                  >
                    <Edit2 size={18} strokeWidth={3} />
                    {isComplete ? 'EDIT' : 'INPUT'}
                  </button>
                </div>
              </div>
            );
          })}
          {playerGroups.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-bold bg-white/50 rounded-2xl border-4 border-dashed border-gray-300">
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
