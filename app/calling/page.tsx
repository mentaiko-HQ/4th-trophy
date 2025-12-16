import { createClient } from '@/utils/supabase/server';
import CallingStatusClient, {
  PlayerData,
} from './components/CallingStatusClient';

export default async function CallingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;
  const currentTab = params.tab || 'am1';

  // Supabaseからデータ取得 (statusカラムを含む)
  const { data: rawData, error } = await supabase.from('entries').select(`
      id,
      bib_number,
      order_am1,
      order_am2,
      order_pm1,
      status_am1,
      status_am2,
      status_pm1,
      participants (
        name,
        teams (
          name
        )
      )
    `);

  if (error) {
    console.error('Supabase Error:', error);
    return <div className="p-10 text-red-600">データの取得に失敗しました</div>;
  }

  // データをフラットな形式に変換
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
          // ステータス (nullの場合はwaiting)
          status_am1: entry.status_am1 ?? 'waiting',
          status_am2: entry.status_am2 ?? 'waiting',
          status_pm1: entry.status_pm1 ?? 'waiting',
        };
      })
    : [];

  // 現在のタブに応じてソート
  let sortKey: 'order_am1' | 'order_am2' | 'order_pm1' = 'order_am1';
  if (currentTab === 'am2') sortKey = 'order_am2';
  if (currentTab === 'pm1') sortKey = 'order_pm1';

  allPlayers.sort((a, b) => {
    const valA = a[sortKey] !== null ? Number(a[sortKey]) : 999999;
    const valB = b[sortKey] !== null ? Number(b[sortKey]) : 999999;
    return valA - valB;
  });

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-2 sm:px-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        選手呼出管理
      </h1>
      <CallingStatusClient players={allPlayers} currentTab={currentTab} />
    </div>
  );
}
