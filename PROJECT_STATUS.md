# 项目状态 PROJECT_STATUS

> 骰子局 DiceMeet · 跑团搭子匹配平台 · 2026 Qoder 高校创意力大赛（生活娱乐赛道）
> 本文档记录当前进度、未完成任务与下一步计划。最后更新：2026-11-11。

## 一句话定位

找到合适的 DM 和玩家开局；核心差异化是 **AI 伴随 NPC**——缺人补位、新手引导、单人跑团，让"凑不齐人"不再成为开团阻碍。

## 技术栈快照

- Next.js 14.2.5（App Router）+ React 18.3.1 + TypeScript 5.5.3（strict）
- Tailwind CSS 3.4.6（语义化设计令牌）
- Supabase（PostgreSQL）+ `@supabase/supabase-js` 2.45.0
- 部署目标：Vercel（**尚未部署**）

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 一、已完成的 Batch

### 基础设施（Initial commit）
- 数据类型与 Supabase helper（`lib/types.ts`、`lib/supabase.ts`、`lib/supabase-server.ts`）
- 数据库设计：6 张表 + RLS 策略 + 索引 + 触发器 + 演示种子数据（`database/`）
- 跑团大厅、委托详情、发布页 **接入真实数据库**
- 共享导航/页脚/全局布局

### 设计系统 & UI 组件库
- 设计令牌：配色（象牙白底 / 深林绿 primary / 金色 accent）+ 字体（衬线标题 + 无衬线正文）
- 自建可复用 UI 组件库（`components/ui/`，11 个模块 + barrel 导出）
- 内联 SVG 图标注册表（`components/dashboard/icons.tsx`，22 个图标）
- 仪表盘外壳（Sidebar + Topbar）、路由组 `(dashboard)` 迁移
- 首页重做为"冒险者公会公告板"（服务端组件，直查 Supabase）
- 组件展示页 `/design`
- 跑团大厅打磨：骨架屏、卡片、标签去重、AI NPC 标签可见性、三列断点推迟到 `xl`（缓解 1024px 拥挤）

### Batch 01 — 公共组件补齐（commit `1f0e10d`）
- 补齐 Avatar / Tabs / EmptyState / Skeleton / Modal 等组件并接入 `/design` 目视验收

### 认证 UI 批次（commit `461a75b`）
- 登录页、注册页 **前端模拟交互**（邮箱校验、密码可见性切换、模拟提交反馈）
- 补充 `eye` / `eye-off` 图标；修复密码可见性图标方向
- ⚠️ 明确标注为前端模拟，**未接入真实 Supabase Auth**，不伪造登录成功

### Batch 03A — 冒险者档案 /profile（commit `9bc8c60`）
- 身份卡、游戏偏好、时间安排（**Mock Data**，明确标注）
- 编辑交互：save / cancel、昵称非空校验、简介长度限制（≤200）、标签选/ deselect
- 保存仅更新本地前端状态，明确提示"不会写入数据库"

### Batch 03B — 我的跑团 /my-sessions（commit `c14bc9e`）
- 数据概览 + 全部 / 我参与的 / 我主持的 / 已结束 四分类 Tabs（**Mock Data**）
- 卡片含身份与状态标识、DM Avatar、详情链接
- 待处理事项区分：待审核申请 / 已提交申请 / 跑团通知（静态展示，不写状态）
- 空状态用 EmptyState；响应式无横向溢出

### 侧边栏接线（本地已完成，**尚未提交**）
- `components/dashboard/Sidebar.tsx` 的「我的跑团」从 `soon: true` 改为 `href: "/my-sessions"`，active 高亮正常

---

## 二、页面 / 路由清单与数据接入状态

| 路由 | 文件 | 渲染方式 | 数据来源 |
|---|---|---|---|
| `/` | `app/(dashboard)/page.tsx` | 服务端（`force-dynamic`） | **真实 DB**（直查 Supabase） |
| `/sessions` | `app/(dashboard)/sessions/page.tsx` | 客户端 | **真实 DB**（`GET /api/sessions`） |
| `/sessions/[id]` | `app/(dashboard)/sessions/[id]/page.tsx` | 客户端 | **真实 DB**（`GET /api/sessions/[id]`） |
| `/create` | `app/(dashboard)/create/page.tsx` | 客户端 | API 就绪（`POST /api/sessions`），**受真实登录门控** |
| `/profile` | `app/(dashboard)/profile/page.tsx` | 客户端 | **前端 Mock** |
| `/my-sessions` | `app/(dashboard)/my-sessions/page.tsx` | 客户端 | **前端 Mock** |
| `/login` | `app/login/page.tsx` | 客户端 | **前端 Mock**（无真实认证） |
| `/register` | `app/register/page.tsx` | 客户端 | **前端 Mock** |
| `/design` | `app/design/page.tsx` | 客户端 | 组件展示 |
| `/test-db` | `app/test-db/page.tsx` | 客户端 | 真实 DB 连接测试 |

