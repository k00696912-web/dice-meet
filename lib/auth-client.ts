import { supabase } from "@/lib/supabase";

export type SignOutResult = { ok: true } | { ok: false; message: string };

// 退出统一入口：scope 用默认的 global，一并撤销刷新令牌，避免其他设备留着可用会话。
// Cookie 由 @supabase/ssr 清除，服务端不另建第二套会话机制。
// 本批只提供方法，Topbar 退出按钮与身份展示留给 10C。
export async function signOutUser(): Promise<SignOutResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("signOut failed:", error.message);
      }
      return { ok: false, message: "退出没有完成，请稍后重试。" };
    }
    return { ok: true };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("signOut threw:", err);
    }
    return { ok: false, message: "无法连接认证服务，退出没有完成。" };
  }
}
