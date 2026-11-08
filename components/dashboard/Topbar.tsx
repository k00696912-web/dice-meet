"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const TITLES: { match: (p: string) => boolean; title: string; sub: string }[] = [
  { match: (p) => p === "/", title: "公会大厅", sub: "欢迎回到冒险者公会" },
  { match: (p) => p.startsWith("/sessions/"), title: "委托详情", sub: "查看这份冒险委托" },
  { match: (p) => p.startsWith("/sessions"), title: "跑团大厅", sub: "浏览公会发布的委托" },
  { match: (p) => p.startsWith("/create"), title: "发布招募", sub: "以公会之名发布委托" },
];

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const current = TITLES.find((t) => t.match(pathname)) ?? { title: "公会大厅", sub: "" };

  return (
    <header className="sticky top-0 z-30 h-[68px] flex items-center gap-4 px-5 lg:px-8 border-b border-border bg-card/80 backdrop-blur-md shrink-0">
      <button
        className="lg:hidden text-muted hover:text-primary -ml-1"
        onClick={onMenuClick}
        aria-label="打开导航"
      >
        <Icon name="menu" className="w-6 h-6" />
      </button>

      <div className="min-w-0">
        <h1 className="font-serif font-semibold text-primary text-lg leading-tight truncate">
          {current.title}
        </h1>
        <p className="text-xs text-muted truncate hidden sm:block">{current.sub}</p>
      </div>

      <div className="flex-1" />

      {/* Search entry → 跑团大厅 */}
      <Link
        href="/sessions"
        className="hidden md:flex items-center gap-2 w-64 px-3 py-2 rounded-lg border border-border bg-background/60 text-sm text-muted hover:border-accent/40 hover:text-foreground transition"
      >
        <Icon name="search" className="w-4 h-4" />
        <span className="truncate">搜索跑团、DM、标签…</span>
      </Link>

      <button
        aria-disabled="true"
        title="消息中心即将开放"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-primary/5 cursor-not-allowed"
      >
        <Icon name="bell" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent/60" />
      </button>

      <div className="w-px h-7 bg-border hidden sm:block" />

      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary border border-border">
          <Icon name="shield" className="w-5 h-5" />
        </span>
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-medium text-foreground">冒险者</p>
          <Link href="/login" className="text-xs text-accent-600 hover:text-accent-700">
            登录 / 注册
          </Link>
        </div>
      </div>
    </header>
  );
}