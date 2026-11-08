export type UserRole = "player" | "dm" | "both";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  attendance_rate: number;
  rating: number;
  created_at?: string;
}

export type SessionStatus = "recruiting" | "ongoing" | "completed" | "cancelled";
export type VoiceOrText = "voice" | "text" | "offline";

export interface Session {
  id: string;
  dm_id: string;
  title: string;
  system: string;
  style: string;
  time_schedule: string;
  max_players: number;
  current_players: number;
  description: string;
  tags: string[];
  status: SessionStatus;
  voice_or_text: VoiceOrText;
  beginner_friendly: boolean;
  created_at: string;
  updated_at?: string;
  dm?: Profile;
}

export interface CreateSessionInput {
  title: string;
  system: string;
  style: string;
  time_schedule: string;
  max_players: number;
  description: string;
  tags: string[];
  voice_or_text: VoiceOrText;
  beginner_friendly: boolean;
}
