-- 骰子局 DiceMeet RLS 策略
-- 在 Supabase SQL Editor 中执行（在 schema.sql 之后）

-- ============================================
-- profiles 表策略
-- ============================================

-- 所有人可以查看用户资料（用于展示 DM/玩家信息）
CREATE POLICY "profiles_select_public"
ON profiles FOR SELECT
USING (true);

-- 用户只能更新自己的资料
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 用户只能插入自己的资料（注册时）
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- sessions 表策略
-- ============================================

-- 所有人可以查看招募中和进行中的跑团
CREATE POLICY "sessions_select_public"
ON sessions FOR SELECT
USING (status IN ('recruiting', 'ongoing'));

-- DM 可以查看自己的所有跑团（包括已完成/取消的）
CREATE POLICY "sessions_select_own"
ON sessions FOR SELECT
USING (auth.uid() = dm_id);

-- 登录用户可以创建跑团（自动成为 DM）
CREATE POLICY "sessions_insert_authenticated"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = dm_id);

-- DM 只能更新自己的跑团
CREATE POLICY "sessions_update_own"
ON sessions FOR UPDATE
USING (auth.uid() = dm_id);

-- DM 只能删除自己的跑团
CREATE POLICY "sessions_delete_own"
ON sessions FOR DELETE
USING (auth.uid() = dm_id);

-- ============================================
-- session_members 表策略
-- ============================================

-- 跑团成员可以查看该跑团的所有成员
CREATE POLICY "session_members_select_member"
ON session_members FOR SELECT
USING (
  -- 自己是该跑团成员
  user_id = auth.uid()
  OR
  -- 或者是该跑团的 DM
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_members.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- 登录用户可以申请加入跑团
CREATE POLICY "session_members_insert_authenticated"
ON session_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND
  -- 不能重复申请
  NOT EXISTS (
    SELECT 1 FROM session_members sm
    WHERE sm.session_id = session_members.session_id
    AND sm.user_id = auth.uid()
  )
);

-- DM 可以更新成员状态（审核通过/拒绝）
CREATE POLICY "session_members_update_dm"
ON session_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_members.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- 用户可以更新自己的状态（离开跑团）
CREATE POLICY "session_members_update_own"
ON session_members FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- ai_npcs 表策略
-- ============================================

-- 跑团成员可以查看 AI NPC 设定
CREATE POLICY "ai_npcs_select_member"
ON ai_npcs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_members
    WHERE session_members.session_id = ai_npcs.session_id
    AND session_members.user_id = auth.uid()
    AND session_members.status = 'approved'
  )
  OR
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = ai_npcs.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- DM 可以创建 AI NPC
CREATE POLICY "ai_npcs_insert_dm"
ON ai_npcs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = ai_npcs.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- DM 可以更新 AI NPC
CREATE POLICY "ai_npcs_update_dm"
ON ai_npcs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = ai_npcs.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- DM 可以删除 AI NPC
CREATE POLICY "ai_npcs_delete_dm"
ON ai_npcs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = ai_npcs.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- ============================================
-- ai_npc_logs 表策略
-- ============================================

-- 跑团成员可以查看对话记录
CREATE POLICY "ai_npc_logs_select_member"
ON ai_npc_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_members
    WHERE session_members.session_id = ai_npc_logs.session_id
    AND session_members.user_id = auth.uid()
    AND session_members.status = 'approved'
  )
  OR
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = ai_npc_logs.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- 跑团成员可以插入对话记录（与 AI NPC 对话）
CREATE POLICY "ai_npc_logs_insert_member"
ON ai_npc_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_members
    WHERE session_members.session_id = ai_npc_logs.session_id
    AND session_members.user_id = auth.uid()
    AND session_members.status = 'approved'
  )
  OR
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = ai_npc_logs.session_id
    AND sessions.dm_id = auth.uid()
  )
);

-- ============================================
-- reviews 表策略
-- ============================================

-- 所有人可以查看评价（用于展示信用分）
CREATE POLICY "reviews_select_public"
ON reviews FOR SELECT
USING (true);

-- 跑团成员可以创建评价（只能评价同团成员）
CREATE POLICY "reviews_insert_member"
ON reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND
  -- 评价者必须是该跑团成员
  EXISTS (
    SELECT 1 FROM session_members
    WHERE session_members.session_id = reviews.session_id
    AND session_members.user_id = auth.uid()
    AND session_members.status = 'approved'
  )
  AND
  -- 被评价者也必须是该跑团成员
  EXISTS (
    SELECT 1 FROM session_members
    WHERE session_members.session_id = reviews.session_id
    AND session_members.user_id = reviews.reviewee_id
    AND session_members.status = 'approved'
  )
);

-- 用户只能更新自己的评价
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

-- 用户只能删除自己的评价
CREATE POLICY "reviews_delete_own"
ON reviews FOR DELETE
USING (auth.uid() = reviewer_id);
