'use client';

import { useState, useEffect } from 'react';
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
  score_am1: number | null;
  score_am2: number | null;
  score_pm1: number | null;
  // 追加カラム
  total_score: number;
  provisional_ranking: number | null;
  playoff_type: 'izume' | 'enkin' | null;
};

type Props = {
  players: PlayerData[];
  currentTab: string;
};

// --------------------------------------------------
// モーダルコンポーネント（予選入力用）
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

      const pairIndex = Math.floor(groupIndex / 2) + 1;
      const shajo = groupIndex % 2 === 0 ? '第一射場' : '第二射場';

      alert(`${label} 第${pairIndex}組-${shajo}のデータを保存しました`);
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
        {/* モーダルヘッダー */}
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

        {/* モーダルボディ */}
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

                  {/* スコアボタン */}
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

        {/* モーダルフッター */}
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
              {isSubmitting ? '保存中...' : '保存する'}
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
    null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null); // 決勝区分更新中のID

  // 決勝区分の更新処理
  const handlePlayoffSelect = async (
    playerId: string,
    type: 'izume' | 'enkin' | null
  ) => {
    setLoadingId(playerId);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('entries') // 更新は entries テーブルに対して行う
        .update({ playoff_type: type })
        .eq('id', playerId);

      if (error) throw error;

      // 成功したら画面をリフレッシュ
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

  // タブ設定
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
  // finalタブの場合のラベルは使用しないが設定
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
      {/* タブナビゲーション */}
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
          決勝
        </button>
      </div>

      {/* コンテンツエリア */}
      {currentTab === 'final' ? (
        // ====================== 決勝タブ用のUI (カードリスト形式) ======================
        <div className="space-y-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white border border-[#7DA3A1]/30 rounded-xl p-4 shadow-sm"
            >
              {/* 1行目: 順位・情報・スコア */}
              <div className="flex items-center justify-between mb-3 border-b border-[#7DA3A1]/10 pb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  {/* 暫定順位 */}
                  <span className="flex-shrink-0 bg-[#34675C] text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                    {player.provisional_ranking ?? '-'}
                  </span>
                  {/* ゼッケン・氏名 */}
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#7DA3A1] font-bold">
                        No.{player.bib_number}
                      </span>
                      <span className="text-base font-bold text-[#324857] truncate">
                        {player.player_name}
                      </span>
                    </div>
                    <div className="text-xs text-[#7DA3A1] truncate">
                      {player.team_name}
                    </div>
                  </div>
                </div>
                {/* 合計スコア */}
                <div className="text-right">
                  <div className="text-[10px] text-[#7DA3A1] font-bold">
                    Total
                  </div>
                  <div className="text-xl font-bold text-[#86AC41]">
                    {player.total_score}
                  </div>
                </div>
              </div>

              {/* 2行目: 決勝区分選択ボタン (射詰 / 遠近) */}
              <div className="grid grid-cols-2 gap-3">
                {/* 射詰ボタン */}
                <button
                  onClick={() =>
                    handlePlayoffSelect(
                      player.id,
                      player.playoff_type === 'izume' ? null : 'izume'
                    )
                  }
                  disabled={loadingId === player.id}
                  className={`
                    py-2 rounded-lg font-bold text-sm transition-all border
                    ${
                      player.playoff_type === 'izume'
                        ? 'bg-[#CD2C58] text-white border-[#CD2C58] shadow-md ring-2 ring-[#E06B80] ring-offset-1' // 選択中
                        : 'bg-white text-[#7DA3A1] border-[#7DA3A1]/30 hover:border-[#CD2C58] hover:text-[#CD2C58]' // 未選択
                    }
                  `}
                >
                  射詰
                </button>

                {/* 遠近ボタン */}
                <button
                  onClick={() =>
                    handlePlayoffSelect(
                      player.id,
                      player.playoff_type === 'enkin' ? null : 'enkin'
                    )
                  }
                  disabled={loadingId === player.id}
                  className={`
                    py-2 rounded-lg font-bold text-sm transition-all border
                    ${
                      player.playoff_type === 'enkin'
                        ? 'bg-[#34675C] text-white border-[#34675C] shadow-md ring-2 ring-[#7DA3A1] ring-offset-1' // 選択中
                        : 'bg-white text-[#7DA3A1] border-[#7DA3A1]/30 hover:border-[#34675C] hover:text-[#34675C]' // 未選択
                    }
                  `}
                >
                  遠近
                </button>
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
        // ====================== 予選タブ用のUI (グループリスト形式) ======================
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

      {/* モーダル表示 */}
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
