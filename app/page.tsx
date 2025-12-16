import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">弓道大会 成績管理</h1>
        </div>

        <div className="p-8 space-y-6">
          <Link
            href="/input"
            className="block w-full py-4 px-6 bg-white border-2 border-blue-600 text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition-colors text-center shadow-sm"
          >
            成績入力へ
          </Link>

          <Link
            href="/ranking"
            className="block w-full py-4 px-6 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition-colors text-center shadow-md"
          >
            速報・ランキングを見る
          </Link>
        </div>

        <div className="bg-gray-50 p-4 text-center text-gray-500 text-sm">
          Select Menu
        </div>
      </div>
    </div>
  );
}
