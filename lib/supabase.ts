import { createBrowserClient } from "@supabase/ssr";

// 浏览器端唯一 client。session 落在 Cookie 而非 localStorage，
// middleware 与服务端 client 才能读到同一份登录态。
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
