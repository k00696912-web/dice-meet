# 技术架构 ARCHITECTURE

> 骰子局 DiceMeet 的目录结构、组件关系与技术架构。最后更新：2026-11-11。

## 一、技术栈

| 层 | 选型 | 版本 | 说明 |
|---|---|---|---|
| 框架 | Next.js（App Router） | 14.2.5 | 服务端组件 + 客户端组件混合；API Routes 作后端 |
| UI 运行时 | React / React DOM | 18.3.1 | 函数组件 + Hooks |
| 语言 | TypeScript | 5.5.3 | `strict: true`，路径别名 `@/* → ./*` |
| 样式 | Tailwind CSS | 3.4.6 | 语义化设计令牌；`line-clamp` 内置 |
| 后端/DB | Supabase（PostgreSQL） | `@supabase/supabase-js` 2.45.0 | 仅用 anon key，RLS 为安全边界 |
| 代码规范 | ESLint + eslint-config-next | 8.57 / 14.2.5 | 无独立 `.eslintrc`，用 next 预设 |
| 部署目标 | Vercel | — | 尚未部署 |

配置要点：
- `next.config.js`：`reactStrictMode: true`
- `tsconfig.json`：`strict`、`moduleResolution: "bundler"`、`incremental`、`noEmit`、`isolatedModules`
- 环境变量（`.env.local`）：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（均为公开 anon 值，**无 service-role key**）

---

## 二、目录结构（实际）

```
dice-meet/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 根布局：<html lang="zh-CN"> <body font-sans>，引入 globals.css
│   ├── globals.css                   # 全局样式
│   ├── (dashboard)/                  # 路由组：包裹 DashboardShell，不增加 URL 段
│   │   ├── layout.tsx                # → <DashboardShell>{children}</DashboardShell>
│   │   ├── page.tsx                  # 首页 /（服务端组件，force-dynamic，直查 Supabase）
│   │   ├── sessions/
│   │   │   ├── page.tsx              # 跑团大厅（客户端，fetch GET /api/sessions）
│   │   │   └── [id]/page.tsx         # 委托详情（客户端，fetch GET /api/sessions/[id]）
│   │   ├── create/page.tsx           # 发布招募（客户端，POST /api/sessions，受登录门控）
│   │   ├── profile/page.tsx          # 冒险者档案（客户端，纯前端 Mock）
│   │   └── my-sessions/page.tsx      # 我的跑团（客户端，纯前端 Mock）
│   ├── api/
│   │   ├── sessions/route.ts         # GET 列表+筛选 / POST 创建（需 Bearer token）
│   │   └── sessions/[id]/route.ts    # GET 详情
│   ├── login/page.tsx                # 登录（组外，前端模拟，无侧边栏）
│   ├── register/page.tsx             # 注册（组外，前端模拟）
│   ├── design/page.tsx               # 组件展示页
│   └── test-db/page.tsx              # 数据库连接测试
├── components/
│   ├── ui/                           # 自建通用 UI 库
│   │   ├── index.ts                  # barrel 导出
│   │   ├── Button.tsx                # Button + buttonClasses
│   │   ├── Card.tsx                  # Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter
│   │   ├── Badge.tsx
│   │   ├── Input.tsx                 # Input / Textarea / Select / FormField
│   │   ├── Modal.tsx
│   │   ├── Alert.tsx
│   │   ├── Typography.tsx            # H1 / H2 / H3 / H4 / Lead / P / Muted
│   │   ├── Avatar.tsx
│   │   ├── Tabs.tsx                  # Tabs + TabItem 类型
│   │   ├── EmptyState.tsx
│   │   └── Skeleton.tsx              # Skeleton / SkeletonText / SkeletonCircle / SkeletonCard
│   └── dashboard/                    # 仪表盘专用组件
│       ├── DashboardShell.tsx        # 外壳：Sidebar + Topbar + main，管理移动端抽屉状态
│       ├── Sidebar.tsx               # 侧边导航（NAV_GROUPS，active 高亮，待开放项）
│       ├── Topbar.tsx                # 顶栏（按路由匹配标题，搜索入口，登录入口）
│       ├── icons.tsx                 # IconName 联合类型（22 图标）+ Icon 组件（内联 SVG）
│       └── CommissionCard.tsx        # 首页公告板的跑团委托卡片
├── lib/
│   ├── types.ts                      # Profile / Session / CreateSessionInput + 联合类型
│   ├── supabase.ts                   # 浏览器端 anon client（单例导出 supabase）
│   └── supabase-server.ts          # getPublicClient / getAuthClient / extractToken
├── database/
│   ├── schema.sql                    # 6 表 + 启用 RLS + 索引 + updated_at 触发器
│   ├── policies.sql                  # RLS 策略
│   └── seed.sql                      # 演示数据（3 用户 + 6 跑团）
├── .env.local / .env.local.example
├── tailwind.config.ts / tsconfig.json / next.config.js / postcss.config.js
├── package.json / run.sh / run.bat
├── README.md
└── PROJECT_STATUS.md / ARCHITECTURE.md / DATABASE.md / API_CONTRACTS.md / DECISIONS.md
```

