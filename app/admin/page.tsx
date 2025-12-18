import { createClient } from '@/utils/supabase/server';
import AdminPanel from './components/AdminPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '大会管理画面',
};

// データの型定義
export interface AdminData {
  players: any[];
  settings: any;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. 参加者データの取得（立順順）
  const { data: players, error: playersError } = await supabase
    .from('entries')
    .select(
      `
      *,
      participants ( name, teams ( name ) )
    `
    )
    .order('bib_number', { ascending: true });

  // 2. 大会設定の取得（1行目のみ取得）
  const { data: settings, error: settingsError } = await supabase
    .from('tournament_settings')
    .select('*')
    .limit(1)
    .single();

  if (playersError || settingsError) {
    console.error('Data fetch error:', playersError || settingsError);
    return (
      <div className="p-10 text-red-600">データの読み込みに失敗しました。</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold">大会管理システム</h1>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
          管理者モード
        </span>
      </header>

      <main className="p-4 md:p-8">
        <AdminPanel initialPlayers={players} initialSettings={settings} />
      </main>
    </div>
  );
}
