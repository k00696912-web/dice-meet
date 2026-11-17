import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase-server";

// 只给界面最小必要字段：显示名 + 用户名。
// 令牌（access/refresh）留在服务端 Cookie，绝不下发到客户端。
export type ServerIdentity =
  | { state: "anonymous" }
  | { state: "ready"; displayName: string; username: string }
  | { state: "profile-missing" }
  | { state: "unavailable" };

// cache() 让同一次请求里多个服务端组件共用一次 getUser + 一次档案读取。
export const getServerIdentity = cache(async (): Promise<ServerIdentity> => {
  const supabase = createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { state: "anonymous" };

  const { data, error: readError } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("identity profile read failed:", readError.message);
    }
    return { state: "unavailable" };
  }
  if (!data) return { state: "profile-missing" };

  return { state: "ready", displayName: data.display_name, username: data.username };
});