> 注：README 旧结构章节提到的 `public/` 目录当前**实际不存在**；静态资源以后如需再建。

---

## 三、渲染与布局架构

### 布局层级
```
RootLayout (app/layout.tsx)
└── <body class="font-sans">
    ├── (dashboard)/layout → DashboardShell
    │   ├── Sidebar（lg+ 固定 w-60；移动端抽屉，由 DashboardShell 的 sidebarOpen 控制）
    │   ├── div.lg:pl-60
    │   │   ├── Topbar（sticky top-0，h-68px，按 pathname 匹配标题）
    │   │   └── main → div.max-w-[1440px] mx-auto px-5 lg:px-8 py-8 → {children}
    │   └── （各 dashboard 页面）
    └── 组外页面：/login /register /design /test-db（无侧边栏/顶栏）
```

- **路由组 `(dashboard)`**：共享外壳但不产生 URL 段。认证页刻意放在组外，避免登录/注册出现侧边栏。
- **DashboardShell**（`"use client"`）：用 `useState` 管理 `sidebarOpen`，移动端点击 Topbar 菜单按钮打开抽屉，点击遮罩/链接关闭。
- **Sidebar**：`NAV_GROUPS` 三组（探索 / 我的冒险 / 创作者）+ 设置。有 `href` 的项渲染 `<Link>` 并按 `isActive(pathname, href)`（`pathname.startsWith(href)`）高亮；`soon: true` 的项渲染禁用 `<span>` + "待开放"徽标。「我的跑团」已接线 `/my-sessions`。
- **Topbar**：`TITLES` 按 pathname 前缀匹配标题/副标题；搜索框链接到 `/sessions`；消息铃铛禁用；头像区链接 `/login`。

### 服务端 vs 客户端组件
| 页面 | 类型 | 数据获取 |
|---|---|---|
| 首页 `/` | **服务端**（`async`，`export const dynamic = "force-dynamic"`） | 直接 `getPublicClient()` 查 Supabase，取最新 6 条 |
| 跑团大厅 / 详情 / 发布 | **客户端**（`"use client"`） | `fetch` 调用 API Routes |
| profile / my-sessions / login / register | **客户端** | 前端 Mock，无网络请求 |
| API Routes | 服务端（`app/api/**/route.ts`） | `getPublicClient` / `getAuthClient` |

> 设计取舍：首页服务端渲染利于首屏与 SEO；交互页用客户端 fetch + API，便于筛选/加载态。详见 [DECISIONS.md](./DECISIONS.md)。

---

## 四、组件关系

### UI 库（`components/ui/`）
- 通过 `index.ts` barrel 统一导出，页面以 `import { Button, Card, ... } from "@/components/ui"` 引入。
- 无外部组件依赖（不用 MUI/Chakra 等），全部自建，控制 bundle 与视觉一致性。
- 关键组件契约：
  - `Tabs`：`items: TabItem[]`（`key/label/content/disabled`），`defaultKey`（非受控）或 `activeKey`+`onChange`（受控）；roving tabindex + 方向键导航；仅当 `activeItem.content != null` 渲染 `role="tabpanel"`。
  - `EmptyState`：`title/description/icon/action`，居中布局，用于列表空态。
  - `Avatar`：`src?/name/size(sm|md|lg|xl)/online?`；无 src 时取昵称首字。
  - `Button`：支持 `href`（渲染 Link）或 `onClick`；`variant`（primary/outline/ghost/accent）、`size`。

