import { createClient } from '@/utils/supabase/server';
import ScoreInputClient, { PlayerData } from './components/ScoreInputClient';

// ページコンポーネント (Server Component)
export default async function ScoreInputPage({
  searchParams,
}: {
  searchParams: Promise<{ tachi?: string; tab?: string }>; // tabパラメータを追加
}) {
  const supabase = await createClient();
  
  const params = await searchParams;
  const targetPage = params.tachi ? Number(params.tachi) : 1;
  // 現在のタブを取得（デフォルトは am1）
  const currentTab = params.tab || 'am1';
<<<<<<< HEAD

  const ITEMS_PER_PAGE = 5;

  // Supabaseからデータ取得
  const { data: rawData, error } = await supabase.from('entries').select(`
=======
  
  const ITEMS_PER_PAGE = 5;

  // Supabaseからデータ取得
  const { data: rawData, error } = await supabase
    .from('entries') 
    .select(`
>>>>>>> 371d0df38301c82621bdd019f81e2922daee112c
      id,
      bib_number,
      order_am1,
      order_am2,
      order_pm1,
      participants (
        name,
        teams (
          name
        )
      )
    `);

  if (error) {
    console.error("Supabase Error:", error);
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border-l-4 border-red-500">
          <h2 className="text-2xl font-bold text-red-600 mb-4">データの取得に失敗しました</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto font-mono text-sm">
            <p className="mb-2"><strong>Code:</strong> {error.code}</p>
            <p className="mb-2"><strong>Message:</strong> {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. データをフラットな形式に変換
<<<<<<< HEAD
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
        };
      })
    : [];
=======
  const allPlayers = rawData ? rawData.map((entry: any) => {
    return {
      id: entry.id,
      bib_number: entry.bib_number,
      player_name: entry.participants?.name ?? '不明',
      team_name: entry.participants?.teams?.name ?? '不明',
      order_am1: entry.order_am1 ?? null,
      order_am2: entry.order_am2 ?? null,
      order_pm1: entry.order_pm1 ?? null,
    };
  }) : [];
>>>>>>> 371d0df38301c82621bdd019f81e2922daee112c

  // 2. 現在のタブに応じてソートキーを決定
  let sortKey: 'order_am1' | 'order_am2' | 'order_pm1' = 'order_am1';
  if (currentTab === 'am2') sortKey = 'order_am2';
  if (currentTab === 'pm1') sortKey = 'order_pm1';

  // 3. 決定したキーで昇順ソート
  allPlayers.sort((a, b) => {
    // nullの場合は末尾(999999)に移動
    const valA = a[sortKey] !== null ? Number(a[sortKey]) : 999999;
    const valB = b[sortKey] !== null ? Number(b[sortKey]) : 999999;
    return valA - valB;
  });

  // 4. ページネーション処理
  const from = (targetPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;
  
  const paginatedPlayers = allPlayers.slice(from, to);

  if (paginatedPlayers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center p-10 bg-white rounded shadow">
          <h2 className="text-xl font-bold mb-4">データが見つかりません</h2>
          <p>対象の登録選手がいません。</p>
          <p className="text-sm text-gray-500 mt-2">（基準: {sortKey}）</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-2 sm:px-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        予選 成績入力
      </h1>

      {/* 現在のタブ情報をクライアントに渡す */}
      <ScoreInputClient players={paginatedPlayers} currentTab={currentTab} />
    </div>
  );
}
