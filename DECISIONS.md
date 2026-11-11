# 设计决定 DECISIONS

> 骰子局 DiceMeet 的重要设计决定及其原因（ADR 风格）。最后更新：2026-11-11。
> 每条含：**决定** / **原因** / **影响·权衡**。状态标注：✅ 已实施 · 🚧 部分/待补 · 📋 规划。

---

## A. 产品与视觉

### D1. 核心差异化押注 AI 伴随 NPC ✅（定位）/ 📋（功能）
- **决定**：把"AI 主控的伴随 NPC"作为区别于普通跑团匹配平台的核心亮点——缺人补位、新手引导、单人跑团。
- **原因**：跑团最大痛点是"凑不齐人/缺 DM"；AI NPC 让开团不再等待，是有叙事张力的差异化点，契合大赛创意力主题。
- **影响**：DB 预留 `ai_npcs` / `ai_npc_logs` 表与 `session_members.role='ai_npc'`；首页设核心亮点区块。功能本身尚未开发，是下一步重点。用户偏好"AI 伴随角色/增强功能"而非简单聊天。

### D2. 视觉叙事："冒险者公会公告板" ✅
- **决定**：全站采用"冒险者公会"隐喻——跑团=委托、大厅=公告板、个人=冒险者档案；现代 + 奇幻，**避免过度复古**、避免传统 RPG 角色卡式菜单。
- **原因**：给匹配平台以沉浸叙事，又不牺牲现代可用性；过度复古会显得陈旧、影响交互效率。
- **影响**：文案统一（委托/公会/冒险者）；首页重做为公告板；卡片/徽标语言一致。

### D3. 语义化设计令牌 + 衬线标题 ✅
- **决定**：Tailwind 语义令牌——底 `#F3F0E8`(象牙白)、卡片白、primary `#243B32`(深林绿)、accent `#B58B4C`(金)、正文 `#292D2A`；标题用 `font-serif`，正文 `font-sans`。
- **原因**：深林绿+金营造公会质感，象牙白底降低视觉疲劳；衬线标题强化奇幻叙事，无衬线正文保证可读。语义令牌便于全站一致与主题调整。
- **影响**：所有页面/组件复用令牌，不写死色值；primary/accent 各带 50~900 梯度。

---

## B. 架构与渲染

### D4. 自建 UI 库 + 内联 SVG 图标，零外部组件依赖 ✅
- **决定**：`components/ui/` 自建 Button/Card/Badge/Input/Modal/Alert/Typography/Avatar/Tabs/EmptyState/Skeleton；图标用 `icons.tsx` 内联 SVG（22 个，`IconName` 联合类型）。
- **原因**：控制 bundle 体积、保证公会视觉语言一致、避免重型依赖与样式冲突；大赛项目需快速可控迭代。
- **影响**：barrel `index.ts` 统一导出；新增图标需扩 `IconName` 与 path 表。无 MUI/Chakra/icon 包。

### D5. 路由组 `(dashboard)` 共享外壳，认证页置组外 ✅
- **决定**：用 App Router 路由组 `(dashboard)` 包裹 DashboardShell（Sidebar+Topbar），不增加 URL 段；`/login` `/register` 放组外。
- **原因**：仪表盘页面共享导航而不污染 URL；登录/注册不应出现侧边栏（沉浸/聚焦）。
- **影响**：`(dashboard)/layout.tsx` 仅渲染 Shell；组外页面自带简布局。

### D6. 混合渲染：首页服务端直查，交互页客户端走 API ✅
- **决定**：首页 `/` 为服务端组件（`force-dynamic`，直接 `getPublicClient` 查最新 6 条）；大厅/详情/发布为客户端组件，`fetch` 调 API Routes。
- **原因**：首页服务端渲染利于首屏速度与 SEO；交互页需要筛选/加载态/客户端导航，客户端 fetch + API 更合适。
- **影响**：存在两条数据访问路径（首页直查 vs API）。两者 DM 嵌入字段需保持一致（首页/列表无 bio，详情有 bio）。

