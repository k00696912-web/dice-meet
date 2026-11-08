-- 骰子局 DiceMeet 种子数据（演示用）
-- 在 Supabase SQL Editor 中执行（在 schema.sql 和 policies.sql 之后）
-- 可重复执行：使用固定 UUID + ON CONFLICT DO NOTHING

-- ============================================
-- 1. 测试用户（auth.users）
-- ============================================
INSERT INTO auth.users (
  id, aud, role, email, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'dm_li@dicemeet.dev', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'dm_zhang@dicemeet.dev', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'dm_wang@dicemeet.dev', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 用户资料（profiles）
-- ============================================
INSERT INTO profiles (id, username, display_name, bio, role, attendance_rate, rating)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'lao_li', '老李', '五年带团经验，擅长剧情向长篇战役，新手友好。', 'dm', 98.5, 4.9),
  ('00000000-0000-0000-0000-000000000002', 'zhang_dm', '张DM', '克苏鲁爱好者，专注恐怖悬疑模组，注重氛围营造。', 'dm', 95.0, 4.7),
  ('00000000-0000-0000-0000-000000000003', 'xiao_wang', '小王', '赛博朋克与科幻题材，轻松欢乐向，欢迎整活。', 'both', 92.3, 4.6)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. 跑团（sessions）
-- ============================================
INSERT INTO sessions (
  dm_id, title, system, style, time_schedule, max_players, current_players,
  description, tags, status, voice_or_text, beginner_friendly
)
VALUES
  ('00000000-0000-0000-0000-000000000001', '被遗忘的国度：初探', 'D&D 5e', '严肃剧情', '每周六 20:00', 5, 3,
   '剑湾北境的一座小镇接连发生失踪案，冒险者受托调查，却卷入更深的阴谋。适合想体验经典奇幻战役的玩家，规则讲解充分。',
   ARRAY['新手友好', '语音', '长期团'], 'recruiting', 'voice', true),

  ('00000000-0000-0000-0000-000000000002', '克苏鲁的呼唤：暗影低语', 'COC 7th', '恐怖悬疑', '每周日 19:00', 6, 4,
   '1925 年的阿卡姆，一位古董商人的离奇死亡牵出一本神秘书籍。调查员们将直面不可名状之物。心理承受力弱者慎入。',
   ARRAY['硬核', '文字', '短团'], 'recruiting', 'text', false),

  ('00000000-0000-0000-0000-000000000003', '赛博朋克：夜之城', 'Cyberpunk RED', '轻松搞笑', '每周五 21:00', 4, 2,
   '霓虹灯下的夜之城，一群边缘行者接到一单看似简单的委托。高能整活，欢迎脑洞，剧情随玩家选择展开。',
   ARRAY['新手友好', '语音', '中期团', 'AI NPC'], 'recruiting', 'voice', true),

  ('00000000-0000-0000-0000-000000000001', '龙枪编年史：长枪之战', 'D&D 5e', '硬核战斗', '每周三 20:30', 6, 5,
   '克莱恩大陆战火重燃，龙骑士兵临城下。战术导向的高难度战役，适合喜欢策略与团队配合的老玩家。',
   ARRAY['硬核', '语音', '长期团'], 'recruiting', 'voice', false),

  ('00000000-0000-0000-0000-000000000002', '山海奇谭：泛用无界', '泛用无界', '自由探索', '每周四 19:30', 5, 2,
   '以《山海经》为背景的东方奇幻世界，自由探索的上古洪荒。规则轻量，重叙事与想象，新手也能快速上手。',
   ARRAY['新手友好', '文字', '中期团', 'AI NPC'], 'recruiting', 'text', true),

  ('00000000-0000-0000-0000-000000000003', '废土求生：最后一班车', 'Cyberpunk RED', '严肃剧情', '每周一 21:00', 4, 4,
   '文明崩塌后的废土，一辆装甲列车载着最后的希望穿越辐射荒原。资源管理与道德抉择并重的生存战役。',
   ARRAY['硬核', '语音', '短团'], 'ongoing', 'voice', false)
ON CONFLICT DO NOTHING;
