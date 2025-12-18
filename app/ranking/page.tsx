import { createClient } from '@/utils/supabase/server';
import ScoreList, { PlayerData } from './components/ScoreList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績閲覧',
};

export default async function RankingPage() {
  const supabase = await createClient();

  // 1. データの取得とソート
  // 優先順位1: 暫定順位 (昇順)
  // 優先順位2: 射遠順位 (昇順, 値がある人が上)
  // 優先順位3: 合計スコア (降順, 念のため)
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
    .order('provisional_ranking', { ascending: true, nullsFirst: false })
    .order('semifinal_results', { ascending: true, nullsFirst: false }) // 射遠順位でソート
    .order('total_score', { ascending: false });

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

  // 2. 最終順位の計算ロジック
  // ソート済みのリストを上から走査して順位を割り振ります
  let currentDisplayRank = 1;
  let sameRankCount = 0;

  // 比較用: 前の行のデータ
  let prevProvRank: number | null = null;
  let prevSemifinalResult: number | null = null;

  const players: PlayerData[] = (entries || []).map(
    (entry: any, index: number) => {
      const playerName = entry.participants?.name ?? '不明な選手';
      const teamName = entry.participants?.teams?.name ?? '所属なし';
      const score = entry.total_score || 0;

      const currentProvRank = entry.provisional_ranking;
      const currentSemifinalResult = entry.semifinal_results;

      // 最初の行以外で順位判定を行う
      if (index > 0) {
        // 順位が変わる条件:
        // 1. 暫定順位が異なる
        // 2. 暫定順位は同じだが、射遠順位が異なる（どちらかが値を持っている場合など）

        const isProvRankDiff = currentProvRank !== prevProvRank;

        // 射遠順位による差分の判定
        // 両方NULLなら差はない。値が違えば差がある。
        // 注意: DBソートで nullsFirst: false にしているので、順位がついている人が先に来ている前提
        const isSemifinalDiff =
          (currentSemifinalResult !== null || prevSemifinalResult !== null) &&
          currentSemifinalResult !== prevSemifinalResult;

        if (isProvRankDiff || isSemifinalDiff) {
          // 順位を進める (同率だった数 + 1)
          currentDisplayRank += sameRankCount + 1;
          sameRankCount = 0;
        } else {
          // 完全に同順位 (暫定順位も射遠順位も同じ、あるいは両方なし)
          sameRankCount++;
        }
      }

      // 次の比較のために保持
      prevProvRank = currentProvRank;
      prevSemifinalResult = currentSemifinalResult;

      return {
        id: entry.id,
        bib_number: entry.bib_number,
        player_name: playerName,
        team_name: teamName,
        score_am1: entry.score_am1,
        score_am2: entry.score_am2,
        score_pm1: entry.score_pm1,
        total_score: score,
        // ここで計算した「最終順位」を表示用として渡す
        provisional_ranking: currentProvRank ? currentDisplayRank : null,
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
