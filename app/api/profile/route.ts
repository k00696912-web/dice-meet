import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  OWN_PROFILE_COLUMNS,
  readOwnProfile,
  readProfileIdentity,
  validateProfilePatch,
  type OwnProfile,
} from "@/lib/profile";

// 身份只认 Cookie Session：浏览器不提交 id，服务端也不接受请求体里的身份字段。
export async function GET() {
  const supabase = createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "请先登录。", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const result = await readOwnProfile(supabase, user.id);

  if (result.state === "unavailable") {
    return Response.json(
      { error: "暂时无法读取你的档案，请稍后重试。", code: "PROFILE_READ_FAILED" },
      { status: 500 }
    );
  }
  if (result.state === "missing") {
    return Response.json(
      {
        error: "账号已登录，但还没有冒险者档案。请回到邮箱完成确认链接后再试。",
        code: "PROFILE_NOT_FOUND",
      },
      { status: 403 }
    );
  }

  return Response.json({ profile: result.profile });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "请先登录。", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const identity = await readProfileIdentity(supabase, user.id);
  if (identity === "missing") {
    return Response.json(
      {
        error: "账号已登录，但还没有冒险者档案。请回到邮箱完成确认链接后再试。",
        code: "PROFILE_NOT_FOUND",
      },
      { status: 403 }
    );
  }
  if (identity === "unavailable") {
    return Response.json(
      { error: "暂时无法确认档案状态，请稍后重试。", code: "PROFILE_CHECK_FAILED" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求体不是有效的 JSON。", code: "INVALID_BODY" }, { status: 400 });
  }

  const checked = validateProfilePatch(body);
  if (!checked.ok) {
    return Response.json({ error: checked.message, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // 更新对象来自校验器的白名单结果，id 只取服务端认证身份。
  const { data, error } = await supabase
    .from("profiles")
    .update(checked.patch)
    .eq("id", user.id)
    .select(OWN_PROFILE_COLUMNS)
    .single();

  if (error || !data) {
    // 底层详情只进服务端日志，不回传浏览器。
    console.error("profile update failed:", error?.message ?? "no row returned");
    return Response.json(
      { error: "保存失败，请稍后重试。", code: "PROFILE_UPDATE_FAILED" },
      { status: 500 }
    );
  }

  return Response.json({ profile: data as OwnProfile });
}
