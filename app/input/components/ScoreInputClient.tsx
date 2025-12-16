'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ルーターをインポート
import { createClient } from '@/utils/supabase/client';

export type PlayerData = {
  id: string;
  team_name: string;
  player_name: string;
  bib_number: string | number;
  order_am1: number | null;
  order_am2: number | null;
  order_pm1: number | null;
};

type Props = {
  players: PlayerData[];
  currentTab: string; // 親から現在のタブを受け取る
};

const BatchScoreForm = ({
  label,
  maxScore,
  players,
}: {
  label: string;
  maxScore: number;
  players: PlayerData[];
}) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreSelect = (id: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [id]: score,
    }));
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

      console.log(`【${label}】保存完了:`, scores);
      alert(`${label}のデータを保存しました`);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllSelected = Object.keys(scores).length === players.length;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-b-lg shadow-inner animate-fade-in">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-500 pl-3">
          {label} 一括入力
        </h3>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
          範囲: 0 〜 {maxScore} 中
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* カード型レイアウト: グリッドで配置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
          {players.map((player) => {
            let orderNumber: number | null = null;
            let orderLabel = '立順';

            if (label === '午前1') {
              orderNumber = player.order_am1;
              orderLabel = '午前１立順';
            } else if (label === '午前2') {
              orderNumber = player.order_am2;
              orderLabel = '午前２立順';
            } else if (label === '午後1') {
              orderNumber = player.order_pm1;
              orderLabel = '午後１立順';
            }

            return (
              <div
                key={player.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* 完了状態の視覚的フィードバック（オプション） */}
                {scores[player.id] !== undefined && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-bl-lg"></div>
                )}

                {/* 選手情報ヘッダー */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                  {/* 左側：立順・ゼッケン */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md w-fit">
                      {orderLabel}:{' '}
                      <span className="text-sm ml-1">{orderNumber ?? '-'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md w-fit border border-gray-100">
                      ID: {player.bib_number}
                    </span>
                  </div>
                  {/* 右側（メイン）：選手名・チーム名 */}
                  <div className="text-right flex-1 pl-2">
                    <p className="text-xs text-gray-500 font-bold mb-0.5 truncate">
                      {player.team_name}
                    </p>
                    <p className="text-lg font-bold text-gray-800 leading-tight truncate">
                      {player.player_name}
                    </p>
                  </div>
                </div>

                {/* ボタンエリア */}
                <div>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {Array.from({ length: maxScore + 1 }).map((_, score) => {
                      const isSelected = scores[player.id] === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreSelect(player.id, score)}
                          className={`
                          w-12 h-12 rounded-xl font-bold text-xl transition-all duration-200 flex items-center justify-center
                          ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-300 transform -translate-y-1'
                              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }
                        `}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 固定フッターの保存ボタン */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-bold text-gray-500">
              入力状況:{' '}
              <span
                className={isAllSelected ? 'text-blue-600' : 'text-gray-800'}
              >
                {Object.keys(scores).length}
              </span>{' '}
              / {players.length} 人
            </span>
            <button
              type="submit"
              disabled={!isAllSelected || isSubmitting}
              className={`
                w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-lg shadow-md transition-all
                ${
                  isAllSelected && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
                `}
            >
              {isSubmitting
                ? '保存中...'
                : isAllSelected
                ? 'この内容で保存する'
                : '未入力の選手がいます'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default function ScoreInputClient({ players, currentTab }: Props) {
  const router = useRouter();

  // タブ切り替え時にURLパラメータを更新してページ遷移
  const handleTabChange = (tab: string) => {
    // ページ遷移してサーバー側でソートをやり直させる
    // ページ番号(tachi)はリセットして1ページ目に戻すのが安全
    router.push(`/input?tab=${tab}`);
  };

  const getTabClass = (tabName: string) => {
    const baseClass =
      'flex-1 py-4 text-center font-bold text-sm sm:text-base transition-all duration-200 border-b-2 outline-none';
    const activeClass =
      'border-blue-600 text-blue-600 bg-white shadow-sm z-10 relative';
    const inactiveClass =
      'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50';
    return `${baseClass} ${
      currentTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {' '}
      {/* フッター分の余白を追加 */}
      <div className="flex bg-gray-100 p-1 rounded-t-xl overflow-hidden border-b border-gray-200">
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
      <div className="bg-white rounded-b-xl shadow-xl">
        {currentTab === 'am1' && (
          <BatchScoreForm label="午前1" maxScore={2} players={players} />
        )}
        {currentTab === 'am2' && (
          <BatchScoreForm label="午前2" maxScore={2} players={players} />
        )}
        {currentTab === 'pm1' && (
          <BatchScoreForm label="午後1" maxScore={4} players={players} />
        )}
      </div>
    </div>
  );
}
