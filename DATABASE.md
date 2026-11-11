# 数据库设计 DATABASE

> 骰子局 DiceMeet · Supabase（PostgreSQL）。来源：`database/schema.sql`、`database/policies.sql`、`database/seed.sql`。最后更新：2026-11-11。

## 概览

共 **6 张业务表**，全部启用行级安全（RLS）。用户身份由 Supabase 内置 `auth.users` 管理，`profiles` 与之 1:1 扩展。

| 表 | 用途 | 当前状态 |
|---|---|---|
| `profiles` | 用户资料（DM/玩家信用档案） | 已建，种子数据；无写入 API |
| `sessions` | 跑团（委托） | 已建，**已接入读/写 API** |
| `session_members` | 跑团申请/成员关系 | 已建，无 API（申请加入未实现） |
| `ai_npcs` | AI NPC 设定 | 已建，无 API/UI（核心亮点待开发） |
| `ai_npc_logs` | AI NPC 对话记录 | 已建，无 API/UI |
| `reviews` | 团内互评（信用） | 已建，无 API/UI |

执行顺序：`schema.sql` → `policies.sql` → `seed.sql`（在 Supabase SQL Editor 中）。

---

## 一、表结构

### 1. profiles — 用户资料
| 字段 | 类型 | 约束 / 默认 | 说明 |
|---|---|---|---|
| `id` | UUID | PK，`REFERENCES auth.users ON DELETE CASCADE` | 与 auth 用户同 id |
| `username` | TEXT | UNIQUE NOT NULL | 唯一用户名 |
| `display_name` | TEXT | NOT NULL | 昵称 |
| `avatar_url` | TEXT | 可空 | 头像 |
| `bio` | TEXT | 可空 | 简介 |
| `role` | TEXT | DEFAULT `'player'`，CHECK ∈ (`player`,`dm`,`both`) | 身份 |
| `attendance_rate` | REAL | DEFAULT `100.0` | 出勤率（信用） |
| `rating` | REAL | DEFAULT `5.0` | 评分（信用） |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()`，触发器自动更新 | |

### 2. sessions — 跑团
| 字段 | 类型 | 约束 / 默认 | 说明 |
|---|---|---|---|
| `id` | UUID | PK，DEFAULT `gen_random_uuid()` | |
| `dm_id` | UUID | NOT NULL，`REFERENCES profiles(id) ON DELETE CASCADE` | 主持 DM |
| `title` | TEXT | NOT NULL | 跑团名 |
| `system` | TEXT | NOT NULL | 游戏系统（D&D 5e 等） |
| `style` | TEXT | NOT NULL | 风格 |
| `time_schedule` | TEXT | NOT NULL | 时间安排（自由文本） |
| `max_players` | INTEGER | NOT NULL，CHECK `2 ≤ x ≤ 10` | 最大人数 |
| `current_players` | INTEGER | DEFAULT `1` | 当前人数（**反范式，未与成员表联动**） |
| `description` | TEXT | NOT NULL | 简介 |
| `tags` | TEXT[] | DEFAULT `'{}'` | 标签数组 |
| `status` | TEXT | DEFAULT `'recruiting'`，CHECK ∈ (`recruiting`,`ongoing`,`completed`,`cancelled`) | 状态 |
| `voice_or_text` | TEXT | DEFAULT `'voice'`，CHECK ∈ (`voice`,`text`,`offline`) | 方式 |
| `beginner_friendly` | BOOLEAN | DEFAULT `false` | 新手友好 |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()`，触发器自动更新 | |

> FK 约束名为 `sessions_dm_id_fkey`（Postgres 自动命名）。API 的 DM 嵌入查询显式依赖此名：`dm:profiles!sessions_dm_id_fkey(...)`。

### 3. session_members — 申请/成员
| 字段 | 类型 | 约束 / 默认 | 说明 |
|---|---|---|---|
| `id` | UUID | PK，DEFAULT `gen_random_uuid()` | |
| `session_id` | UUID | NOT NULL，`REFERENCES sessions(id) ON DELETE CASCADE` | |
| `user_id` | UUID | NOT NULL，`REFERENCES profiles(id) ON DELETE CASCADE` | |
| `role` | TEXT | DEFAULT `'player'`，CHECK ∈ (`dm`,`player`,`ai_npc`) | 团内角色（含 AI NPC） |
| `status` | TEXT | DEFAULT `'pending'`，CHECK ∈ (`pending`,`approved`,`rejected`,`left`) | 申请/成员状态 |
| `joined_at` | TIMESTAMPTZ | DEFAULT `NOW()` | |
| — | — | **UNIQUE(`session_id`,`user_id`)** | 每人每团一条 |

