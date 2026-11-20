import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

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

// 读取接口的返回模型：复用 lib/types.ts 的 Profile，
// 只把 created_at 从可选收紧成必填（数据库该列 NOT NULL DEFAULT now()）。
export interface OwnProfile extends Profile {
  created_at: string;
}

export type OwnProfileResult =
  | { state: "ready"; profile: OwnProfile }
  | { state: "missing" }
  | { state: "unavailable" };

// 只读自己的档案：字段显式列举，避免未来新增列被 select(*) 顺带带出去。
// GET 与 PATCH 共用这一份列清单，保证两个接口返回同构。
export const OWN_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, role, attendance_rate, rating, created_at";

export async function readOwnProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnProfileResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select(OWN_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) return { state: "unavailable" };
  if (!data) return { state: "missing" };
  return { state: "ready", profile: data as OwnProfile };
}

// 与前端 profile 页的 NICKNAME_MAX / BIO_MAX 取同一组上限。
export const PROFILE_DISPLAY_NAME_MAX = 40;
export const PROFILE_BIO_MAX = 200;

export type ProfilePatch = { display_name?: string; bio?: string };

export type ProfilePatchCheck =
  | { ok: true; patch: ProfilePatch }
  | { ok: false; message: string };

const PATCHABLE_KEYS = ["display_name", "bio"];

// 纯函数：不碰数据库、不碰身份，便于隔离测试。
// 白名单之外的键一律整体拒绝，绝不部分执行；返回的 patch 是服务端新建对象，
// 只含明确提交且校验通过的字段，调用方不得再把请求体 spread 进去。
export function validateProfilePatch(body: unknown): ProfilePatchCheck {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "请求体必须是 JSON 对象。" };
  }

  const source = body as Record<string, unknown>;
  const keys = Object.keys(source);

  if (keys.length === 0) {
    return { ok: false, message: "请至少提供 display_name 或 bio 中的一项。" };
  }
  if (keys.some((key) => !PATCHABLE_KEYS.includes(key))) {
    return { ok: false, message: "本接口只接受 display_name 与 bio，其余字段一律拒绝。" };
  }

  const patch: ProfilePatch = {};

  if (keys.includes("display_name")) {
    const raw = source.display_name;
    if (typeof raw !== "string") {
      return { ok: false, message: "display_name 必须是字符串。" };
    }
    const value = raw.trim();
    if (!value) {
      return { ok: false, message: "昵称不能为空。" };
    }
    if (value.length > PROFILE_DISPLAY_NAME_MAX) {
      return { ok: false, message: `昵称不能超过 ${PROFILE_DISPLAY_NAME_MAX} 字。` };
    }
    patch.display_name = value;
  }

  if (keys.includes("bio")) {
    const raw = source.bio;
    if (typeof raw !== "string") {
      return { ok: false, message: "bio 必须是字符串。" };
    }
    // 前端按原始长度计数且不 trim，这里保持一致，避免两边字数对不上。
    if (raw.length > PROFILE_BIO_MAX) {
      return { ok: false, message: `个人简介不能超过 ${PROFILE_BIO_MAX} 字。` };
    }
    patch.bio = raw;
  }

  return { ok: true, patch };
}