> `(dashboard)` 路由组包裹 DashboardShell（侧边栏 + 工具栏），不增加 URL 段；认证页 `/login` `/register` 在组外，无侧边栏。

---

## 三、未完成任务

### 认证 & 数据绑定（最高优先）
- [ ] **真实 Supabase Auth**：登录/注册目前为前端模拟，未产生真实 session token
- [ ] 因无真实 token，`POST /api/sessions` 虽已实现，但当前 UI 流程无法真正走通（`create` 页 `getSession()` 拿不到 session）
- [ ] `/profile`、`/my-sessions` 从 Mock 绑定到真实数据

### 跑团参与流程
- [ ] **申请加入**：详情页按钮目前仅 `alert("申请加入功能将在用户系统上线后开放")`，无 API
- [ ] `session_members` 申请 / DM 审核 / 离开 的 API 与 UI
- [ ] `/my-sessions` 待处理事项从静态 Mock 改为真实审批/通知/状态写入
- [ ] `current_players` 与 approved 成员数的自动同步（当前为种子/手动值，未联动）

### 核心亮点：AI 伴随 NPC（尚未动工）
- [ ] `ai_npcs` 配置 UI（性格、背景、关系、行为边界、秘密）
- [ ] AI NPC 对话 API + `ai_npc_logs` 记录
- [ ] 侧边栏「AI NPC 工作台」「DM 工作台」目前为"待开放"

### 信用 / 评价系统
- [ ] `reviews` 表已建，无 UI / API；出勤率、评分目前为种子静态值

### 其余"待开放"入口
- [ ] 智能推荐、我的收藏、我的申请、消息中心、偏好设置（侧边栏 `soon: true`）

### 工程 / 部署
- [ ] **部署到 Vercel**（尚未部署）
- [ ] README 更新（现有 README 结构章节过时，提到的 `public/` 目录实际不存在）
- [ ] 提交侧边栏接线改动

---

## 四、下一步计划（建议顺序）

1. **接入真实 Supabase Auth**：登录/注册产生真实 session；打通 `create` 发布门控。这是后续一切写入功能的前置。
2. **跑团参与闭环**：申请加入 → `session_members` API → DM 审核 → `current_players` 联动；`/my-sessions` 待处理事项接真实数据。
3. **AI NPC MVP（核心差异化）**：NPC 配置 UI + 对话 API + 日志记录，优先做出可演示的最小闭环。
4. **评价 / 信用系统**：团内互评 API + UI，出勤/评分从真实数据计算。
5. **数据绑定收尾**：`/profile` 接真实档案；补齐其余"待开放"入口。
6. **部署上线**：Vercel 部署 + 环境变量配置 + README 刷新。

> 范围约定：分阶段显式推进；只读检查仅报告不改动；修改前先确认。数据库/RLS 变更需单独确认，不擅自迁移。

---

## 五、已知差异 / 注意事项

- **Mock 与 DB 状态命名不一致**：`/my-sessions` Mock 用 `ended`，而 DB `sessions.status` 用 `completed` / `cancelled`。Mock 数据已明确标注，不代表真实统计。
- **Mock DM 归属差异**：`/my-sessions` "我主持的"卡片 DM 标为本人（艾琳·夜风），但详情链接指向的真实 DB 跑团 DM 是种子数据中的小王/老李。属演示数据与真实数据的固有差异。
- **种子数据幂等性**：`auth.users` / `profiles` 用固定 UUID + `ON CONFLICT DO NOTHING`，可重复执行；但 `sessions` 用随机 UUID（`gen_random_uuid()`），重复执行 seed 会**重复插入跑团**。详见 [DATABASE.md](./DATABASE.md)。
- **截图取证限制**：in-app Browser 面板隐藏时截图工具不可用，响应式验证改用同源 iframe 实测 `scrollWidth`。