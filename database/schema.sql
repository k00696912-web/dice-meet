-- 骰子局 DiceMeet 数据库设计
-- 在 Supabase SQL Editor 中执行

-- 用户表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'dm', 'both')),
  attendance_rate REAL DEFAULT 100.0,
  rating REAL DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 跑团表
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dm_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  system TEXT NOT NULL,
  style TEXT NOT NULL,
  time_schedule TEXT NOT NULL,
  max_players INTEGER NOT NULL CHECK (max_players >= 2 AND max_players <= 10),
  current_players INTEGER DEFAULT 1,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'ongoing', 'completed', 'cancelled')),
  voice_or_text TEXT DEFAULT 'voice' CHECK (voice_or_text IN ('voice', 'text', 'offline')),
  beginner_friendly BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 跑团申请/成员表
CREATE TABLE session_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('dm', 'player', 'ai_npc')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'left')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- AI NPC 设定表
CREATE TABLE ai_npcs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  background TEXT,
  relationship TEXT DEFAULT 'ally' CHECK (relationship IN ('ally', 'enemy', 'neutral', 'mysterious')),
  behavior_boundaries TEXT,
  secrets TEXT,
  model TEXT DEFAULT 'auto',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI NPC 对话记录表
CREATE TABLE ai_npc_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  npc_id UUID REFERENCES ai_npcs(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  context_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评价表
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  attendance BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id, reviewee_id)
);

-- 启用 RLS（行级安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_npc_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX idx_sessions_system ON sessions(system);
CREATE INDEX idx_sessions_style ON sessions(style);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_session_members_user ON session_members(user_id);
CREATE INDEX idx_session_members_session ON session_members(session_id);
CREATE INDEX idx_ai_npcs_session ON ai_npcs(session_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
