-- ============================================================
-- 骰子局 DiceMeet · profiles 列级写权限加固
-- 状态：第②段已于 2026-11-19 在 Supabase SQL Editor 执行成功
--       （项目 ref：mqacqiffpvvxsnqmwrhm，PostgreSQL 17.11）。
--       执行前经用户明确批准，逐字运行，未增删语句。
--
-- 已通过只读权限矩阵复核（执行后实测）：
--   · authenticated：表级 UPDATE 已撤销，仅 display_name、bio 两列可 UPDATE
--     （id / username / avatar_url / role / rating / attendance_rate /
--       created_at / updated_at 均为 false）；SELECT / INSERT / DELETE 保留。
--   · anon：表级 UPDATE 已撤销，全部列 UPDATE 均为 false；SELECT / INSERT 保留。
--   · postgres / service_role：权限未变（管理与后台通道不受影响）。
--   · 表级 ACL 由 32 行降为 30 行，消失的恰好是 anon/UPDATE 与 authenticated/UPDATE；
--     无 PUBLIC 授权行；所有 is_grantable = false。
--   · RLS 仍启用（relrowsecurity=true、relforcerowsecurity=false、owner=postgres），
--     三条策略定义与触发器 update_profiles_updated_at 均未改变，
--     update_updated_at_column() 仍为 SECURITY INVOKER。
--   · 应用层回归：GET /api/sessions 200，8 条跑团的 dm:profiles 内嵌字段完整可读。
--
-- 真实写入冒烟测试已于 2026-11-20 经用户明确批准后执行完毕（见第③-B 段）：
--   · 直连 REST 改 rating / username 均被拒（HTTP 403，SQLSTATE 42501）；
--   · 直连 REST 只改 display_name / bio 成功（HTTP 200），且 updated_at 自动刷新
--     —— 第④段的触发器风险已实测排除，两个补救方案均无需执行；
--   · 测试账号档案已逐字还原（bio 回到 NULL），只读复核通过。
--   唯一不可逆差异是 updated_at 时间戳（触发器记账，属预期）。
--
-- 目的：把「本人可改自己档案」从行级收紧到列级，
--       堵住绕过 /api/profile 直接打 Supabase REST 改写
--       rating / attendance_rate / username / role / id 的路径。
-- 本文件不修改 RLS 策略本身（policies.sql 保持原样），
-- 只调整 GRANT 层：RLS 与列级授权是「与」关系，两者都要过。
--
-- 运维注意：public schema 存在 Supabase 默认授权（ALTER DEFAULT PRIVILEGES
--   向 anon / authenticated / service_role / postgres 授予新表全部权限）。
--   它只作用于将来新建的表，不会回滚本次对 profiles 的 REVOKE；
--   但若有人 DROP + CREATE profiles，加固会被默认授权重新覆盖，需重跑第②段。
-- ============================================================


-- ------------------------------------------------------------
-- ① 诊断（只读，可反复运行，不改变任何状态）
--    2026-11-19 执行前基线实测：anon / authenticated / postgres / service_role
--    各持表级 8 项权限（含 UPDATE），十列均无任何显式列级授权，
--    无 PUBLIC 授权行，authenticated / anon 不是任何角色的成员（无继承来源）。
--
--    注意：information_schema.role_table_grants / role_column_grants 带
--    pg_has_role(grantee,'USAGE') 成员过滤，执行角色若不是目标角色的成员，
--    对应授权行会静默消失。判定授权请以直读 catalog 的 aclexplode 版本为准：
-- ------------------------------------------------------------

-- 表级授权（权威来源，含 PUBLIC；relacl 为 NULL 时展开属主隐式权限）
SELECT CASE WHEN g.grantee = 0 THEN 'PUBLIC' ELSE g.grantee::regrole::text END AS grantee,
       g.privilege_type, g.is_grantable
FROM pg_class c, aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) AS g
WHERE c.oid = 'public.profiles'::regclass
ORDER BY grantee, g.privilege_type;

-- 列级授权（权威来源；attacl 为 NULL 即该列无显式授权）
SELECT a.attnum, a.attname AS column_name,
       CASE WHEN g.grantee IS NULL THEN '(no explicit column grant)'
            WHEN g.grantee = 0 THEN 'PUBLIC'
            ELSE g.grantee::regrole::text END AS grantee,
       g.privilege_type, g.is_grantable
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN LATERAL aclexplode(a.attacl) AS g ON true
WHERE c.oid = 'public.profiles'::regclass AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY a.attnum, grantee;

-- information_schema 版本（交叉对照用，注意上面的成员过滤限制）
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