### 4. ai_npcs — AI NPC 设定
| 字段 | 类型 | 约束 / 默认 | 说明 |
|---|---|---|---|
| `id` | UUID | PK，DEFAULT `gen_random_uuid()` | |
| `session_id` | UUID | NOT NULL，`REFERENCES sessions(id) ON DELETE CASCADE` | 所属跑团 |
| `name` | TEXT | NOT NULL | NPC 名 |
| `personality` | TEXT | NOT NULL | 性格 |
| `background` | TEXT | 可空 | 背景 |
| `relationship` | TEXT | DEFAULT `'ally'`，CHECK ∈ (`ally`,`enemy`,`neutral`,`mysterious`) | 与队伍关系 |
| `behavior_boundaries` | TEXT | 可空 | 行为边界（DM 约束） |
| `secrets` | TEXT | 可空 | 秘密（不对玩家公开） |
| `model` | TEXT | DEFAULT `'auto'` | 模型选择 |
| `enabled` | BOOLEAN | DEFAULT `true` | 是否启用 |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | |

### 5. ai_npc_logs — AI NPC 对话记录
| 字段 | 类型 | 约束 / 默认 | 说明 |
|---|---|---|---|
| `id` | UUID | PK，DEFAULT `gen_random_uuid()` | |
| `npc_id` | UUID | NOT NULL，`REFERENCES ai_npcs(id) ON DELETE CASCADE` | |
| `session_id` | UUID | NOT NULL，`REFERENCES sessions(id) ON DELETE CASCADE` | |
| `user_id` | UUID | 可空，`REFERENCES profiles(id) ON DELETE CASCADE` | 对话发起者 |
| `input_text` | TEXT | NOT NULL | 玩家输入 |
| `output_text` | TEXT | NOT NULL | NPC 输出 |
| `context_summary` | TEXT | 可空 | 上下文摘要 |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | |

### 6. reviews — 团内互评
| 字段 | 类型 | 约束 / 默认 | 说明 |
|---|---|---|---|
| `id` | UUID | PK，DEFAULT `gen_random_uuid()` | |
| `session_id` | UUID | NOT NULL，`REFERENCES sessions(id) ON DELETE CASCADE` | |
| `reviewer_id` | UUID | NOT NULL，`REFERENCES profiles(id) ON DELETE CASCADE` | 评价者 |
| `reviewee_id` | UUID | NOT NULL，`REFERENCES profiles(id) ON DELETE CASCADE` | 被评价者 |
| `rating` | INTEGER | NOT NULL，CHECK `1 ≤ x ≤ 5` | 评分 |
| `comment` | TEXT | 可空 | 评语 |
| `attendance` | BOOLEAN | DEFAULT `true` | 是否出勤 |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | |
| — | — | **UNIQUE(`session_id`,`reviewer_id`,`reviewee_id`)** | 同团同一对评价唯一 |

---

## 二、关系图

```
auth.users ──1:1── profiles
                     │
        ┌────────────┼─────────────────────────────┐
        │1:N (dm_id) │1:N (user_id)                 │1:N (reviewer/reviewee)
     sessions ──1:N── session_members            reviews
        │   │            (UNIQUE session+user)      ▲
        │   │1:N                                   │
        │  ai_npcs ──1:N── ai_npc_logs ────────────┘ (session_id)
        │                  (user_id 可空)
        └────────────── reviews.session_id
```

- `profiles` 1:N `sessions`（一个 DM 可主持多个团）
- `sessions` 1:N `session_members`，`profiles` 1:N `session_members`；`(session_id,user_id)` 唯一
- `sessions` 1:N `ai_npcs` 1:N `ai_npc_logs`；`ai_npc_logs` 也直接关联 `sessions` 与 `profiles`
- `sessions` 1:N `reviews`；`reviews` 双向关联 `profiles`（reviewer / reviewee）
- 所有外键 `ON DELETE CASCADE`（删用户/团/ NPC 会级联清理从属记录）

---

## 三、索引与触发器

### 索引
| 索引 | 表(字段) | 用途 |
|---|---|---|
| `idx_sessions_system` | sessions(system) | 按系统筛选 |
| `idx_sessions_style` | sessions(style) | 按风格筛选 |
| `idx_sessions_status` | sessions(status) | 按状态筛选 |
| `idx_session_members_user` | session_members(user_id) | 查"我参与的" |
| `idx_session_members_session` | session_members(session_id) | 查团成员 |
| `idx_ai_npcs_session` | ai_npcs(session_id) | 查团内 NPC |
| `idx_reviews_reviewee` | reviews(reviewee_id) | 算被评者信用 |

