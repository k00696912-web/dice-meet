import type { SupabaseClient, User } from "@supabase/supabase-js";

export type ProfileIdentity = "exists" | "missing" | "unavailable";

export type ProfileBootstrap =
  | { status: "ready"; username: string; displayName: string; created: boolean }
  | { status: "invalid-metadata"; message: string }
  | { status: "username-taken"; username: string }
  | { status: "failed"; message: string };

const USERNAME_RE = /^[a-zA-Z0-9_]{2,20}$/;
const UNIQUE_VIOLATION = "23505";

async function readProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  return { row: data ?? null, readError: error };
}

// profiles 行只由本人创建：走 RLS 的 profiles_insert_own（WITH CHECK auth.uid() = id），
// 因此不需要 service-role，也不需要改任何策略。
export async function ensureProfileForUser(
  supabase: SupabaseClient,
  user: User
): Promise<ProfileBootstrap> {
  const existing = await readProfile(supabase, user.id);

  // 已存在即视为完成：邮件链接被重复点击时走这里，不会重复插入也不会报错。
  if (existing.row) {
    return {
      status: "ready",
      username: existing.row.username,
      displayName: existing.row.display_name,
      created: false,
    };
  }
  if (existing.readError) {
    return { status: "failed", message: "无法读取档案表，请稍后重试。" };
  }

  const username = typeof user.user_metadata?.username === "string" ? user.user_metadata.username.trim() : "";
  const displayName =
    typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name.trim() : "";

  // user_metadata 来自客户端，属于系统边界，服务端必须再校验一次而不是信任注册页。
  if (!USERNAME_RE.test(username)) {
    return {
      status: "invalid-metadata",
      message: "注册信息里的用户名不符合规则（2–20 位字母、数字或下划线），无法建立档案。",
    };
  }
  if (!displayName || displayName.length > 30) {
    return {
      status: "invalid-metadata",
      message: "注册信息里的显示名不符合规则（1–30 个字符），无法建立档案。",
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id, username, display_name: displayName })
    .select("username, display_name")
    .maybeSingle();

  if (inserted) {
    return { status: "ready", username: inserted.username, displayName: inserted.display_name, created: true };
  }

  if (insertError?.code === UNIQUE_VIOLATION) {
    // 冲突可能来自并发回调（本人已建好），也可能来自用户名被占用：重查一次来区分。
    const afterConflict = await readProfile(supabase, user.id);
    if (afterConflict.row) {
      return {
        status: "ready",
        username: afterConflict.row.username,
        displayName: afterConflict.row.display_name,
        created: false,
      };
    }
    return { status: "username-taken", username };
  }

  return { status: "failed", message: "档案创建未成功，请稍后重试或联系管理员。" };
}

// 业务写入前只确认档案是否存在，绝不代为创建：建档只属于邮箱确认回调。
export async function readProfileIdentity(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileIdentity> {
  const { row, readError } = await readProfile(supabase, userId);
  if (row) return "exists";
  return readError ? "unavailable" : "missing";
}
