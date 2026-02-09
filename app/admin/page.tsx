import { createClient } from '@/utils/supabase/server';
import AdminPanel from './components/AdminPanel';
import AdminAuthGuard from './components/AdminAuthGuard';
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
    `,
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
      <div className="p-10 text-bk-red font-black text-xl">
        データの読み込みに失敗しました。
      </div>
    );
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-bk-beige font-sans">
        <header className="bg-bk-red text-white p-4 border-b-4 border-bk-brown shadow-none sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-pop font-black tracking-tight uppercase drop-shadow-sm flex items-center gap-2">
            ADMIN
            <span className="text-sm md:text-base font-bold bg-bk-brown px-3 py-1 rounded-full opacity-90 tracking-normal text-white">
              大会管理
            </span>
          </h1>
          <span className="text-xs font-black bg-white text-bk-red px-3 py-1 rounded-full border-2 border-bk-brown shadow-sm">
            管理者モード
          </span>
        </header>

        <main className="p-4 md:p-8">
          <AdminPanel initialPlayers={players} initialSettings={settings} />
        </main>
      </div>
    </AdminAuthGuard>
  );
}
