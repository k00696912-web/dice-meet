# 骰子局 DiceMeet

跑团搭子匹配平台 —— 找到合适的 DM 和玩家，开启你的冒险

## 功能特色

- 🎯 **精准匹配**：按系统、风格、时间筛选，找到最适合你的团
- 🤖 **AI 伴随 NPC**：AI 控制的 NPC 角色，缺人补位、新手引导、单人跑团
- ⭐ **信用体系**：出勤记录、玩家评价，告别鸽子

## 技术栈

- **前端**：Next.js 14 + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes
- **数据库**：Supabase (PostgreSQL)
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 复制 `.env.local.example` 为 `.env.local`
3. 填入你的 Supabase URL 和 Anon Key

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `database/schema.sql`

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 项目结构

```
dice-meet/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── sessions/          # 跑团大厅
│   └── create/            # 发布跑团
├── components/            # 可复用组件
├── lib/                   # 工具函数
│   └── supabase.ts        # Supabase 客户端
├── database/              # 数据库相关
│   └── schema.sql         # 数据库表结构
└── public/                # 静态资源
```

## 开发计划

- [x] 项目初始化
- [x] 数据库设计
- [x] 首页 + 跑团大厅 + 发布页面
- [x] 用户认证系统（注册 + 邮箱确认 + 登录 + Cookie Session + 服务端身份校验；退出 UI 与身份展示待 10C）
- [ ] 跑团卡片 CRUD
- [ ] 匹配筛选功能
- [ ] AI NPC 功能
- [ ] 评价/信用系统
- [ ] 部署上线

## 比赛信息

- **比赛**：2026 Qoder 高校创意力大赛
- **赛道**：生活娱乐
- **团队**：待填写

## License

MIT
