import { createClient } from '@/utils/supabase/server';
import ScoreInputClient, { PlayerData } from './components/ScoreInputClient';

// ページコンポーネント (Server Component)
export default async function ScoreInputPage({
  searchParams,
}: {
  searchParams: Promise<{ tachi?: string }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;
  // URLパラメータ 'tachi' をページ番号として扱います
  const targetPage = params.tachi ? Number(params.tachi) : 1;
  const ITEMS_PER_PAGE = 5;

  // Supabaseからデータ取得
  // 新テーブル entries から、participants と teams を結合して取得
  const { data: rawData, error } = await supabase.from('entries').select(`
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
    console.error('Supabase Error:', error);
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border-l-4 border-red-500">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            データの取得に失敗しました
          </h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto font-mono text-sm">
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
          id: entry.id, // entriesテーブルのID
          bib_number: entry.bib_number,
          player_name: entry.participants?.name ?? '不明',
          team_name: entry.participants?.teams?.name ?? '不明',
          // 新カラム名に対応
          order_am1: entry.order_am1 ?? null,
          order_am2: entry.order_am2 ?? null,
          order_pm1: entry.order_pm1 ?? null,
        };
      })
    : [];

  // 2. order_am1 (午前1立順) の昇順でソート
  allPlayers.sort((a, b) => {
    const valA = a.order_am1 !== null ? Number(a.order_am1) : 999999;
    const valB = b.order_am1 !== null ? Number(b.order_am1) : 999999;
    return valA - valB;
  });

  // 3. ページネーション処理
  const from = (targetPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;

  const paginatedPlayers = allPlayers.slice(from, to);

  if (paginatedPlayers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-2xl mx-auto text-center p-10 bg-white rounded shadow">
          <h2 className="text-xl font-bold mb-4">データが見つかりません</h2>
          <p>対象の登録選手がいません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-2 sm:px-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        予選 成績入力
      </h1>

      <ScoreInputClient players={paginatedPlayers} />
    </div>
  );
}