### D7. 仅 anon key，RLS 为唯一安全边界；写入转发用户 token ✅
- **决定**：应用只持有 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，**不用 service-role key**。公开读用 `getPublicClient`；`POST` 用 `extractToken` + `getAuthClient(token)` 以用户身份写入。
- **原因**：避免在应用侧持有绕过 RLS 的高权限密钥；让数据库策略统一承担授权，减少服务端鉴权漏洞面。
- **影响**：所有访问受 RLS 约束；`auth.uid()` 在转发 token 后生效。公开读仅见 recruiting/ongoing 团（详情端点亦然）。

### D8. DM 嵌入显式指定外键名 ✅
- **决定**：关联查询用 `dm:profiles!sessions_dm_id_fkey(...)` 显式 FK 名。
- **原因**：sessions→profiles 可能存在多条 FK 路径风险，显式命名消除 PostgREST 歧义，保证嵌入稳定。
- **影响**：依赖约束名 `sessions_dm_id_fkey`；若改 FK 需同步改 API/首页查询字符串。

---

## C. 认证与分阶段策略

### D9. 认证 UI 先行，前端模拟，不伪造真实状态 ✅
- **决定**：登录/注册先做前端模拟交互（邮箱校验、密码可见性、模拟提交反馈），**暂不接入 Supabase Auth**；成功提示明确标注"前端模拟…未连接真实认证服务"。
- **原因**：先打通 UI 与视觉验收，降低批次耦合；明确不伪造登录成功/认证状态，避免误导。用户显式要求"使用前端模拟交互即可"。
- **影响**：`lib/supabase.ts` client 已就位；`create` 页 `getSession()` 门控，但因无真实 token，`POST /api/sessions` 暂无法经 UI 走通。真实 Auth 是后续写入功能的前置。

### D10. profile / my-sessions 用明确标注的 Mock Data ✅
- **决定**：两页用前端 Mock，所有统计/列表**明确标注"演示数据/Mock Data，不代表真实数据库统计"**；编辑只更新本地状态，提示"不会写入数据库"。
- **原因**：在认证/数据绑定就绪前先完成页面结构与交互验收；诚实标注避免把模拟当真实。用户显式约束。
- **影响**：`/my-sessions` 待处理事项仅静态展示，不实现审批/通知/状态写入；后续需接真实数据。

### D11. Mock 详情链接复用真实 session UUID ✅
- **决定**：`/my-sessions` Mock 卡片的"查看详情"指向真实 DB 中存在的 session UUID（从 API 取得）。
- **原因**：保证演示时详情链接可达（200），不出现死链。
- **影响**：固有差异——"我主持的"Mock 卡片 DM 标为本人，但真实详情页 DM 是种子数据中的小王/老李。已在文档注明属演示差异。

### D12. 分阶段显式范围，检查只读、修改前确认 ✅（流程）
- **决定**：按 Batch 显式推进；只读审计仅报告不改动；修改前先确认；不擅自重构现有架构、优先复用组件；DB/RLS 变更单独确认。
- **原因**：控制改动 blast radius，保护用户在建工作；用户为 Git/终端新手，偏好 agent 直接执行 + 简短解释。
- **影响**：每批最小改动 + 编译/浏览器验证 + 报告；提交/推送仅在用户明确要求时执行。

---

## D. 数据库

### D13. current_players 反范式，暂不与成员表联动 🚧
- **决定**：`sessions.current_players` 为独立整数（默认 1，种子给显式值），暂不由 `session_members` approved 数自动计算。
- **原因**：申请/审核流程尚未实现，先以反范式字段支撑列表/详情展示，降低初期复杂度。
- **影响**：后续实现成员流程时**必须补同步逻辑**（触发器或 API 维护），否则人数会失真。已记入 PROJECT_STATUS 未完成项。

