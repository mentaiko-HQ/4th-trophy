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

  // 1. entries テーブルからデータ取得 (欠席者を除外)
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
    `,
    )
    .neq('is_absent', true);

  // 2. タブに応じてソート順を変更
  if (currentTab === 'final') {
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
      <div className="p-4 text-bk-red font-bold flex flex-col gap-2 bg-bk-beige min-h-screen">
        <h2 className="font-black text-xl">
          データの読み込みエラーが発生しました
        </h2>
        <pre className="bg-white p-4 rounded-xl border-4 border-bk-brown text-xs overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  // 3. 暫定順位の計算
  const sortedForRanking = [...(entries || [])].sort((a, b) => {
    if ((b.total_score || 0) !== (a.total_score || 0)) {
      return (b.total_score || 0) - (a.total_score || 0);
    }
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
      provisional_ranking: calculatedRank,
      final_ranking: entry.final_ranking,
      playoff_type: entry.playoff_type,
      semifinal_score: entry.semifinal_score,
      semifinal_results: entry.semifinal_results,
    };
  });

  return (
    <div className="min-h-screen bg-bk-beige font-sans">
      {/* ヘッダーデザイン変更 */}
      <header className="bg-bk-red text-white p-4 border-b-4 border-bk-brown shadow-none sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <h1 className="text-xl md:text-3xl font-pop font-black tracking-tight uppercase drop-shadow-sm flex items-center gap-3">
            SCORE INPUT
            <span className="text-sm md:text-lg font-bold bg-bk-brown px-3 py-1 rounded-full opacity-90 tracking-normal">
              成績入力
            </span>
          </h1>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <ScoreInputClient players={players} currentTab={currentTab} />
      </main>
    </div>
  );
}
