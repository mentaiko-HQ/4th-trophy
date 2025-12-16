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
  status_am1: string;
  status_am2: string;
  status_pm1: string;
};

type Props = {
  players: PlayerData[];
  currentTab: string;
};

// --------------------------------------------------
// モーダルコンポーネント（5人の成績入力フォーム）
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
  // スコア管理用State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期値の設定
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* モーダルヘッダー */}
        <div className="flex justify-between items-center bg-[#FFE6D4] px-6 py-4 border-b border-[#FFC69D]">
          <div>
            <h3 className="text-xl font-bold text-[#CD2C58]">
              {label} - 第{pairIndex}組-{shajo} 入力
            </h3>
            <span className="text-sm text-gray-600">
              範囲: 0 〜 {maxScore}中
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#CD2C58] hover:text-[#E06B80] p-2 font-bold"
          >
            ✕ 閉じる
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <form id="score-form" onSubmit={handleSubmit} className="space-y-6">
            {groupPlayers.map((player) => {
              let orderNumber: number | null = null;
              if (label === '午前1') orderNumber = player.order_am1;
              else if (label === '午前2') orderNumber = player.order_am2;
              else if (label === '午後1') orderNumber = player.order_pm1;

              return (
                <div
                  key={player.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="inline-block bg-[#FFE6D4] text-[#CD2C58] text-xs font-bold px-2 py-0.5 rounded mr-2">
                        立順: {orderNumber ?? '-'}
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">
                        No.{player.bib_number}
                      </span>
                      <div className="font-bold text-lg mt-1 text-gray-800">
                        {player.player_name}
                      </div>
                      <div className="text-xs text-gray-500">
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
                                ? 'bg-[#CD2C58] text-white shadow-md ring-2 ring-[#E06B80] scale-105'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#FFE6D4] hover:text-[#CD2C58]'
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
        <div className="bg-[#FFE6D4] px-6 py-4 border-t border-[#FFC69D] flex justify-between items-center">
          <span className="text-sm font-bold text-gray-700">
            入力状況:{' '}
            <span
              className={isAllSelected ? 'text-[#CD2C58]' : 'text-gray-700'}
            >
              {Object.keys(scores).length}
            </span>{' '}
            / {groupPlayers.length}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-bold hover:bg-white/50 rounded-lg transition-colors"
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
                            ? 'bg-[#CD2C58] hover:bg-[#E06B80] hover:shadow-md'
                            : 'bg-gray-400 cursor-not-allowed'
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

  const handleTabChange = (tab: string) => {
    router.push(`/input?tab=${tab}`);
  };

  const getTabClass = (tabName: string) => {
    const baseClass =
      'flex-1 py-4 text-center font-bold text-sm sm:text-base transition-all duration-200 border-b-4 outline-none';
    // アクティブ: メインカラーの枠線と文字、背景は白
    const activeClass =
      'border-[#CD2C58] text-[#CD2C58] bg-white shadow-sm z-10 relative';
    // 非アクティブ: グレー文字、ホバー時に薄い背景色
    const inactiveClass =
      'border-transparent text-gray-500 hover:text-[#CD2C58] hover:bg-[#FFE6D4]';
    return `${baseClass} ${
      currentTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
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

      {/* グループリスト表示 */}
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
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* 左側：グループ情報 */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800 border-l-4 border-[#CD2C58] pl-3">
                      第{pairIndex}組-{shajo}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-[#FFE6D4] text-[#CD2C58]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isComplete
                        ? '入力完了'
                        : `入力済み: ${filledCount}/${group.length}`}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 pl-3 truncate">
                    {group.map((p) => p.player_name).join(', ')}
                  </div>
                </div>

                {/* 右側：入力ボタン */}
                <button
                  onClick={() => setSelectedGroupIndex(groupIndex)}
                  className={`
                    w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2
                    ${
                      isComplete
                        ? 'bg-[#E06B80] hover:bg-[#CD2C58]'
                        : 'bg-[#CD2C58] hover:bg-[#E06B80]'
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
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-[#FFC69D]">
            表示対象の選手がいません
          </div>
        )}
      </div>

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