### 触发器
- 函数 `update_updated_at_column()`：`BEFORE UPDATE` 时置 `NEW.updated_at = NOW()`。
- 绑定到 `profiles`（`update_profiles_updated_at`）与 `sessions`（`update_sessions_updated_at`）。

---

## 四、RLS 约定

6 张表均 `ENABLE ROW LEVEL SECURITY`。策略定义在 `database/policies.sql`。核心模式：

### 通用约定
- **身份判定**：`auth.uid()` 与所有者列比较（如 `auth.uid() = dm_id` / `= id` / `= reviewer_id`）。
- **成员/DM 判定**：用 `EXISTS (SELECT 1 FROM sessions/session_members WHERE ...)` 子查询。
- **公开读**：`USING (true)` 或限定状态。
- **anon key 全程使用**，RLS 是唯一安全边界；API 写入转发用户 Bearer token，使 `auth.uid()` 生效。

### 各表策略
**profiles**
- SELECT：公开（`true`），用于展示 DM/玩家信息。
- UPDATE / INSERT：仅本人（`auth.uid() = id`）。

**sessions**
- SELECT：公开仅 `status IN ('recruiting','ongoing')`；DM 可另读自己的全部（含 completed/cancelled，`auth.uid() = dm_id`）。
- INSERT：登录用户，`WITH CHECK (auth.uid() = dm_id)`（创建者自动成为 DM）。
- UPDATE / DELETE：仅本人团（`auth.uid() = dm_id`）。

**session_members**
- SELECT：本人是该团成员（`user_id = auth.uid()`）**或**是该团 DM。
- INSERT：`auth.uid() = user_id` 且 **不重复申请**（`NOT EXISTS` 同团同人）。
- UPDATE：DM 可改成员状态（审核通过/拒绝）；**或**本人可改自己状态（离开）。

**ai_npcs**
- SELECT：该团 **approved 成员** 或 DM。
- INSERT / UPDATE / DELETE：仅该团 DM。

**ai_npc_logs**
- SELECT / INSERT：该团 **approved 成员** 或 DM。

**reviews**
- SELECT：公开（`true`），用于展示信用分。
- INSERT：`auth.uid() = reviewer_id`，且 **评价者与被评价者都必须是该团 approved 成员**（双重 `EXISTS`）。
- UPDATE / DELETE：仅本人评价（`auth.uid() = reviewer_id`）。

> 注意：`ai_npcs`/`ai_npc_logs`/`reviews` 的写入门控依赖 `session_members.status = 'approved'`，因此**申请加入与审核流程是这些功能的前置**。

---

## 五、种子数据（`seed.sql`）

- 3 个测试用户（固定 UUID `…0001/0002/0003`）：老李(lao_li, dm)、张DM(zhang_dm, dm)、小王(xiao_wang, both)。
- 6 个跑团：被遗忘的国度、克苏鲁的呼唤、赛博朋克、龙枪编年史、山海奇谭（recruiting）、废土求生（ongoing）。
- `auth.users` / `profiles` 用**固定 UUID + `ON CONFLICT (id) DO NOTHING`**，可重复执行。

### ⚠️ 幂等性 caveat
`sessions` 的 INSERT **未指定 id**（走 `gen_random_uuid()` 默认）且仅 `ON CONFLICT DO NOTHING`。由于每次生成新随机 UUID，冲突永不触发——**重复执行 seed 会重复插入跑团**。如需幂等，应给 sessions 也改用固定 UUID。文件顶部"可重复执行"的注释仅对 users/profiles 成立。

---

## 六、已知差异 / 注意事项

- **状态命名**：DB `sessions.status` 用 `completed`/`cancelled`；前端 `/my-sessions` Mock 用 `ended`（仅演示，不写库）。`lib/types.ts` 的 `SessionStatus` 与 DB 一致。
- **`current_players` 反范式**：当前为种子/手动值，**未**与 `session_members` 中 approved 成员数自动联动。后续实现申请/审核流程时需补同步逻辑（触发器或 API 维护）。
- **信用字段静态**：`profiles.attendance_rate` / `rating` 目前为种子静态值，未从 `reviews` 实时计算。
- **详情页可见性**：`GET /api/sessions/[id]` 用 anon client，受 `sessions_select_public` 限制——`completed`/`cancelled` 的团对匿名请求返回 404（仅 DM 经 auth client 可见，但该 API 未用 auth client）。
- **无 service-role key**：应用不持有绕过 RLS 的密钥；所有访问受策略约束。