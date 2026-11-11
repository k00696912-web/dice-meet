# 接口契约 API_CONTRACTS

> 骰子局 DiceMeet 前后端接口。来源：`app/api/sessions/route.ts`、`app/api/sessions/[id]/route.ts`、`lib/types.ts`、`lib/supabase-server.ts`。最后更新：2026-11-11。

## 概览

当前**仅实现 sessions 相关 3 个端点**。其余表（profiles / session_members / ai_npcs / reviews）尚无 API。

| 方法 | 路径 | 认证 | 用途 | 消费方 |
|---|---|---|---|---|
| GET | `/api/sessions` | 无（anon） | 跑团列表 + 筛选 | 跑团大厅页 |
| POST | `/api/sessions` | **Bearer token** | 创建跑团 | 发布招募页 |
| GET | `/api/sessions/[id]` | 无（anon） | 跑团详情 | 委托详情页 |

> 首页 `/` 是服务端组件，**直接查 Supabase**（`getPublicClient`），不走 API。`/test-db` 也直查。

### 通用约定
- 响应均为 JSON（`Response.json`）。
- 错误统一结构：`{ "error": string }`。
- 认证：`POST` 从 `Authorization: Bearer <token>` 提取（`extractToken`），用 `getAuthClient(token)` 以用户身份写入，RLS 按 `auth.uid()` 评估。
- DM 嵌入通过显式外键名 `profiles!sessions_dm_id_fkey` 关联，返回字段子集（见下）。

---

## 1. GET /api/sessions — 跑团列表

**认证**：无（`getPublicClient`，anon）。
**固定行为**：仅返回 `status IN ('recruiting','ongoing')`，按 `created_at` 降序。

### 查询参数（均可选）
| 参数 | 类型 | 行为 |
|---|---|---|
| `system` | string | 存在则 `.eq("system", value)` |
| `style` | string | 存在则 `.eq("style", value)` |
| `voice_or_text` | string | 存在则 `.eq("voice_or_text", value)`（voice/text/offline） |
| `beginner_friendly` | `"true"` | 仅当值严格等于 `"true"` 时 `.eq("beginner_friendly", true)` |

> 前端大厅页：`system`/`style` 为"全部"时不传；`voice_or_text` 为空时不传；勾选新手友好才传 `beginner_friendly=true`。

### 响应
- **200**：`{ "sessions": Session[] }`（无数据时为 `[]`）。
- **500**：`{ "error": string }`（Supabase 查询出错）。

`Session` 含全部 sessions 列 + 嵌入 `dm`（**不含 bio**）：
```jsonc
{
  "sessions": [
    {
      "id": "d0debbc5-5b4e-4b6f-aa28-e8835bfb21c6",
      "dm_id": "00000000-0000-0000-0000-000000000001",
      "title": "被遗忘的国度：初探",
      "system": "D&D 5e",
      "style": "严肃剧情",
      "time_schedule": "每周六 20:00",
      "max_players": 5,
      "current_players": 3,
      "description": "剑湾北境的一座小镇接连发生失踪案……",
      "tags": ["新手友好", "语音", "长期团"],
      "status": "recruiting",
      "voice_or_text": "voice",
      "beginner_friendly": true,
      "created_at": "2026-11-08T12:00:00Z",
      "updated_at": "2026-11-08T12:00:00Z",
      "dm": {
        "id": "00000000-0000-0000-0000-000000000001",
        "username": "lao_li",
        "display_name": "老李",
        "avatar_url": null,
        "role": "dm",
        "rating": 4.9,
        "attendance_rate": 98.5
      }
    }
  ]
}
```

---

## 2. POST /api/sessions — 创建跑团

**认证**：必需。请求头 `Authorization: Bearer <access_token>`。

### 请求体（`CreateSessionInput`）
| 字段 | 类型 | 必填 | 默认 / 说明 |
|---|---|---|---|
| `title` | string | ✅ | 缺失 → 400 |
| `system` | string | ✅ | 缺失 → 400 |
| `style` | string | ✅ | 缺失 → 400 |
| `time_schedule` | string | ✅ | 缺失 → 400 |
| `description` | string | ✅ | 缺失 → 400 |
| `max_players` | number | 见注 | 直接透传；DB CHECK `2~10` 且 NOT NULL |
| `tags` | string[] | ❌ | 默认 `[]` |
| `voice_or_text` | `"voice"\|"text"\|"offline"` | ❌ | 默认 `"voice"` |
| `beginner_friendly` | boolean | ❌ | 默认 `false` |

> `dm_id` **不由客户端提供**，服务端用 `user.id`（当前登录用户）注入。
> ⚠️ `max_players` 在 API 层**未做存在性/范围校验**，仅靠 DB 约束兜底；缺失或越界会触发 DB 错误 → 500。前端发布页用 `min=2 max=10` 的 number 输入约束。

### 响应
| 状态码 |  body | 触发条件 |
|---|---|---|
| **201** | `{ "session": Session }` | 创建成功（含 dm 嵌入，不含 bio） |
| **400** | `{ "error": "缺少必填字段" }` | title/system/style/time_schedule/description 任一缺失 |
| **401** | `{ "error": "请先登录" }` | 无 Bearer token |
| **401** | `{ "error": "登录已失效，请重新登录" }` | `auth.getUser()` 失败或无 user |
| **500** | `{ "error": string }` | DB 插入出错（含 max_players 违反约束、RLS 拒绝等） |

