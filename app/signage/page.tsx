import SignageBoard from './components/SignageBoard';
import type { Metadata } from 'next';

// ★追加: ビルド時の静的生成を回避し、アクセス時に都度レンダリングする設定
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '会場スクリーン (デジタルサイネージ)',
  description: '現在の行射・呼出状況を表示します',
};

export default function SignagePage() {
  return (
    <main>
      <SignageBoard />
    </main>
  );
}
