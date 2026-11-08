"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      { label: "我的跑团", icon: "swords", soon: true },
      { label: "我的申请", icon: "inbox", soon: true },
      { label: "消息中心", icon: "bell", soon: true },
    ],
  },
  {
    title: "创作者",
    items: [
      { label: "发布招募", icon: "megaphone", href: "/create" },
      { label: "DM 工作台", icon: "dice", soon: true },
      { label: "AI NPC 工作台", icon: "bot", soon: true },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

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
            <div className="flex items-center gap-2 mb-1 text-primary">
              <Icon name="shield" className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-serif font-semibold">冒险者档案</span>
            </div>
            <p className="text-xs text-muted mb-2.5 leading-relaxed">
              登录后同步你的跑团与信用档案。
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="block text-center text-xs font-medium py-1.5 rounded-lg bg-primary text-white hover:bg-primary-600 transition"
            >
              登录 / 注册
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}