### 仪表盘组件（`components/dashboard/`）
- `DashboardShell` 组合 `Sidebar` + `Topbar`，是 `(dashboard)` 组的唯一布局入口。
- `icons.tsx`：`IconName` 联合类型集中管理 22 个图标名，`Icon` 组件按名渲染内联 SVG path（无图标包依赖）。图标名：compass / sparkles / bookmark / swords / inbox / bell / megaphone / dice / bot / settings / search / plus / menu / close / chevron-down / scroll / users / shield / arrow-right / clock / eye / eye-off。
- `CommissionCard`：首页公告板专用，接收 `Session` 渲染委托卡片（与跑团大厅页内的 `SessionCard` 是不同组件，分别服务首页与大厅）。

### 依赖方向
```
页面 (app/) ──→ components/ui + components/dashboard ──→ icons
   │                                                     
   ├──→ lib/types（类型）
   └──→ lib/supabase（浏览器 client） 或 fetch ──→ app/api ──→ lib/supabase-server ──→ Supabase
首页(服务端) ─────────────────────────────────────────────→ lib/supabase-server ──→ Supabase
```

---

## 五、数据访问架构

### 三个 Supabase 入口（`lib/`）
1. `lib/supabase.ts`：浏览器端单例 `supabase = createClient(url, anonKey)`。用于客户端组件（如 `create` 页 `auth.getSession()`、`test-db` 直查）。
2. `lib/supabase-server.ts`：
   - `getPublicClient()`：anon client，用于公开读（API GET、首页服务端查询）。
   - `getAuthClient(accessToken)`：带 `Authorization: Bearer <token>` 头的 client，用于以用户身份写入（API POST），RLS 按该用户评估。
   - `extractToken(request)`：从 `Authorization: Bearer ` 头解析 token。

### 安全边界
- 全程仅用 **anon key**，无 service-role key。**RLS 是唯一安全边界**（见 [DATABASE.md](./DATABASE.md)）。
- 公开读：profiles、reviews 全公开；sessions 仅 `recruiting`/`ongoing` 公开。
- 写入：API POST 转发用户 Bearer token，`getAuthClient` 使 RLS 以真实用户身份校验 `auth.uid() = dm_id`。

### 类型契约（`lib/types.ts`）
- `UserRole = "player" | "dm" | "both"`
- `SessionStatus = "recruiting" | "ongoing" | "completed" | "cancelled"`
- `VoiceOrText = "voice" | "text" | "offline"`
- `Profile` / `Session`（含可选 `dm?: Profile` 嵌入）/ `CreateSessionInput`
- 与 DB schema 对应，详见 [DATABASE.md](./DATABASE.md) 与 [API_CONTRACTS.md](./API_CONTRACTS.md)。

---

## 六、设计系统（`tailwind.config.ts`）

### 语义化颜色令牌
| 令牌 | 值 | 用途 |
|---|---|---|
| `background` | `#F3F0E8` | 象牙白页面底 |
| `card` | `#FFFFFF` | 卡片 |
| `foreground` | `#292D2A` | 正文 |
| `muted` | `#6B716C` | 次要文字 |
| `border` | `#E2DDD0` | 边框 |
| `primary` | `#243B32`（+50~900 梯度） | 深林绿，主色 |
| `accent` | `#B58B4C`（+50~900 梯度） | 金色，强调 |

### 字体
- `font-serif`：ui-serif / Georgia / Noto Serif SC / Songti SC / SimSun —— 标题（公会/奇幻气质）
- `font-sans`：ui-sans-serif / system-ui / PingFang SC / Microsoft YaHei —— 正文

### 阴影
- `shadow-card` / `shadow-card-hover`：卡片静态/悬浮阴影

### 视觉叙事
"冒险者公会公告板"——现代 + 奇幻，避免过度复古、避免传统 RPG 角色卡式菜单。响应式桌面优先，三列网格推迟到 `xl`(1280) 断点以缓解 1024px 拥挤；移动端侧边栏转抽屉。

---

## 七、本地开发

```bash
npm install
# 复制 .env.local.example 为 .env.local，填入 Supabase URL / Anon Key
# 在 Supabase SQL Editor 依次执行 database/schema.sql → policies.sql → seed.sql
npm run dev      # http://localhost:3000
```

- 类型检查：`tsc --noEmit`
- Lint：`next lint`（或 `eslint --config node_modules/eslint-config-next/core-web-vitals.js`）
- 仓库提供 `run.sh` / `run.bat` 启动脚本。
- 数据库连接自检：访问 `/test-db`。