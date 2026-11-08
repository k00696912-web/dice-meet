import { NextRequest } from "next/server";
import { getPublicClient, getAuthClient, extractToken } from "@/lib/supabase-server";
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
  const token = extractToken(request);
  if (!token) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getAuthClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "登录已失效，请重新登录" }, { status: 401 });
  }

  const body = (await request.json()) as CreateSessionInput;

  if (!body.title || !body.system || !body.style || !body.time_schedule || !body.description) {
    return Response.json({ error: "缺少必填字段" }, { status: 400 });
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
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ session: data }, { status: 201 });
}
