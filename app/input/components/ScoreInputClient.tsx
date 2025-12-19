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
} from 'lucide-react';

// 外部から参照できるよう export を付与
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

  // Optimistic UI用のローカル状態（サーバー更新待ちの間の表示用）
  const [optimisticPlayers, setOptimisticPlayers] =
    useState<PlayerData[]>(players);

  // 編集中のデータを保持するState
  // { [playerId]: PlayerData }
  const [editingData, setEditingData] = useState<Record<string, PlayerData>>(
    {}
  );

  // 保存処理中のID
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 直近で保存したデータを一時的に保持する (サーバーデータの反映遅延対策)
  // key: playerId, value: PlayerData
  const [lastSavedData, setLastSavedData] = useState<
    Record<string, PlayerData>
  >({});

  // 計算中フラグ
  const [isCalculating, setIsCalculating] = useState(false);

  // サーバーからのデータ(players)が更新されたらローカル状態も同期する
  useEffect(() => {
    setOptimisticPlayers((prevOptimistic) => {
      return players.map((serverPlayer) => {
        // 直近で保存したデータがあるか確認
        const saved = lastSavedData[serverPlayer.id];

        if (saved) {
          // サーバーデータが、保存したデータと一致(または更新)されているかチェック
          // (簡易的に、保存したフィールドの値がサーバーデータと一致するかで判断)
          const isServerDataUpdated =
            serverPlayer.semifinal_score === saved.semifinal_score &&
            serverPlayer.semifinal_results === saved.semifinal_results &&
            serverPlayer.playoff_type === saved.playoff_type;

          if (isServerDataUpdated) {
            // サーバーデータが追いついた場合、サーバーデータを使用
            return serverPlayer;
          } else {
            // サーバーデータがまだ古い場合、ローカルの保存済みデータを優先して表示し続ける
            // ただし、他のフィールド（total_scoreなど）はサーバーデータを使うべきなのでマージする
            return { ...serverPlayer, ...saved };
          }
        }

        return serverPlayer;
      });
    });
  }, [players, lastSavedData]);

  // 編集開始ハンドラ
  const startEditing = (player: PlayerData) => {
    setEditingData((prev) => ({
      ...prev,
      [player.id]: { ...player }, // 現在のデータをコピーして編集用にする
    }));
  };

  // 編集中のデータをローカルで更新するハンドラ
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

  // 決定ボタン押下時：DB保存処理
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

      // 保存成功時の処理

      // 1. 直近保存データとして登録 (サーバーデータが追いつくまでこれを優先して表示に使う)
      setLastSavedData((prev) => {
        // 現在の楽観的状態を取得（他の変更が含まれている可能性があるため）
        const currentOptimistic = optimisticPlayers.find(
          (p) => p.id === playerId
        );
        const merged = { ...currentOptimistic, ...dataToSave } as PlayerData;
        return { ...prev, [playerId]: merged };
      });

      // 2. ローカルの表示用データを即座に更新 (Optimistic Update)
      setOptimisticPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, ...dataToSave } : p))
      );

      // 3. サーバーデータの再取得を要求
      router.refresh();

      // 4. 編集モードを終了
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

  // ★最終順位の一括計算処理 (修正版: upsertではなく個別updateを使用)
  const handleCalculateFinalRanking = async () => {
    if (
      !window.confirm(
        '現在の入力内容に基づいて最終順位を計算・確定します。\nよろしいですか？'
      )
    ) {
      return;
    }
    setIsCalculating(true);
    const supabase = createClient();

    try {
      // 1. ソート実行
      const sortedPlayers = [...optimisticPlayers].sort((a, b) => {
        // 優先順位1: 合計スコア (降順)
        if (b.total_score !== a.total_score)
          return b.total_score - a.total_score;

        // 優先順位2: 射遠順位 (昇順: 数字が小さい方が上。nullは一番下)
        const aResult = a.semifinal_results;
        const bResult = b.semifinal_results;

        if (aResult !== null && bResult !== null) return aResult - bResult;
        if (aResult !== null) return -1; // aだけ値がある -> aが上
        if (bResult !== null) return 1; // bだけ値がある -> bが上

        // 優先順位3: ゼッケン番号 (昇順)
        return Number(a.bib_number) - Number(b.bib_number);
      });

      // 2. 分割して個別Updateを実行 (バッチ処理)
      // upsertは400エラーの原因になりやすいため、単純なupdateを並列実行します。
      const BATCH_SIZE = 10; // 10件ずつ送信

      for (let i = 0; i < sortedPlayers.length; i += BATCH_SIZE) {
        const batch = sortedPlayers.slice(i, i + BATCH_SIZE);

        const promises = batch.map((player, index) => {
          const rank = i + index + 1;
          return supabase
            .from('entries')
            .update({ final_ranking: rank })
            .eq('id', player.id);
        });

        // 10件のUpdateを並列実行
        const results = await Promise.all(promises);

        // エラーチェック
        for (const result of results) {
          if (result.error) {
            console.error('Individual update error:', result.error);
            throw result.error;
          }
        }
      }

      alert('最終順位の計算と保存が完了しました。');
      router.refresh();
    } catch (error) {
      console.error('Calculation error:', error);
      alert('計算処理に失敗しました。');
    } finally {
      setIsCalculating(false);
    }
  };

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // 表示には optimisticPlayers を使用する
  const playerGroups = chunkArray(optimisticPlayers, 5);

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
          {/* ★追加: 最終順位計算ボタンエリア */}
          <div className="bg-white p-4 rounded-xl border border-[#34675C]/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-[#34675C]">現在の入力内容</span>
              に基づいて最終順位を確定します。
              <br />
              <span className="text-xs text-gray-400">
                ※閲覧ページの表示順位が更新されます
              </span>
            </div>
            <button
              onClick={handleCalculateFinalRanking}
              disabled={isCalculating}
              className="w-full sm:w-auto bg-[#34675C] text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-[#2a524a] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isCalculating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Calculator className="mr-2 h-5 w-5" />
              )}
              最終順位計算
            </button>
          </div>

          {/* optimisticPlayers をマップして表示 */}
          {optimisticPlayers.map((originalPlayer) => {
            // 編集中のデータがあればそれを使用、なければ表示用データを使用
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
                    {/* Rank Badge */}
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

                    {/* Player Info */}
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

                  {/* 合計的中数 */}
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
                  {/* 左側: 修正/決定ボタン */}
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

                  {/* 右側: 入力エリア枠 */}
                  <div
                    className={`flex-1 flex flex-wrap items-center justify-center gap-4 p-2 rounded-lg border bg-gray-50/50 transition-colors ${
                      isEditing
                        ? 'border-[#34675C]/30 bg-white'
                        : 'border-[#E8ECEF]'
                    }`}
                  >
                    {/* グループ1: 方式選択 */}
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

                    {/* グループ2: 射詰的中数カウンター */}
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

                    {/* グループ3: 射遠順位カウンター */}
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