### 请求示例
```http
POST /api/sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "被遗忘的国度：初探",
  "system": "D&D 5e",
  "style": "严肃剧情",
  "time_schedule": "每周六 20:00",
  "max_players": 5,
  "description": "剑湾北境失踪案……",
  "tags": ["新手友好", "长期团"],
  "voice_or_text": "voice",
  "beginner_friendly": true
}
```

> **当前可达性**：发布页先 `supabase.auth.getSession()`，无 session 则提示"发布跑团需要先登录（用户系统将于下一阶段上线）"。由于真实 Auth 尚未接入，UI 流程目前拿不到有效 token，此端点虽实现但**暂无法经前端真正走通**。

---

## 3. GET /api/sessions/[id] — 跑团详情

**认证**：无（`getPublicClient`，anon）。
**路径参数**：`id`（UUID 字符串）。

### 响应
- **200**：`{ "session": Session }`。
- **404**：`{ "error": string }`（Supabase 错误码 `PGRST116`，即无匹配行）。
- **500**：`{ "error": string }`（其他错误）。

与列表的区别：详情 DM 嵌入**包含 `bio`**：
```
dm:profiles!sessions_dm_id_fkey(id, username, display_name, avatar_url, bio, role, rating, attendance_rate)
```
```jsonc
{
  "session": {
    "id": "d0debbc5-…",
    "title": "被遗忘的国度：初探",
    /* …其余 sessions 列… */
    "dm": {
      "id": "00000000-…0001",
      "username": "lao_li",
      "display_name": "老李",
      "avatar_url": null,
      "bio": "五年带团经验，擅长剧情向长篇战役，新手友好。",
      "role": "dm",
      "rating": 4.9,
      "attendance_rate": 98.5
    }
  }
}
```

> ⚠️ **可见性限制**：anon 受 RLS `sessions_select_public` 约束，仅 `recruiting`/`ongoing` 可读。`completed`/`cancelled` 的团对匿名请求返回 **404**（DM 本人需经 auth client 才可见，但此端点未用 auth client）。

---

## 四、响应类型契约（`lib/types.ts`）

```ts
type UserRole = "player" | "dm" | "both";
type SessionStatus = "recruiting" | "ongoing" | "completed" | "cancelled";
type VoiceOrText = "voice" | "text" | "offline";

interface Profile {
  id: string; username: string; display_name: string;
  avatar_url: string | null; bio: string | null; role: UserRole;
  attendance_rate: number; rating: number; created_at?: string;
}
interface Session {
  id: string; dm_id: string; title: string; system: string; style: string;
  time_schedule: string; max_players: number; current_players: number;
  description: string; tags: string[]; status: SessionStatus;
  voice_or_text: VoiceOrText; beginner_friendly: boolean;
  created_at: string; updated_at?: string; dm?: Profile;
}
interface CreateSessionInput {
  title: string; system: string; style: string; time_schedule: string;
  max_players: number; description: string; tags: string[];
  voice_or_text: VoiceOrText; beginner_friendly: boolean;
}
```

> 嵌入的 `dm` 是 `Profile` 的**字段子集**（列表无 bio，详情有 bio），前端类型用可选 `dm?: Profile` 宽松匹配。

---

## 五、前端消费方一览

| 文件 | 调用 | 说明 |
|---|---|---|
| `app/(dashboard)/sessions/page.tsx` | `GET /api/sessions?{filters}` | 客户端 fetch，loading/error/骨架屏；筛选变化重新请求 |
| `app/(dashboard)/sessions/[id]/page.tsx` | `GET /api/sessions/{id}` | `useParams` 取 id；错误显示 Alert + 返回链接 |
| `app/(dashboard)/create/page.tsx` | `POST /api/sessions` | 先 `auth.getSession()` 门控，带 Bearer token；成功 `router.push(/sessions/{id})` |
| `app/(dashboard)/page.tsx`（首页） | **直查 Supabase**（非 API） | 服务端 `getPublicClient`，取最新 6 条 |
| `app/test-db/page.tsx` | **直查 Supabase** | `from("sessions").select("id").limit(1)` 连接自检 |
| login / register / profile / my-sessions | **无网络请求** | 纯前端 Mock |

---

## 六、尚未实现的接口（规划）

以下表已建但无端点，属后续批次（详见 [PROJECT_STATUS.md](./PROJECT_STATUS.md)）：
- **认证**：真实 Supabase Auth 登录/注册（当前前端模拟）。
- **session_members**：申请加入、DM 审核（approve/reject）、离开。
- **profiles**：读取/更新本人档案（`/profile` 接真实数据）。
- **ai_npcs / ai_npc_logs**：NPC 配置 CRUD、对话生成与日志（核心亮点）。
- **reviews**：团内互评提交、信用分聚合。

> 详情页"申请加入"按钮目前仅 `alert("申请加入功能将在用户系统上线后开放")`，无对应 API。