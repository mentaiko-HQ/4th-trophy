import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F0F4F5] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-[#7DA3A1]/30">
        {/* ヘッダー: 深い青緑 (#34675C) */}
        <div className="bg-[#34675C] p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            弓道大会 成績管理
          </h1>
          <p className="text-[#7DA3A1] text-xs mt-1 opacity-80">
            TOURNAMENT MANAGER
          </p>
        </div>

        <div className="p-8 space-y-6">
          <Link
            href="/input"
            className="block w-full py-4 px-6 bg-white border-2 border-[#34675C] text-[#34675C] font-bold text-lg rounded-lg hover:bg-[#7DA3A1]/10 transition-colors text-center shadow-sm"
          >
            成績入力へ
          </Link>

          {/* メインアクション: 明るいグリーン (#86AC41) */}
          <Link
            href="/ranking"
            className="block w-full py-4 px-6 bg-[#86AC41] text-white font-bold text-lg rounded-lg hover:bg-[#7DA3A1] transition-colors text-center shadow-md"
          >
            速報・ランキングへ
          </Link>

          <Link
            href="/calling"
            className="block w-full py-4 px-6 bg-white border-2 border-[#324857] text-[#324857] font-bold text-lg rounded-lg hover:bg-[#324857] hover:text-white transition-colors text-center shadow-sm"
          >
            選手呼出管理へ
          </Link>
        </div>

        <div className="bg-[#324857]/5 p-4 text-center text-[#324857]/60 text-sm font-medium">
          Select Menu
        </div>
      </div>
    </div>
  );
}
