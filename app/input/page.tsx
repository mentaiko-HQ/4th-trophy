import { createClient } from '@/utils/supabase/server';
import ScoreInputClient, { PlayerData } from './components/ScoreInputClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '成績入力',
};

export default async function InputPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  // 検索パラメータ待機
  const params = await searchParams;
  const currentTab = params?.tab || 'am1';

  // データを取得
  // entriesテーブルから全カラムを取得
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*')
    .order('bib_number', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return (
      <div className="p-4 text-red-500">
        データの読み込みエラーが発生しました
      </div>
    );
  }

  // DBのデータをコンポーネント用の型(PlayerData)に変換
  const players: PlayerData[] = (entries || []).map((entry: any) => ({
    id: entry.id,
    bib_number: entry.bib_number,
    player_name: entry.player_name,
    team_name: entry.team_name,
    order_am1: entry.order_am1,
    order_am2: entry.order_am2,
    order_pm1: entry.order_pm1,
    score_am1: entry.score_am1,
    score_am2: entry.score_am2,
    score_pm1: entry.score_pm1,
    total_score: entry.total_score || 0,
    provisional_ranking: entry.provisional_ranking,
    playoff_type: entry.playoff_type,
    // 【修正箇所】以下2行を追加して型エラーを解消
    semifinal_score: entry.semifinal_score,
    semifinal_results: entry.semifinal_results,
  }));

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
