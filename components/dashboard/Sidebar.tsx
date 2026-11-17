"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui";
import type { ServerIdentity } from "@/lib/auth-session";
import { Icon, type IconName } from "./icons";

interface NavItem {
  label: string;
  icon: IconName;
  href?: string;
  soon?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "探索",
    items: [
      { label: "跑团大厅", icon: "compass", href: "/sessions" },
      { label: "智能推荐", icon: "sparkles", soon: true },
      { label: "我的收藏", icon: "bookmark", soon: true },
    ],
  },
  {
    title: "我的冒险",
    items: [
      { label: "我的跑团", icon: "swords", href: "/my-sessions" },
      { label: "我的应征", icon: "inbox", soon: true },
      { label: "消息中心", icon: "bell", soon: true },
      { label: "冒险者档案", icon: "shield", href: "/profile" },
    ],
  },
  {
    title: "创作者",
    items: [
      { label: "发布招募", icon: "megaphone", href: "/create" },
      { label: "申请管理", icon: "inbox", href: "/applications" },
      { label: "DM 工作台", icon: "dice", soon: true },
      { label: "AI NPC 工作台", icon: "bot", href: "/npcs" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// 与 Topbar 共用服务端 identity 状态，这里只决定卡片文案，不另建身份查询。
function guildCard(identity: ServerIdentity) {
  switch (identity.state) {
    case "ready":
      return {
        title: identity.displayName,
        sub: `@${identity.username}`,
        note: null as string | null,
        withAvatar: true,
        cta: { href: "/profile", label: "个人资料" } as { href: string; label: string } | null,
      };
    case "profile-missing":
      return {
        title: "已登录 · 未建档",
        sub: null,
        note: "邮箱确认尚未完成，公会还没有你的冒险者档案。",
        withAvatar: false,
        cta: null,
      };
    case "unavailable":
      return {
        title: "身份信息暂时不可用",
        sub: null,
        note: "档案读取失败，身份状态以服务端为准，请稍后刷新。",
        withAvatar: false,
        cta: null,
      };
    case "anonymous":
      return {
        title: "冒险者档案",
        sub: null,
        note: "登录后同步你的跑团与信用档案。",
        withAvatar: false,
        cta: { href: "/login", label: "登录 / 注册" },
      };
  }
}

export default function Sidebar({
  identity,
  open,
  onClose,
}: {
  identity: ServerIdentity;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const card = guildCard(identity);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-primary-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-card border-r border-border transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-[68px] flex items-center gap-3 px-5 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-accent-200 shadow-sm">
              <Icon name="dice" className="w-5 h-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-serif font-bold text-primary text-base">骰子局</span>
              <span className="block text-[11px] tracking-wide text-accent-600">DiceMeet · 冒险者公会</span>
            </span>
          </Link>
          <button
            className="ml-auto lg:hidden text-muted hover:text-primary"
            onClick={onClose}
            aria-label="关闭导航"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isActive(pathname, item.href)
                            ? "bg-primary text-white shadow-sm"
                            : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          className={isActive(pathname, item.href) ? "text-accent-200" : "text-muted"}
                        />
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted/60 cursor-not-allowed"
                      >
                        <Icon name={item.icon} className="text-muted/50" />
                        {item.label}
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-muted/70">
                          待开放
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
              设置
            </p>
            <span
              aria-disabled="true"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted/60 cursor-not-allowed"
            >
              <Icon name="settings" className="text-muted/50" />
              偏好设置
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-muted/70">
                待开放
              </span>
            </span>
          </div>
        </nav>

        {/* Bottom guild card */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="rounded-xl bg-primary/5 border border-border p-3">
            {card.withAvatar ? (
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar name={card.title} size="sm" />
                <div className="min-w-0 leading-tight">
                  <p className="text-sm font-serif font-semibold text-primary truncate">
                    {card.title}
                  </p>
                  <p className="text-[11px] text-muted truncate">{card.sub}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1 text-primary">
                <Icon name="shield" className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-serif font-semibold">{card.title}</span>
              </div>
            )}
            {card.note && (
              <p className="text-xs text-muted mb-2.5 leading-relaxed">{card.note}</p>
            )}
            {card.cta && (
              <Link
                href={card.cta.href}
                onClick={onClose}
                className="block text-center text-xs font-medium py-1.5 rounded-lg bg-primary text-white hover:bg-primary-600 transition"
              >
                {card.cta.label}
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}