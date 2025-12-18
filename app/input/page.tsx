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
  // 検索パラメータ待機
  const params = await searchParams;
  const currentTab = params?.tab || 'am1';

  // クエリの基本部分を構築
  let query = supabase.from('entries_with_ranking').select(`
      *,
      participants (
        name,
        teams (
          name
        )
      )
    `);

  // タブに応じてソート順を変更
  if (currentTab === 'final') {
    // 決勝・集計タブ: 暫定順位(昇順) -> ゼッケン番号(昇順)
    // nullsFirst: false を指定し、順位なし(NULL)は末尾に配置
    query = query
      .order('provisional_ranking', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else if (currentTab === 'am1') {
    // 午前1: 立順(昇順) -> ゼッケン番号(昇順)
    // 修正: nullsLast: true を nullsFirst: false に変更
    query = query
      .order('order_am1', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else if (currentTab === 'am2') {
    // 午前2: 立順(昇順) -> ゼッケン番号(昇順)
    // 修正: nullsLast: true を nullsFirst: false に変更
    query = query
      .order('order_am2', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else if (currentTab === 'pm1') {
    // 午後1: 立順(昇順) -> ゼッケン番号(昇順)
    // 修正: nullsLast: true を nullsFirst: false に変更
    query = query
      .order('order_pm1', { ascending: true, nullsFirst: false })
      .order('bib_number', { ascending: true });
  } else {
    // その他のタブ: ゼッケン番号(昇順)
    query = query.order('bib_number', { ascending: true });
  }

  // クエリ実行
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

  // DBのデータをコンポーネント用の型(PlayerData)に変換
  const players: PlayerData[] = (entries || []).map((entry: any) => {
    // 結合したテーブルから名前とチーム名を取得（存在しない場合のフォールバック付き）
    const playerName = entry.participants?.name ?? '不明な選手';
    const teamName = entry.participants?.teams?.name ?? '所属なし';

    return {
      id: entry.id,
      bib_number: entry.bib_number,
      player_name: playerName, // participantsテーブル由来
      team_name: teamName, // teamsテーブル由来
      order_am1: entry.order_am1,
      order_am2: entry.order_am2,
      order_pm1: entry.order_pm1,
      score_am1: entry.score_am1,
      score_am2: entry.score_am2,
      score_pm1: entry.score_pm1,
      total_score: entry.total_score || 0,
      provisional_ranking: entry.provisional_ranking, // entries_with_ranking由来
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
