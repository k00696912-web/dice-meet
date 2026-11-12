import { NextRequest } from "next/server";
import { getPublicClient, createServerSupabase } from "@/lib/supabase-server";
import { readProfileIdentity } from "@/lib/profile";
import type { CreateSessionInput } from "@/lib/types";

const DM_EMBED = "dm:profiles!sessions_dm_id_fkey(id, username, display_name, avatar_url, role, rating, attendance_rate)";

export async function GET(request: NextRequest) {
  const supabase = getPublicClient();
  const params = request.nextUrl.searchParams;

  let query = supabase
    .from("sessions")
    .select(`*, ${DM_EMBED}`)
    .in("status", ["recruiting", "ongoing"])
    .order("created_at", { ascending: false });

  const system = params.get("system");
  const style = params.get("style");
  const voiceOrText = params.get("voice_or_text");
  const beginner = params.get("beginner_friendly");

  if (system) query = query.eq("system", system);
  if (style) query = query.eq("style", style);
  if (voiceOrText) query = query.eq("voice_or_text", voiceOrText);
  if (beginner === "true") query = query.eq("beginner_friendly", true);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ sessions: data ?? [] });
}

export async function POST(request: NextRequest) {
  // 身份只认 Cookie Session：浏览器不再手工拼 Bearer，服务端也不接受请求体里的身份字段。
  const supabase = createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "请先登录", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const profile = await readProfileIdentity(supabase, user.id);
  if (profile === "missing") {
    return Response.json(
      {
        error: "账号已登录，但尚未建立冒险者档案。请完成邮箱确认后再发布跑团。",
        code: "PROFILE_NOT_FOUND",
      },
      { status: 403 }
    );
  }
  if (profile === "unavailable") {
    return Response.json(
      { error: "暂时无法确认档案状态，请稍后重试。", code: "PROFILE_CHECK_FAILED" },
      { status: 503 }
    );
  }

  let body: CreateSessionInput;
  try {
    body = (await request.json()) as CreateSessionInput;
  } catch {
    return Response.json({ error: "请求体不是有效的 JSON。", code: "INVALID_BODY" }, { status: 400 });
  }

  if (!body.title || !body.system || !body.style || !body.time_schedule || !body.description) {
    return Response.json({ error: "缺少必填字段", code: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      dm_id: user.id,
      title: body.title,
      system: body.system,
      style: body.style,
      time_schedule: body.time_schedule,
      max_players: body.max_players,
      description: body.description,
      tags: body.tags ?? [],
      voice_or_text: body.voice_or_text ?? "voice",
      beginner_friendly: body.beginner_friendly ?? false,
    })
    .select(`*, ${DM_EMBED}`)
    .single();

  if (error) {
    // 底层详情只进服务端日志，不回传浏览器。
    console.error("create session failed:", error.message);
    return Response.json(
      { error: "发布失败，请稍后重试。", code: "SESSION_CREATE_FAILED" },
      { status: 500 }
    );
  }

  return Response.json({ session: data }, { status: 201 });
}