SELECT grantee, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY grantee, column_name, privilege_type;

-- 逐列判定：加固前 4 个都是 true，加固后应为 true, true, false, false
SELECT has_column_privilege('authenticated', 'public.profiles', 'display_name',    'UPDATE') AS can_display_name,
       has_column_privilege('authenticated', 'public.profiles', 'bio',             'UPDATE') AS can_bio,
       has_column_privilege('authenticated', 'public.profiles', 'rating',          'UPDATE') AS can_rating,
       has_column_privilege('authenticated', 'public.profiles', 'attendance_rate', 'UPDATE') AS can_attendance;

-- 表属主与原始 ACL（确认属主是 postgres，SQL Editor 里的管理操作不受影响）
SELECT pg_get_userbyid(relowner) AS owner, relacl
FROM pg_class
WHERE oid = 'public.profiles'::regclass;


-- ------------------------------------------------------------
-- ② 加固：authenticated 只保留 display_name / bio 两列的 UPDATE
--    先 REVOKE 表级，再 GRANT 列级；事务内完成，失败即整体回滚。
--    不动 INSERT（注册建档需要）、不动 SELECT（大厅展示 DM 资料需要）。
--    状态：已于 2026-11-19 执行成功（Success. No rows returned）。
--    下方语句保留作为记录与重建表后的重跑依据，请勿重复执行以免混淆审计。
-- ------------------------------------------------------------

BEGIN;

REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

GRANT UPDATE (display_name, bio) ON public.profiles TO authenticated;

COMMIT;

-- 让 PostgREST 重新加载 catalog（授权变更一般不需要，执行无害）
NOTIFY pgrst, 'reload schema';


-- ------------------------------------------------------------
-- ③ 执行后验证
-- ------------------------------------------------------------

-- ③-A 只读复核：已于 2026-11-19 完成，实测结果如下
--   表级 ACL：32 行 -> 30 行，消失的恰好是 anon/UPDATE 与 authenticated/UPDATE；
--             两角色的 SELECT / INSERT / DELETE / TRIGGER / TRUNCATE /
--             REFERENCES / MAINTAIN 全部保留；postgres / service_role 未变；
--             仍无 PUBLIC 行；is_grantable 全为 false。
--   列级 ACL：仅 display_name -> authenticated/UPDATE、bio -> authenticated/UPDATE
--             两行，其余八列均为 (none)。
--   has_table_privilege(authenticated, UPDATE) = false
--   has_column_privilege(authenticated, UPDATE)：
--     display_name=true, bio=true,
--     id / username / rating / attendance_rate / updated_at = false
--   anon：表级 UPDATE=false，七列 UPDATE 全 false
--   RLS / 策略 / 触发器 / 触发函数定义：与执行前逐字一致
--   应用层回归：GET /api/sessions 200，8 条跑团 dm:profiles 内嵌字段完整；
--               GET /api/profile 未登录仍 401。

