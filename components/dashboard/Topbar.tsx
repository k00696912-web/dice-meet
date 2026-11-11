"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "./icons";

const TITLES: { match: (p: string) => boolean; title: string; sub: string }[] = [
  { match: (p) => p === "/", title: "公会大厅", sub: "欢迎回到冒险者公会" },
  { match: (p) => p.startsWith("/sessions/"), title: "委托详情", sub: "查看这份冒险委托" },
  { match: (p) => p.startsWith("/sessions"), title: "跑团大厅", sub: "浏览公会发布的委托" },
  { match: (p) => p.startsWith("/create"), title: "发布招募", sub: "以公会之名发布委托" },
  { match: (p) => p.startsWith("/applications"), title: "申请管理", sub: "审核冒险者的加入申请" },
  { match: (p) => p.startsWith("/my-sessions"), title: "我的跑团", sub: "你主持与参与的冒险" },
  { match: (p) => p.startsWith("/npcs/create"), title: "创建 AI NPC", sub: "为已有委托设定智能角色" },
  { match: (p) => p.startsWith("/npcs/"), title: "NPC 角色档案", sub: "查看设定、秘密与活动" },
  { match: (p) => p.startsWith("/npcs"), title: "AI NPC 工作台", sub: "管理你的智能角色" },
  { match: (p) => p.startsWith("/profile"), title: "冒险者档案", sub: "你的公会信用档案" },
];

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const current = TITLES.find((t) => t.match(pathname)) ?? { title: "公会大厅", sub: "" };

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = keyword.trim();
    router.push(q ? `/sessions?q=${encodeURIComponent(q)}` : "/sessions");
  }

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
        {/* 页面级 <h1> 由各页自身提供，顶栏标题不再用 h1，避免一页两个 h1 */}
        <p className="font-serif font-semibold text-primary text-lg leading-tight truncate">
          {current.title}
        </p>
        <p className="text-xs text-muted truncate hidden sm:block">{current.sub}</p>
      </div>

      <div className="flex-1" />

      {/* 搜索入口：桌面端为真实输入框，回车后带关键词跳转跑团大厅 */}
      <form
        role="search"
        onSubmit={submitSearch}
        className="hidden md:flex items-center relative w-64 shrink-0"
      >
        <Icon
          name="search"
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none"
        />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="搜索跑团"
          placeholder="搜索跑团、DM、标签…"
          className="w-full py-2 pl-9 pr-3 rounded-lg border border-border bg-background/60 text-sm text-foreground placeholder:text-muted/60 transition focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </form>

      {/* 移动端保留图标入口，跳到大厅的关键词搜索框，不挤压汉堡菜单与用户入口 */}
      <Link
        href="/sessions"
        aria-label="到大厅搜索跑团"
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-primary hover:bg-primary/5 transition shrink-0"
      >
        <Icon name="search" />
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