### D14. 种子幂等：users/profiles 固定 UUID，sessions 例外 🚧
- **决定**：`auth.users`/`profiles` 用固定 UUID + `ON CONFLICT DO NOTHING` 保证可重复执行；`sessions` 走 `gen_random_uuid()`。
- **原因**：用户/资料需稳定 id 供关联与演示；跑团初期用随机 id 简化。
- **影响**：⚠️ 重复执行 seed 会**重复插入跑团**（随机 UUID 永不冲突）。如需完全幂等，应给 sessions 也改固定 UUID。已在 DATABASE.md 注明。

### D15. 信用字段先静态，后从 reviews 聚合 📋
- **决定**：`profiles.attendance_rate`/`rating` 先用种子静态值；`reviews` 表已建但无聚合逻辑。
- **原因**：评价系统未开发，先展示信用概念。
- **影响**：后续需从 `reviews` 实时计算出勤/评分（可用视图或触发器）。

### D16. 状态命名：DB 用 completed/cancelled，Mock 用 ended ✅（注意差异）
- **决定**：DB `sessions.status` ∈ recruiting/ongoing/completed/cancelled；前端 `/my-sessions` Mock 用 `ended` 表示已结束。
- **原因**：Mock 面向展示语义（"已结束"），DB 保留更细的完成/取消区分。
- **影响**：接真实数据时需把 completed/cancelled 映射到前端"已结束"。`lib/types.ts` 与 DB 一致。

---

## E. 前端工程约定

### D17. React 18 一律用函数式 setState ✅
- **决定**：同一批更新中统一用 `setX(prev => ...)` 函数式形式，避免与非函数式 `setX({...state})` 混用。
- **原因**：profile 编辑曾出现 stale-closure bug——非函数式更新用旧闭包覆盖了同批的函数式 toggle，导致部分字段丢失。函数式更新 robust。
- **影响**：所有多字段表单/toggle 用函数式更新；离散点击虽不易触发，但统一约定防患。

### D18. 密码可见性图标用"状态约定" ✅
- **决定**：图标按当前状态显示——明文→睁眼(`eye`)，掩码→闭眼(`eye-off`)；`aria-label` 仍按动作（"显示密码"/"隐藏密码"）。
- **原因**：用户反馈"可视性转换是不是反了"。原按"动作约定"（掩码时显示睁眼表示点击可睁眼）易误解；改为状态约定更直观。
- **影响**：login/register 三处切换统一 `showPassword ? "eye" : "eye-off"`。

### D19. 响应式：三列网格推迟到 xl，移动端侧边栏转抽屉 ✅
- **决定**：卡片三列布局用 `xl:`(1280) 而非 `lg:`(1024)；侧边栏 `lg+` 固定 w-60，移动端为遮罩抽屉。
- **原因**：1024px 下三列卡片拥挤（commit `6d8b71d` 修复）；桌面优先同时保证平板/手机无横向溢出。
- **影响**：`md:grid-cols-2 xl:grid-cols-3`；DashboardShell 管理抽屉状态；验证用同源 iframe 实测 scrollWidth。

### D20. 表单校验：昵称非空、简介限长 ✅
- **决定**：profile 编辑昵称 `trim()` 非空（≤40），简介 ≤200 字；发布页必填字段前端 `required` + API 400 兜底。
- **原因**：保证数据质量与展示一致；用户显式要求"不允许空昵称""简介设置合理长度限制"。
- **影响**：前端即时校验 + 服务端兜底（API 校验必填；max_players 仅 DB 约束兜底，见 API_CONTRACTS caveat）。

---

## 附：尚未决策 / 待定
- AI NPC 的模型接入方式（`ai_npcs.model` 默认 `'auto'`，具体供应商/调用方式未定）。
- 真实 Auth 方案细节（Supabase email/password vs OAuth）。
- 部署域名与 Vercel 环境变量配置。
- 信用分聚合算法（出勤率/评分权重）。