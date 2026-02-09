import Link from 'next/link';
import { Trophy, Edit3, Mic, Settings, Monitor } from 'lucide-react';

export default function Home() {
  const menuItems = [
    {
      title: 'RANKING',
      subtitle: '成績閲覧',
      description: '現在の順位や的中数を確認します',
      href: '/ranking',
      icon: Trophy,
      bgColor: 'bg-bk-orange', // オレンジ
      textColor: 'text-bk-brown',
    },
    {
      title: 'INPUT',
      subtitle: '成績入力',
      description: '各立のスコアを入力・修正します',
      href: '/input',
      icon: Edit3,
      bgColor: 'bg-bk-red', // 赤
      textColor: 'text-white',
    },
    {
      title: 'CALLING',
      subtitle: '選手呼出',
      description: '進行状況に合わせて選手を呼び出します',
      href: '/calling',
      icon: Mic,
      bgColor: 'bg-bk-green', // 緑
      textColor: 'text-white',
    },
    {
      title: 'SIGNAGE',
      subtitle: '会場スクリーン',
      description: '行射・呼出状況を大画面で表示します',
      href: '/signage',
      icon: Monitor,
      bgColor: 'bg-[#502314]', // 茶色
      textColor: 'text-bk-beige',
    },
    {
      title: 'ADMIN',
      subtitle: '管理画面',
      description: '大会設定、進行管理、欠席設定など',
      href: '/admin',
      icon: Settings,
      bgColor: 'bg-gray-800',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-bk-beige font-sans flex flex-col">
      {/* ヘッダー */}
      <header className="bg-bk-red text-white p-6 border-b-4 border-bk-brown shadow-none">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-pop font-black tracking-tighter uppercase drop-shadow-md">
            4th
            <br className="md:hidden" /> Mentaiko Trophy
          </h1>
          <p className="text-sm md:text-base font-bold mt-1 opacity-90">
            ４め杯 運営管理システム
          </p>
        </div>
      </header>

      {/* メインメニュー */}
      <main className="flex-1 p-6 flex flex-col justify-center max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative overflow-hidden rounded-3xl border-4 border-bk-brown bg-white p-6
                transition-transform duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(80,35,20,1)]
                active:translate-y-0 active:shadow-none
              `}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  <h2 className="text-4xl font-pop font-black uppercase mb-1 text-bk-brown">
                    {item.title}
                  </h2>
                  <p className="text-lg font-bold text-gray-500 mb-2">
                    {item.subtitle}
                  </p>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div
                  className={`
                    flex items-center justify-center w-16 h-16 rounded-2xl border-4 border-bk-brown
                    ${item.bgColor} ${item.textColor}
                    group-hover:scale-110 transition-transform duration-300
                  `}
                >
                  <item.icon size={32} strokeWidth={3} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* フッター */}
      <footer className="p-6 text-center">
        <p className="text-xs font-bold text-bk-brown/50 font-pop">
          &copy; 4th Mentaikotrophy Management System
        </p>
      </footer>
    </div>
  );
}
