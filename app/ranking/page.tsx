import { createClient } from '@/utils/supabase/server';
import ScoreList, { PlayerData } from './components/ScoreList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績閲覧',
};

export default async function RankingPage() {
  const supabase = await createClient();

  // 1. データの取得とソート
  const { data: entries, error } = await supabase
    .from('entries')
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
    // 優先順位1: 合計的中数 (降順)
    .order('total_score', { ascending: false })
    // 優先順位2: 射遠順位 (昇順: 1位, 2位... NULLは後ろ)
    .order('semifinal_results', { ascending: true, nullsFirst: false })
    // 優先順位3: ゼッケン番号 (昇順)
    .order('bib_number', { ascending: true });

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

  // 2. 順位計算ロジック
  let currentProvRank = 1;
  let sameProvRankCount = 0;
  let prevScore: number | null = null;

  const players: PlayerData[] = (entries || []).map(
    (entry: any, index: number) => {
      const playerName = entry.participants?.name ?? '不明な選手';
      const teamName = entry.participants?.teams?.name ?? '所属なし';
      const score = entry.total_score || 0;

      // --- 暫定順位の計算（合計スコアのみ比較） ---
      if (index > 0) {
        if (score !== prevScore) {
          currentProvRank += sameProvRankCount + 1;
          sameProvRankCount = 0;
        } else {
          sameProvRankCount++;
        }
      }
      prevScore = score;

      // --- 最終順位の計算（リスト順の連番） ---
      const calculatedFinalRank = index + 1;
      const displayFinalRank = entry.final_ranking ?? calculatedFinalRank;

      return {
        id: entry.id,
        bib_number: entry.bib_number,
        player_name: playerName,
        team_name: teamName,
        // 立順情報のマッピング (追加)
        order_am1: entry.order_am1,
        order_am2: entry.order_am2,
        order_pm1: entry.order_pm1,
        // スコア
        score_am1: entry.score_am1,
        score_am2: entry.score_am2,
        score_pm1: entry.score_pm1,
        total_score: score,
        provisional_ranking: currentProvRank,
        final_ranking: displayFinalRank,
        // 決勝情報
        playoff_type: entry.playoff_type,
        semifinal_score: entry.semifinal_score,
        semifinal_results: entry.semifinal_results,
      };
    }
  );

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
