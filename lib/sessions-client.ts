import { supabase } from "@/lib/supabase";
import type { CreateSessionInput, Session } from "@/lib/types";

// 显式列清单与 database/schema.sql 的 sessions 表逐列对齐（15 列），
// 与原 API select(*) 的暴露面持平，且未来新增列不会被顺带读出。
export const SESSION_COLUMNS =
  "id, dm_id, title, system, style, time_schedule, max_players, current_players, description, tags, status, voice_or_text, beginner_friendly, created_at, updated_at";

// 列表七列 / 详情八列（多 bio），沿用原 API 的 DM_EMBED 口径。
// 内嵌 profiles 不含 created_at/updated_at：他人时间戳一律不读。
export const DM_EMBED_LIST =
  "dm:profiles!sessions_dm_id_fkey(id, username, display_name, avatar_url, role, rating, attendance_rate)";
export const DM_EMBED_DETAIL =
  "dm:profiles!sessions_dm_id_fkey(id, username, display_name, avatar_url, bio, role, rating, attendance_rate)";

export interface SessionListFilters {
  system?: string;
  style?: string;
  voice_or_text?: string;
  beginner_friendly?: boolean;
}

export async function fetchSessionList(
  filters: SessionListFilters = {},
  signal?: AbortSignal
) {
  let query = supabase
    .from("sessions")
    .select(`${SESSION_COLUMNS}, ${DM_EMBED_LIST}`)
    .in("status", ["recruiting", "ongoing"])
    .order("created_at", { ascending: false });

  if (filters.system) query = query.eq("system", filters.system);
  if (filters.style) query = query.eq("style", filters.style);
  if (filters.voice_or_text) query = query.eq("voice_or_text", filters.voice_or_text);
  if (filters.beginner_friendly) query = query.eq("beginner_friendly", true);
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  // 无生成类型时 supabase-js 把内嵌 dm 推断为数组；PostgREST 对一关系实际返回对象，经 unknown 收窄。
  return { sessions: (data ?? []) as unknown as Session[], error };
}

// 详情不加 status 过滤，与原 API 持平：completed/cancelled 的可见性由 RLS 决定，
// 查不到行时 PostgREST 返回 PGRST116，调用方映射为 404 态。
export async function fetchSessionDetail(id: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`${SESSION_COLUMNS}, ${DM_EMBED_DETAIL}`)
    .eq("id", id)
    .single();

  return { session: (data ?? null) as unknown as Session | null, error };
}

// INSERT 严格十字段（A-17 白名单）：dm_id 只取调用方从 auth.getUser() 得到的身份，
// 不提交 id/status/current_players/created_at/updated_at，全部交给数据库默认值。
export async function createSession(input: CreateSessionInput, dmId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      dm_id: dmId,
      title: input.title,
      system: input.system,
      style: input.style,
      time_schedule: input.time_schedule,
      max_players: input.max_players,
      description: input.description,
      tags: input.tags ?? [],
      voice_or_text: input.voice_or_text ?? "voice",
      beginner_friendly: input.beginner_friendly ?? false,
    })
    .select(`${SESSION_COLUMNS}, ${DM_EMBED_LIST}`)
    .single();

  return { session: (data ?? null) as unknown as Session | null, error };
}