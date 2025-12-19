import Link from 'next/link';
import { Trophy, Edit3, Mic, Settings } from 'lucide-react';

export default function Home() {
  const menuItems = [
    {
      title: '成績閲覧',
      description: '現在の順位や的中数を確認します',
      href: '/ranking',
      icon: Trophy,
      // orange-500相当 -> oklch(0.704 0.191 47.56)
      // orange-600相当 -> oklch(0.646 0.222 41.116)
      color: 'bg-[oklch(0.704_0.191_47.56)]',
      hoverColor: 'group-hover:text-[oklch(0.646_0.222_41.116)]',
    },
    {
      title: '成績入力',
      description: '各立のスコアを入力・修正します',
      href: '/input',
      icon: Edit3,
      // blue-600相当 -> oklch(0.546 0.245 262.88)
      // blue-700相当 -> oklch(0.488 0.243 264.37)
      color: 'bg-[oklch(0.546_0.245_262.88)]',
      hoverColor: 'group-hover:text-[oklch(0.488_0.243_264.37)]',
    },
    {
      title: '選手呼出',
      description: '進行状況に合わせて選手を呼び出します',
      href: '/calling',
      icon: Mic,
      // green-600相当 -> oklch(0.627 0.194 149.21)
      // green-700相当 -> oklch(0.527 0.154 150.92)
      color: 'bg-[oklch(0.627_0.194_149.21)]',
      hoverColor: 'group-hover:text-[oklch(0.527_0.154_150.92)]',
    },
    {
      title: '管理画面',
      description: '大会設定、進行管理、欠席設定など',
      href: '/admin',
      icon: Settings,
      // gray-700相当 -> oklch(0.373 0.034 259.73)
      // gray-800相当 -> oklch(0.278 0.033 256.84)
      color: 'bg-[oklch(0.373_0.034_259.73)]',
      hoverColor: 'group-hover:text-[oklch(0.278_0.033_256.84)]',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* ヘッダー */}
      {/* #34675C (深緑) -> oklch(0.455 0.076 172.5) 近似値 */}
      <header className="bg-[oklch(0.455_0.076_172.5)] text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center tracking-wide">
            弓道大会 成績管理システム
          </h1>
        </div>
      </header>

      {/* メインメニュー */}
      <main className="flex-1 p-6 flex flex-col justify-center max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start"
            >
              <div
                className={`p-4 rounded-xl ${item.color} text-white mr-5 shadow-md group-hover:scale-110 transition-transform duration-300`}
              >
                <item.icon size={28} />
              </div>
              <div className="flex-1">
                <h2
                  className={`text-xl font-bold text-gray-800 mb-2 transition-colors ${item.hoverColor}`}
                >
                  {item.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* フッター */}
      <footer className="p-6 text-center text-xs text-gray-400">
        <p>&copy; Kyudo Tournament Management System</p>
      </footer>
    </div>
  );
}
