import { createClient } from '@/utils/supabase/server';
import CallingStatusClient, {
  PlayerData,
} from './components/CallingStatusClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '選手呼出管理',
};

export default async function CallingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const currentTab = params?.tab || 'am1';

  // 1. データの取得
  // is_absent が true でない（false または null）選手のみ取得
  const { data: entries, error } = await supabase
    .from('entries')
    .select(
      `
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
    `,
    )
    .neq('is_absent', true) // 欠席者を除外
    .order('bib_number', { ascending: true }); // ゼッケン順

  if (error) {
    console.error(
      'Error fetching calling data:',
      JSON.stringify(error, null, 2),
    );
    return (
      <div className="p-4 text-bk-red flex flex-col gap-2 min-h-screen items-center justify-center bg-bk-beige">
        <h2 className="font-black text-xl">
          データの読み込みエラーが発生しました
        </h2>
        <div className="bg-white p-4 rounded-xl border-4 border-bk-brown text-sm font-mono text-bk-brown max-w-2xl w-full overflow-auto whitespace-pre-wrap">
          <p className="font-bold mb-2">エラー詳細:</p>
          {JSON.stringify(error, null, 2)}
        </div>
      </div>
    );
  }

  // 2. データ変換
  const players: PlayerData[] = (entries || []).map((entry: any) => {
    const name = entry.participants?.name || '不明な選手';
    const team = entry.participants?.teams?.name || '所属なし';

    return {
      id: entry.id,
      bib_number: entry.bib_number,
      player_name: name,
      team_name: team,
      order_am1: entry.order_am1,
      order_am2: entry.order_am2,
      order_pm1: entry.order_pm1,
      status_am1: entry.status_am1 || 'waiting',
      status_am2: entry.status_am2 || 'waiting',
      status_pm1: entry.status_pm1 || 'waiting',
    };
  });

  return (
    <div className="min-h-screen bg-bk-beige font-sans">
      <header className="bg-bk-red text-white p-4 border-b-4 border-bk-brown shadow-none sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <h1 className="text-xl md:text-3xl font-pop font-black tracking-tight uppercase drop-shadow-sm flex items-center gap-3">
            CALLING
            <span className="text-sm md:text-lg font-bold bg-bk-brown px-3 py-1 rounded-full opacity-90 tracking-normal">
              選手呼出
            </span>
          </h1>
        </div>
      </header>

      <main className="p-4">
        <CallingStatusClient players={players} currentTab={currentTab} />
      </main>
    </div>
  );
}
