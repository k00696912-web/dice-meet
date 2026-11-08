import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "骰子局 DiceMeet - 跑团搭子匹配平台",
  description: "找到合适的 DM 和玩家，开启你的跑团冒险。AI 伴随 NPC，让缺人不再成为开团的阻碍。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}