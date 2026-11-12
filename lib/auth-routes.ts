// 10B 的访问策略：只有这些前缀需要登录。/npcs 与 /npcs/[id] 本批保持匿名可浏览。
export const PRIVATE_PATH_PREFIXES = [
  "/create",
  "/profile",
  "/my-sessions",
  "/applications",
  "/npcs/create",
] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// redirect 只接受站内相对路径：挡掉绝对 URL、协议相对（// 与 /\）以及控制字符。
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = "/sessions"
): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  return raw;
}
