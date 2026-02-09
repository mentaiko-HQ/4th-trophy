import type { Metadata } from 'next';
import { Fredoka, Noto_Sans_JP } from 'next/font/google';
import './globals.css';

// 英数字用のポップなフォント (バーガーキング風)
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

// 日本語用のスタンダードなフォント
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '４め杯 運営管理',
  description: '4th Mentaikotrophy Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${fredoka.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased bg-bk-beige text-bk-brown min-h-screen">
        {children}
      </body>
    </html>
  );
}
