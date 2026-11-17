"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { signOutUser } from "@/lib/auth-client";
import type { ServerIdentity } from "@/lib/auth-session";
import { Icon } from "./icons";

// 身份由服务端布局取好后传下来，这里只渲染最小字段，不自行判断登录态。
function present(identity: ServerIdentity) {
  switch (identity.state) {
    case "ready":
      return {
        name: identity.displayName,
        sub: `@${identity.username}`,
        signedIn: true,
        note: null as string | null,
      };
    case "profile-missing":
      return {
        name: "已登录 · 未建档",
        sub: "邮箱确认未完成",
        signedIn: true,
        note: "账号已通过认证，但公会还没有你的冒险者档案。回到邮箱点一次确认链接即可建立。",
      };
    case "unavailable":
      return {
        name: "身份暂不可确认",
        sub: "档案读取失败",
        signedIn: true,
        note: "暂时读不到你的档案，身份状态以服务端为准。请稍后刷新重试。",
      };
    case "anonymous":
      return { name: "访客", sub: "登录 / 注册", signedIn: false, note: null };
  }
}

export default function UserMenu({ identity }: { identity: ServerIdentity }) {
  const view = present(identity);
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // 导航后关闭菜单，避免旧菜单挂在已切换的页面上。
  useEffect(() => {
    setOpen(false);
    setSignOutError(null);
  }, [pathname]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    const result = await signOutUser();
    if (result.ok) {
      // 服务端布局要重新按匿名 Cookie 取身份，所以 replace 之后必须 refresh。
      router.replace("/sessions");
      router.refresh();
      return;
    }
    setSignOutError(result.message);
    setSigningOut(false);
  }

  if (!view.signedIn) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary border border-border">
          <Icon name="shield" className="w-5 h-5" />
        </span>
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-medium text-foreground">{view.name}</p>
          <Link href="/login" className="text-xs text-accent-600 hover:text-accent-700">
            {view.sub}
          </Link>
        </div>
        <Link
          href="/login"
          className="sm:hidden text-xs text-accent-600 hover:text-accent-700 whitespace-nowrap"
        >
          登录
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-transparent hover:border-border hover:bg-primary/5 transition"
      >
        <Avatar name={view.name} size="sm" />
        <span className="hidden sm:block leading-tight text-left max-w-[150px]">
          <span className="block text-sm font-medium text-foreground truncate">{view.name}</span>
          <span className="block text-xs text-muted truncate">{view.sub}</span>
        </span>
        <Icon
          name="chevron-down"
          className={`w-4 h-4 text-muted hidden sm:block transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="用户菜单"
          className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl border border-border bg-card shadow-lg p-2 z-40"
        >
          <div className="flex items-center gap-2.5 px-2 py-2.5 border-b border-border mb-1">
            <Avatar name={view.name} size="md" />
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-foreground truncate">{view.name}</p>
              <p className="text-xs text-muted truncate">{view.sub}</p>
            </div>
          </div>

          {view.note && (
            <p className="px-2 py-2 text-xs leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-lg mb-1">
              {view.note}
            </p>
          )}

          <Link
            href="/profile"
            role="menuitem"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-foreground hover:bg-primary/5 transition"
          >
            <Icon name="scroll" className="w-4 h-4 text-muted" />
            个人资料
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-left text-primary hover:bg-primary/5 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Icon name="logout" className="w-4 h-4 text-muted" />
            {signingOut ? "退出中…" : "退出登录"}
          </button>

          {signOutError && (
            <p role="alert" className="px-2 py-1.5 text-xs leading-relaxed text-red-800">
              {signOutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
