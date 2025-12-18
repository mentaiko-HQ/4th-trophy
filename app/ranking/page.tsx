import { createClient } from '@/utils/supabase/server';
import ScoreList, { PlayerData } from './components/ScoreList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績閲覧',
};

export default async function RankingPage() {
  const supabase = await createClient();

  // 1. データの取得とソート
  // entries_with_ranking（ビュー）には新カラムが反映されていないため、
  // entries テーブルから直接データを取得します。
  const { data: entries, error } = await supabase
    .from('entries') // 修正: entries_with_ranking -> entries
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
    // ソート順の変更:
    // 優先順位1: 合計スコア (降順)
    // 優先順位2: 射遠順位 (昇順, 値がある人が上)
    // 優先順位3: ゼッケン番号 (昇順, 同順位内の並びを安定させるため)
    .order('total_score', { ascending: false })
    .order('semifinal_results', { ascending: true, nullsFirst: false })
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

  // 2. 最終順位の計算ロジック
  // ソート済みのリストを上から走査して順位を割り振ります
  let currentDisplayRank = 1;
  let sameRankCount = 0;

  // 比較用: 前の行のデータ
  let prevTotalScore: number | null = null;
  let prevSemifinalResult: number | null = null;

  const players: PlayerData[] = (entries || []).map(
    (entry: any, index: number) => {
      const playerName = entry.participants?.name ?? '不明な選手';
      const teamName = entry.participants?.teams?.name ?? '所属なし';
      const score = entry.total_score || 0;

      // DBのカラム値を取得
      const currentTotalScore = score;
      const currentSemifinalResult = entry.semifinal_results;

      // 最初の行以外で順位判定を行う
      if (index > 0) {
        // 順位が変わる条件:
        // 1. 合計スコアが異なる
        // 2. 合計スコアは同じだが、射遠順位が異なる

        const isScoreDiff = currentTotalScore !== prevTotalScore;

        const isSemifinalDiff =
          (currentSemifinalResult !== null || prevSemifinalResult !== null) &&
          currentSemifinalResult !== prevSemifinalResult;

        if (isScoreDiff || isSemifinalDiff) {
          // 順位を進める (同率だった数 + 1)
          currentDisplayRank += sameRankCount + 1;
          sameRankCount = 0;
        } else {
          // 完全に同順位
          sameRankCount++;
        }
      }

      // 次の比較のために保持
      prevTotalScore = currentTotalScore;
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
        // 計算した「最終順位」を表示用として設定
        provisional_ranking: currentDisplayRank,
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
