import { createClient } from '@/utils/supabase/server';
import ScoreInputClient, { PlayerData } from './components/ScoreInputClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績入力',
};

export default async function InputPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const currentTab = params?.tab || 'am1';

  // 1. entries テーブルからデータ取得 (entries_with_ranking に is_absent がないため)
  let query = supabase
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
    .neq('is_absent', true); // 欠席者を除外

  // 2. タブに応じてソート順を変更
  if (currentTab === 'final') {
    // entriesテーブルには provisional_ranking がないので total_score で代用
    // 暫定順位順 = 合計スコア降順
    // 同点の場合は射遠順位(昇順)
    query = query
      .order('total_score', { ascending: false })
      .order('semifinal_results', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else if (currentTab === 'am1') {
    query = query
      .order('order_am1', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else if (currentTab === 'am2') {
    query = query
      .order('order_am2', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else if (currentTab === 'pm1') {
    query = query
      .order('order_pm1', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else {
    query = query.order('bib_number', { ascending: true });
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error('Error fetching data:', error);
    return (
      <div className="p-4 text-red-500 flex flex-col gap-2">
        <h2 className="font-bold">データの読み込みエラーが発生しました</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  // 3. 暫定順位の計算
  // entries テーブルには provisional_ranking がないため、アプリ側で計算して付与する
  // 順位計算用に全データをスコア順・射遠順位順にソートしたリストを作成
  const sortedForRanking = [...(entries || [])].sort((a, b) => {
    // 1. 合計スコア (降順)
    if ((b.total_score || 0) !== (a.total_score || 0)) {
      return (b.total_score || 0) - (a.total_score || 0);
    }
    // 2. 射遠順位 (昇順: nullは後ろ)
    const aRes = a.semifinal_results;
    const bRes = b.semifinal_results;
    if (aRes !== null && bRes !== null) return aRes - bRes;
    if (aRes !== null) return -1;
    if (bRes !== null) return 1;

    return 0;
  });

  const rankMap = new Map<string, number>();
  let currentRank = 1;
  let sameRankCount = 0;
  let prevTotal: number | null = null;
  let prevSemi: number | null = null;

  sortedForRanking.forEach((entry, index) => {
    const score = entry.total_score || 0;
    const semi = entry.semifinal_results;

    if (index > 0) {
      // スコアが違う、または射遠順位が違う場合は順位を進める
      const isDiff =
        score !== prevTotal ||
        (semi !== prevSemi && (semi !== null || prevSemi !== null));
      if (isDiff) {
        currentRank += sameRankCount + 1;
        sameRankCount = 0;
      } else {
        sameRankCount++;
      }
    }
    rankMap.set(entry.id, currentRank);

    prevTotal = score;
    prevSemi = semi;
  });

  // 4. データ変換
  const players: PlayerData[] = (entries || []).map((entry: any) => {
    const playerName = entry.participants?.name ?? '不明な選手';
    const teamName = entry.participants?.teams?.name ?? '所属なし';

    // 計算した順位を取得
    const calculatedRank = rankMap.get(entry.id) ?? null;

    return {
      id: entry.id,
      bib_number: entry.bib_number,
      player_name: playerName,
      team_name: teamName,
      order_am1: entry.order_am1,
      order_am2: entry.order_am2,
      order_pm1: entry.order_pm1,
      score_am1: entry.score_am1,
      score_am2: entry.score_am2,
      score_pm1: entry.score_pm1,
      total_score: entry.total_score || 0,
      provisional_ranking: calculatedRank, // 計算値をセット
      playoff_type: entry.playoff_type,
      semifinal_score: entry.semifinal_score,
      semifinal_results: entry.semifinal_results,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#34675C] text-white p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">成績入力</h1>
      </header>

      <main className="p-4">
        <ScoreInputClient players={players} currentTab={currentTab} />
      </main>
    </div>
  );
}
