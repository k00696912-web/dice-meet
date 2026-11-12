import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// 必须在请求作用域内调用：cookies() 绑定当前请求，提到模块顶层会让多个请求共享同一份快照。
// Next 14.2.5 的 cookies() 是同步 API，不能 await。
export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 内写 Cookie 会抛错；刷新由 middleware 负责，此处忽略。
        }
      },
    },
  });
}
