import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c } from 'next/font/google';
import './globals.css';

// Rounded M+ 1c フォントの設定
const mPlus = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '800', '900'],
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
    <html lang="ja">
      <body className={`${mPlus.className} bg-[#F0F4F5] text-[#324857]`}>
        {children}
      </body>
    </html>
  );
}
