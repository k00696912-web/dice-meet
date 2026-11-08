import { NextRequest } from "next/server";
import { getPublicClient } from "@/lib/supabase-server";

const DM_EMBED = "dm:profiles!sessions_dm_id_fkey(id, username, display_name, avatar_url, bio, role, rating, attendance_rate)";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getPublicClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(`*, ${DM_EMBED}`)
    .eq("id", params.id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return Response.json({ error: error.message }, { status });
  }

  return Response.json({ session: data });
}
