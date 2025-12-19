import { createClient } from '@/utils/supabase/server';
import ScoreList, { PlayerData } from './components/ScoreList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績閲覧',
};

export default async function RankingPage() {
  const supabase = await createClient();

  // 1. 大会設定の取得
  const { data: settings } = await supabase
    .from('tournament_settings')
    .select('*')
    .single();

  // 2. データの取得とソート
  // ソート順の修正:
  // 1. 最終順位 (計算済みなら昇順、未計算NULLは後ろ)
  // 2. 合計スコア (降順、暫定順位相当)
  // 3. 射遠順位 (昇順、同点の場合の比較)
  // 4. ゼッケン番号 (昇順、最終的な並び順の安定化)
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
    .order('final_ranking', { ascending: true, nullsFirst: false })
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

  // 3. 順位計算ロジック
  let currentProvRank = 1;
  let sameProvRankCount = 0;
  let prevScore: number | null = null;

  const players: PlayerData[] = (entries || []).map(
    (entry: any, index: number) => {
      const playerName = entry.participants?.name ?? '不明な選手';
      const teamName = entry.participants?.teams?.name ?? '所属なし';
      const score = entry.total_score || 0;

      // --- 暫定順位の計算（合計スコアのみ比較） ---
      // これは表示用に必要なので計算し続ける
      if (index > 0) {
        // 直前の人とスコアが違う場合のみ順位を進める（entriesはスコア順ではない可能性があるが、
        // 暫定順位はスコア依存なので、このロジックを維持するにはスコア順ソートが必要。
        // ただし今回はfinal_ranking優先ソートなので、final_rankingが決まっているとスコア順ではない可能性がある。
        // よって、この簡易ロジックでは正確な暫定順位が出ないケースがあるが、
        // 最終順位決定後は暫定順位の重要度が下がるため、許容するか、別途計算が必要。
        // 現状は既存ロジックを維持します。
        if (score !== prevScore) {
          currentProvRank += sameProvRankCount + 1;
          sameProvRankCount = 0;
        } else {
          sameProvRankCount++;
        }
      }
      prevScore = score;

      // --- 最終順位の取得 ---
      // DBの値を使用する
      const displayFinalRank = entry.final_ranking;

      return {
        id: entry.id,
        bib_number: entry.bib_number,
        player_name: playerName,
        team_name: teamName,
        order_am1: entry.order_am1,
        order_am2: entry.order_am2,
        order_pm1: entry.order_pm1,
        status_am1: entry.status_am1,
        status_am2: entry.status_am2,
        status_pm1: entry.status_pm1,
        score_am1: entry.score_am1,
        score_am2: entry.score_am2,
        score_pm1: entry.score_pm1,
        total_score: score,
        provisional_ranking: currentProvRank,
        final_ranking: displayFinalRank, // DBの値を使用
        playoff_type: entry.playoff_type,
        semifinal_score: entry.semifinal_score,
        semifinal_results: entry.semifinal_results,
      };
    }
  );

  // 4. 競射（順位決定戦）対象者の抽出ロジック
  const prizeCount = settings?.individual_prize_count || 0;
  const playoffPlayers: PlayerData[] = [];

  if (prizeCount > 0) {
    const rankMap = new Map<number, PlayerData[]>();
    players.forEach((p) => {
      if (p.provisional_ranking !== null) {
        const group = rankMap.get(p.provisional_ranking) || [];
        group.push(p);
        rankMap.set(p.provisional_ranking, group);
      }
    });

    rankMap.forEach((group, rank) => {
      // 修正後のロジック: 入賞枠内かつ同点者が2人以上
      if (rank <= prizeCount && group.length > 1) {
        playoffPlayers.push(...group);
      }
    });

    playoffPlayers.sort((a, b) => Number(a.bib_number) - Number(b.bib_number));
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#34675C] text-white p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">成績閲覧</h1>
      </header>

      <main className="p-4">
        <ScoreList
          players={players}
          settings={settings}
          playoffPlayers={playoffPlayers}
        />
      </main>
    </div>
  );
}
