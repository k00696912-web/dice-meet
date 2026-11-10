"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Textarea,
  Select,
  FormField,
  Modal,
  Alert,
  H1,
  H2,
  H3,
  H4,
  Lead,
  P,
  Muted,
  Avatar,
  Tabs,
  EmptyState,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
} from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";

const SWATCHES = [
  { name: "背景 / 羊皮纸", hex: "#F3F0E8", className: "bg-background", text: "text-foreground" },
  { name: "卡片 / 白", hex: "#FFFFFF", className: "bg-card", text: "text-foreground" },
  { name: "主色 / 森林绿", hex: "#243B32", className: "bg-primary", text: "text-white" },
  { name: "强调 / 古金", hex: "#B58B4C", className: "bg-accent", text: "text-white" },
  { name: "文字 / 墨绿灰", hex: "#292D2A", className: "bg-foreground", text: "text-white" },
];

export default function DesignPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <header className="mb-12">
        <Badge variant="accent" className="mb-3">设计系统</Badge>
        <H1>骰子局组件库</H1>
        <Lead className="mt-3">
          羊皮纸白 · 深森林绿 · 古金 —— 一套统一的 TRPG 风格视觉语言与可复用组件。
        </Lead>
      </header>

      {/* Colors */}
      <Section title="配色" subtitle="全站语义化色板">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {SWATCHES.map((s) => (
            <div key={s.hex} className="rounded-xl overflow-hidden border border-border shadow-card">
              <div className={`h-24 ${s.className} ${s.text} flex items-end p-3 text-xs font-medium`}>
                {s.name}
              </div>
              <div className="bg-card px-3 py-2 text-xs text-muted font-mono">{s.hex}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="字体系统" subtitle="衬线标题 + 无衬线正文">
        <Card>
          <CardContent className="space-y-4">
            <H1>标题一 H1 · 掷出你的命运</H1>
            <H2>标题二 H2 · 三步开团</H2>
            <H3>标题三 H3 · 跑团卡片</H3>
            <H4>标题四 H4 · 关于 DM</H4>
            <Lead>引导文字 Lead · 找到你的跑团搭子，开启下一场冒险。</Lead>
            <P>
              正文 Body · 缺 DM？凑不齐人？骰子局帮你按系统、风格、时间精准匹配，
              还有 AI 伴随 NPC 随时补位，让开团不再等待。
            </P>
            <Muted>辅助文字 Muted · 每周六 20:00 · 语音 · 新手友好</Muted>
          </CardContent>
        </Card>
      </Section>

      {/* Buttons */}
      <Section title="按钮" subtitle="五种变体 + 三种尺寸">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">主按钮</Button>
              <Button variant="accent">强调按钮</Button>
              <Button variant="outline">描边按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="danger">危险按钮</Button>
              <Button disabled>禁用</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">小 SM</Button>
              <Button size="md">中 MD</Button>
              <Button size="lg">大 LG</Button>
              <Button variant="accent" size="lg">🎲 开始冒险</Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Badges */}
      <Section title="标签" subtitle="状态与分类标记">
        <Card>
          <CardContent className="flex flex-wrap gap-3">
            <Badge>默认</Badge>
            <Badge variant="primary">D&amp;D 5e</Badge>
            <Badge variant="accent">核心亮点</Badge>
            <Badge variant="success">招募中</Badge>
            <Badge variant="warning">即将满员</Badge>
            <Badge variant="danger">已满员</Badge>
            <Badge variant="primary">🎙️ 语音</Badge>
            <Badge variant="accent">🤖 AI NPC</Badge>
          </CardContent>
        </Card>
      </Section>

      {/* Cards */}
      <Section title="卡片" subtitle="内容容器（含 hover 抬升）">
        <div className="grid sm:grid-cols-2 gap-6">
          <Card hover>
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle>被遗忘的国度：初探</CardTitle>
                <Badge variant="primary">D&amp;D 5e</Badge>
              </div>
              <CardDescription>剑湾北境的失踪案，等待冒险者调查。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted">
              <div>🎭 严肃剧情 · ⏰ 每周六 20:00</div>
              <div>👥 3/5 · 🎲 DM 老李</div>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="flex-1">查看详情</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>普通卡片</CardTitle>
              <CardDescription>无 hover 效果的基础容器</CardDescription>
            </CardHeader>
            <CardContent>
              <P className="text-sm">卡片由 Header / Title / Description / Content / Footer 组合，灵活承载各类内容。</P>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Forms */}
      <Section title="表单" subtitle="输入框、下拉、文本域、字段包装">
        <Card>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="跑团名称" required htmlFor="demo-title">
                <Input id="demo-title" placeholder="例如：被遗忘的国度" />
              </FormField>
              <FormField label="跑团系统" htmlFor="demo-system">
                <Select id="demo-system" defaultValue="D&D 5e">
                  <option>D&amp;D 5e</option>
                  <option>COC 7th</option>
                  <option>Cyberpunk RED</option>
                </Select>
              </FormField>
            </div>
            <FormField label="跑团描述" help="描述背景、规则与期望" htmlFor="demo-desc">
              <Textarea id="demo-desc" rows={3} placeholder="展开你的冒险..." />
            </FormField>
            <FormField label="邮箱" error="请输入有效的邮箱地址" htmlFor="demo-email">
              <Input id="demo-email" defaultValue="not-an-email" />
            </FormField>
          </CardContent>
        </Card>
      </Section>

      {/* Alerts */}
      <Section title="状态提示" subtitle="信息、成功、警告、错误">
        <div className="space-y-3">
          <Alert variant="info" title="提示">发布跑团前请先完善个人资料。</Alert>
          <Alert variant="success" title="发布成功">你的跑团已上线，等待玩家申请。</Alert>
          <Alert variant="warning" title="人数将满">仅剩 1 个名额，尽快审核申请。</Alert>
          <Alert variant="error" title="操作失败">登录已失效，请重新登录。</Alert>
        </div>
      </Section>

      {/* Modal */}
      <Section title="弹窗" subtitle="遮罩 / Esc 关闭、滚动锁定">
        <Card>
          <CardContent>
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              打开弹窗
            </Button>
          </CardContent>
        </Card>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="申请加入跑团"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={() => setModalOpen(false)}>确认申请</Button>
          </>
        }
      >
        <P>你正在申请加入「被遗忘的国度：初探」。DM 审核通过后即可成团。</P>
        <div className="mt-4">
          <FormField label="给 DM 的留言">
            <Textarea rows={3} placeholder="介绍一下你的跑团经验或角色想法..." />
          </FormField>
        </div>
      </Modal>

      {/* Avatar */}
      <Section title="头像 Avatar" subtitle="首字母降级 · 多尺寸 · 在线状态">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-6">
            <Avatar name="老李" size="sm" />
            <Avatar name="老李" size="md" />
            <Avatar name="老李" size="lg" />
            <Avatar name="老李" size="xl" />
            <Avatar name="张DM" size="md" online />
            <Avatar name="小王" size="lg" online />
          </CardContent>
        </Card>
      </Section>

      {/* Tabs */}
      <Section title="标签页 Tabs" subtitle="深绿选中 · 禁用 · 方向键切换 · 内嵌内容">
        <Card>
          <CardContent>
            <Tabs
              defaultKey="intro"
              items={[
                { key: "intro", label: "简介", content: <P>剑湾北境的失踪案，等待冒险者调查。</P> },
                { key: "members", label: "成员", content: <P>老李（DM）· 小王 · 张DM</P> },
                { key: "reviews", label: "评价", disabled: true },
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      {/* EmptyState */}
      <Section title="空状态 EmptyState" subtitle="标题 / 描述 / 图标 / 操作，跨场景复用">
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <EmptyState
              icon={<Icon name="scroll" className="w-8 h-8" />}
              title="暂无跑团"
              description="没有符合条件的跑团，换个筛选，或成为第一个发布招募的 DM。"
              action={
                <Button href="/create" variant="outline">
                  <Icon name="megaphone" className="w-4 h-4" /> 发布跑团
                </Button>
              }
            />
          </Card>
          <Card>
            <EmptyState
              icon={<Icon name="bot" className="w-8 h-8" />}
              title="暂无 NPC"
              description="还没有配置 AI 伴随 NPC，缺人时让它们补位。"
              action={<Button variant="accent" disabled>配置 NPC · 待开放</Button>}
            />
          </Card>
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="骨架屏 Skeleton" subtitle="矩形 / 文本 / 圆形 / 卡片 · 尊重减少动态偏好">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="md" />
                <Skeleton className="h-4 w-24" />
              </div>
              <SkeletonText lines={3} />
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <H3>{title}</H3>
        <Muted className="mt-1">{subtitle}</Muted>
      </div>
      {children}
    </section>
  );
}
