"use client";

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

const BatchScoreForm = ({ label, maxScore, players }: { label: string; maxScore: number; players: PlayerData[] }) => {
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
    <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-b-lg shadow-sm animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-500 pl-3">
          {label} 一括入力
        </h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          範囲: 0 〜 {maxScore} 中
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {players.map((player) => {
            let orderNumber: number | null = null;
            let orderLabel = "立順";

            if (label === '午前1') {
              orderNumber = player.order_am1;
              orderLabel = "午前１立順";
            } else if (label === '午前2') {
              orderNumber = player.order_am2;
              orderLabel = "午前２立順";
            } else if (label === '午後1') {
              orderNumber = player.order_pm1;
              orderLabel = "午後１立順";
            }

            return (
              <div key={player.id} className="flex flex-col sm:flex-row sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="sm:w-1/3 mb-3 sm:mb-0 border-l-4 border-gray-300 pl-3">
                  <div className="mb-1">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded mr-2 inline-block">
                      {orderLabel}: <span className="text-sm">{orderNumber ?? '-'}</span>
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded inline-block">
                      選手ID: {player.bib_number}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-bold">{player.team_name}</p>
                  <p className="text-base font-bold text-gray-800">{player.player_name}</p>
                </div>

                <div className="sm:w-2/3 flex justify-start sm:justify-end gap-2 flex-wrap">
                  {Array.from({ length: maxScore + 1 }).map((_, score) => {
                    const isSelected = scores[player.id] === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreSelect(player.id, score)}
                        className={`
                          w-12 h-10 sm:w-14 sm:h-12 rounded font-bold text-lg transition-all
                          ${isSelected 
                            ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300' 
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-blue-50'
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
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-center sticky bottom-0 bg-white/95 backdrop-blur py-4 -mb-4 sm:static sm:bg-transparent sm:py-0">
          <button
            type="submit"
            disabled={!isAllSelected || isSubmitting}
            className={`
              w-full sm:w-1/2 px-6 py-4 rounded-lg font-bold text-lg shadow-md transition-all
              ${isAllSelected && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? '保存中...' : (isAllSelected ? 'この内容で保存する' : `未入力の選手がいます (${Object.keys(scores).length}/${players.length})`)}
          </button>
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
    const baseClass = "flex-1 py-4 text-center font-bold text-sm sm:text-base transition-all duration-200 border-b-2 outline-none";
    const activeClass = "border-blue-600 text-blue-600 bg-white";
    const inactiveClass = "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50";
    return `${baseClass} ${currentTab === tabName ? activeClass : inactiveClass}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex bg-gray-200 rounded-t-lg overflow-hidden border-b border-gray-300">
        <button onClick={() => handleTabChange('am1')} className={getTabClass('am1')}>午前1</button>
        <button onClick={() => handleTabChange('am2')} className={getTabClass('am2')}>午前2</button>
        <button onClick={() => handleTabChange('pm1')} className={getTabClass('pm1')}>午後1</button>
      </div>

      <div className="bg-white rounded-b-xl shadow-xl">
        {currentTab === 'am1' && <BatchScoreForm label="午前1" maxScore={2} players={players} />}
        {currentTab === 'am2' && <BatchScoreForm label="午前2" maxScore={2} players={players} />}
        {currentTab === 'pm1' && <BatchScoreForm label="午後1" maxScore={4} players={players} />}
      </div>
    </div>
  );
}
