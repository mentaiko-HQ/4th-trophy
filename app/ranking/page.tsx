import { createClient } from '@/utils/supabase/server';
import ScoreList, { PlayerData } from './components/ScoreList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績閲覧',
};

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from('entries_with_ranking')
    .select(
      `
      *,
      participants (
        name,
        teams (
          name
        )
      )
    `
    )
    .order('total_score', { ascending: false })
    .order('provisional_ranking', { ascending: true, nullsFirst: false });

  if (error) {
    console.error(
      'Error fetching ranking data:',
      JSON.stringify(error, null, 2)
    );
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600 gap-4 p-4">
        <h2 className="text-xl font-bold">データの取得に失敗しました</h2>
        <div className="bg-gray-100 p-4 rounded border border-gray-300 text-sm font-mono text-gray-800 max-w-2xl w-full overflow-auto whitespace-pre-wrap">
          <p className="font-bold mb-2">エラー詳細:</p>
          {JSON.stringify(error, null, 2)}
        </div>
      </div>
    );
  }

  // 順位計算用変数
  let currentRank = 1;
  let sameRankCount = 0;
  let previousScore: number | null = null;

  const players: PlayerData[] = (entries || []).map((entry: any) => {
    const playerName = entry.participants?.name ?? '不明な選手';
    const teamName = entry.participants?.teams?.name ?? '所属なし';
    const score = entry.total_score || 0;

    // 順位計算
    if (previousScore !== null) {
      if (score < previousScore) {
        currentRank += sameRankCount + 1;
        sameRankCount = 0;
      } else {
        sameRankCount++;
      }
    }
    previousScore = score;

    const displayRank = entry.provisional_ranking ?? currentRank;

    return {
      id: entry.id,
      bib_number: entry.bib_number,
      player_name: playerName,
      team_name: teamName,
      // 各回スコアのマッピングを追加
      score_am1: entry.score_am1,
      score_am2: entry.score_am2,
      score_pm1: entry.score_pm1,
      total_score: score,
      provisional_ranking: displayRank,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#34675C] text-white p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">成績閲覧</h1>
      </header>

      <main className="p-4">
        <ScoreList players={players} />
      </main>
    </div>
  );
}
