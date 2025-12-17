import { createClient } from '@/utils/supabase/server';
import ScoreInputClient, { PlayerData } from './components/ScoreInputClient';

// ページコンポーネント (Server Component)
export default async function ScoreInputPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;
  // 現在のタブを取得（デフォルトは am1）
  const currentTab = params.tab || 'am1';

  // Supabaseからデータ取得
  // 変更: 暫定順位等を取得するため、ビュー 'entries_with_ranking' から取得
  const { data: rawData, error } = await supabase.from('entries_with_ranking')
    .select(`
      id,
      bib_number,
      order_am1, order_am2, order_pm1,
      score_am1, score_am2, score_pm1,
      total_score, provisional_ranking, final_ranking,
      playoff_type,
      participants (
        name,
        teams (
          name
        )
      )
    `);

  if (error) {
    console.error('Supabase Error:', error);
    return (
      <div className="min-h-screen bg-[#F0F4F5] py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border-l-4 border-[#34675C]">
          <h2 className="text-2xl font-bold text-[#34675C] mb-4">
            データの取得に失敗しました
          </h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto font-mono text-sm text-[#324857]">
            <p className="mb-2">
              <strong>Code:</strong> {error.code}
            </p>
            <p className="mb-2">
              <strong>Message:</strong> {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. データをフラットな形式に変換
  const allPlayers = rawData
    ? rawData.map((entry: any) => {
        return {
          id: entry.id,
          bib_number: entry.bib_number,
          player_name: entry.participants?.name ?? '不明',
          team_name: entry.participants?.teams?.name ?? '不明',
          order_am1: entry.order_am1 ?? null,
          order_am2: entry.order_am2 ?? null,
          order_pm1: entry.order_pm1 ?? null,
          score_am1: entry.score_am1 ?? null,
          score_am2: entry.score_am2 ?? null,
          score_pm1: entry.score_pm1 ?? null,

          // 決勝・集計用データの追加
          total_score: entry.total_score ?? 0,
          provisional_ranking: entry.provisional_ranking ?? null,
          playoff_type: entry.playoff_type ?? null, // 'izume' | 'enkin' | null
        };
      })
    : [];

  // 2. 現在のタブに応じてソートキーを決定
  // finalタブの場合は暫定順位順、それ以外は立順
  if (currentTab === 'final') {
    allPlayers.sort((a, b) => {
      // 順位がない（NULL）場合は末尾へ
      const rankA = a.provisional_ranking ?? 999999;
      const rankB = b.provisional_ranking ?? 999999;
      return rankA - rankB;
    });
  } else {
    let sortKey: 'order_am1' | 'order_am2' | 'order_pm1' = 'order_am1';
    if (currentTab === 'am2') sortKey = 'order_am2';
    if (currentTab === 'pm1') sortKey = 'order_pm1';

    allPlayers.sort((a, b) => {
      const valA = a[sortKey] !== null ? Number(a[sortKey]) : 999999;
      const valB = b[sortKey] !== null ? Number(b[sortKey]) : 999999;
      return valA - valB;
    });
  }

  return (
    <div className="min-h-screen bg-[#F0F4F5] py-6 sm:py-10 px-2 sm:px-4">
      <h1 className="text-2xl font-bold text-center text-[#324857] mb-6">
        予選 成績入力
      </h1>

      {/* 現在のタブと全選手データを渡す */}
      <ScoreInputClient players={allPlayers} currentTab={currentTab} />
    </div>
  );
}