-- ③-B 直连 REST 越权冒烟：已于 2026-11-20 经用户明确批准后执行，实测结果如下
--   通道：已登录浏览器会话直连 PostgREST，绕过 /api/profile。
--   headers：apikey（项目公开 publishable key）+ Authorization: Bearer 用户 access token
--            + Content-Type: application/json + Prefer。
--   目标行：测试账号本人 auth.uid()（RLS 允许本人行，故能测到列级授权这一层）。
--   令牌与密钥全程只存在于页面内存，未落盘、未写入本文件、未进入交付报告。
--
--   网关前置条件（实测踩坑）：只带 Authorization 不带 apikey 时，
--   Supabase 网关先返回 401 "No API key found in request"，
--   这不是权限判定结果；必须补 apikey 才能测到真正的 42501。
--
--   body B: {"rating":99}
--     -> HTTP 403，code=42501，message="permission denied for table profiles"
--   body C: {"username":"hacked"}
--     -> HTTP 403，code=42501，message 同上
--   body A: {"display_name":"写入测试B","bio":"直连REST合法列测试"}（Prefer: return=representation）
--     -> HTTP 200，返回行 display_name / bio 已更新；
--        rating=5、attendance_rate=100、username、id、role、avatar_url 均未变；
--        created_at 保持 2026-11-12 14:56:47.818483+00；
--        updated_at 由 2026-11-12 14:56:47.818483+00 刷新为
--        2026-11-20 04:26:34.138015+00 —— 第④段触发器风险由此实测排除。
--
--   应用层白名单对照（同批执行，走 /api/profile）：
--     GET  -> 200，返回 OWN_PROFILE_COLUMNS 九列，与数据库 BEFORE 状态逐字一致；
--     PATCH {"display_name":"写入测试A","bio":"10C-2C 写入测试 bio"} -> 200；
--     PATCH {"display_name":"不应生效","rating":99}                   -> 400 VALIDATION_ERROR；
--     PATCH {"display_name":"不应生效","id":"…0001"}                  -> 400 VALIDATION_ERROR；
--     两次 400 之后再 GET，display_name 仍为上一次合法值 -> 无部分执行。
--
--   还原（写操作，同批批准范围内）：
--     直连 REST {"display_name":"测试显示名","bio":null} -> HTTP 200。
--     bio 必须回到 NULL，而应用层校验器按契约拒绝 null，
--     故还原走直连 REST；bio 在列级授权内，本人行受 RLS 约束，路径合法。
--
--   还原后只读复核（SQL Editor，string_agg 单格输出）：
--     display_name=测试显示名、bio IS NULL=true、rating=5、attendance_rate=100、
--     role=player、avatar_url IS NULL=true、username 与 id 未变、
--     created_at=2026-11-12 14:56:47.818483+00（原值）；
--     updated_at=2026-11-20 04:26:49.360016+00（唯一不可逆差异，触发器记账，预期）。
--     表级 ACL 仍 30 行、列级 ACL 仍只有 display_name / bio 两行；
--     anon 表级 UPDATE=false，authenticated 表级 SELECT/INSERT=true；
--     三条 RLS 策略与 update_profiles_updated_at 触发器定义未变；
--     profiles=4、auth.users=4（无增删行）。
--
--   应用层回归（还原后）：
--     / 200、/sessions 200、/npcs 200、/api/sessions 200（8 条，
--     dm:profiles 内嵌读到已还原的 display_name）、随机路径 404、
--     /api/profile 未登录 401、/profile 未登录 307（middleware 重定向，预期）。
--     验证结束后已停掉本次临时 dev server，3000 端口无监听。


-- ------------------------------------------------------------
-- ④ updated_at 触发器风险：【已于 2026-11-20 实测排除，无需任何补救】
--    update_profiles_updated_at (BEFORE UPDATE) 会把
--    NEW.updated_at = NOW()，而 updated_at 不在列级授权里。
--
--    PostgreSQL 的列级 UPDATE 校验发生在语句解析阶段，只检查
--    语句里显式 SET 的列 + WHERE/约束读到的列（后者只要 SELECT，
--    authenticated 已有表级 SELECT）。触发器对 NEW 的赋值不属于
--    显式 SET，因此不受影响。
--
--    实测确证（③-B body A，真实 UPDATE，Prefer: return=representation）：
--      只 SET display_name / bio 两列 -> HTTP 200，未报 42501；
--      updated_at 从 2026-11-12 14:56:47.818483+00 自动刷新为
--      2026-11-20 04:26:34.138015+00，created_at 未变。
--      该账号此前从未被更新过（updated_at = created_at），
--      因此这次刷新只可能来自触发器，证据无歧义。
--
--    2026-11-19 的只读取证与上述实测一致：
--      · 数据库版本 PostgreSQL 17.11；
--      · public.update_updated_at_column() owner=postgres、
--        prosecdef=false（SECURITY INVOKER）、proconfig 为空；
--      · 函数体只有 NEW.updated_at = NOW(); RETURN NEW;，
--        不含任何 SQL 语句，因此不会触发额外的列权限检查；
--      · RLS 策略表达式只读 id，表级 SELECT 已保留；
--      · PostgREST return=representation 的 RETURNING 也只需 SELECT。
--
--    结论：下面两个备选修法均【无需执行】，仅作为历史记录保留。
--    若将来重建表或改动触发函数后再次出现 42501，才需要重新评审：
--      方案 1（简单）：把 updated_at 一并纳入列级授权
--        GRANT UPDATE (display_name, bio, updated_at) ON public.profiles TO authenticated;
--        代价：用户可直连 REST 覆写自己行的 updated_at（仅时间戳记账，风险低）。
--      方案 2（更干净）：把触发函数改为 SECURITY DEFINER
--        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
--        RETURNS trigger LANGUAGE plpgsql AS $$
--        BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
--        -- 注意：SECURITY DEFINER 需同时确认 owner 与 search_path，改动前单独评审。
--    两个修法都不需要回滚本文件的 REVOKE，且都需另行批准后才可执行。


-- ------------------------------------------------------------
-- ⑤ 回滚（仅在加固引发未预期故障时使用）
-- ------------------------------------------------------------
-- BEGIN;
-- REVOKE UPDATE (display_name, bio) ON public.profiles FROM authenticated;
-- GRANT UPDATE ON public.profiles TO authenticated;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
