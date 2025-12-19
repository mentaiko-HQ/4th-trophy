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
  // URLパラメータから現在のタブを取得（デフォルトは 'am1'）
  const currentTab = params?.tab || 'am1';

  // 1. データの取得
  // entries テーブルからデータを取得します。
  // player_name, team_name カラムは entries テーブルには存在しないと仮定し、
  // participants テーブルを結合して取得します。
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
    `
    )
    .neq('is_absent', true) // ★重要: 欠席者を除外して取得します（欠番として詰めるため）
    .order('bib_number', { ascending: true }); // 基本はゼッケン順で取得

  if (error) {
    console.error(
      'Error fetching calling data:',
      JSON.stringify(error, null, 2)
    );
    return (
      <div className="p-4 text-red-500 flex flex-col gap-2 min-h-screen items-center justify-center">
        <h2 className="font-bold text-xl">
          データの読み込みエラーが発生しました
        </h2>
        <div className="bg-gray-100 p-4 rounded border border-gray-300 text-sm font-mono text-gray-800 max-w-2xl w-full overflow-auto whitespace-pre-wrap">
          <p className="font-bold mb-2">エラー詳細:</p>
          {JSON.stringify(error, null, 2)}
        </div>
      </div>
    );
  }

  // 2. データ変換
  // DBから取得したデータをクライアントコンポーネント用の型 (PlayerData) に整形します
  const players: PlayerData[] = (entries || []).map((entry: any) => {
    // participantsテーブル（結合先）から名前と所属を取得
    // データがない場合のフォールバックも設定
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
      // ステータス情報（nullの場合は 'waiting' とする）
      status_am1: entry.status_am1 || 'waiting',
      status_am2: entry.status_am2 || 'waiting',
      status_pm1: entry.status_pm1 || 'waiting',
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#34675C] text-white p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">
          選手呼出管理 (ステータス変更)
        </h1>
      </header>

      <main className="p-4">
        {/* クライアントコンポーネントにデータと現在のタブを渡す */}
        <CallingStatusClient players={players} currentTab={currentTab} />
      </main>
    </div>
  );
}
