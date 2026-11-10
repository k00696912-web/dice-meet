"use client";

import type { ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  EmptyState,
  type TabItem,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";

type MyRole = "participant" | "host";
type MyStatus = "recruiting" | "ongoing" | "ended";

interface MySession {
  id: string;
  title: string;
  system: string;
  coverIcon: IconName;
  dm: { name: string; isMe?: boolean };
  currentPlayers: number;
  maxPlayers: number;
  status: MyStatus;
  role: MyRole;
  nextActivity: string | null;
  description: string;
}

const MY_SESSIONS: MySession[] = [
  {
    id: "d0debbc5-5b4e-4b6f-aa28-e8835bfb21c6",
    title: "被遗忘的国度：初探",
    system: "D&D 5e",
    coverIcon: "swords",
    dm: { name: "老李" },
    currentPlayers: 3,
    maxPlayers: 5,
    status: "ongoing",
    role: "participant",
    nextActivity: "周六 20:00",
    description: "剑湾北境小镇接连发生失踪案，冒险者受托调查，却卷入更深的阴谋。",
  },
  {
    id: "b98fb47b-88b8-4a0b-8ba9-94e4a1212534",
    title: "克苏鲁的呼唤：暗影低语",
    system: "COC 7th",
    coverIcon: "scroll",
    dm: { name: "张DM" },
    currentPlayers: 4,
    maxPlayers: 6,
    status: "ongoing",
    role: "participant",
    nextActivity: "周日 19:00",
    description: "1925 年的阿卡姆，一桩离奇死亡牵出一本神秘书籍，调查员直面不可名状之物。",
  },
  {
    id: "ee7cfd7e-a353-419e-bdb0-c86cdaac7cb9",
    title: "山海奇谭：泛用无界",
    system: "泛用无界",
    coverIcon: "compass",
    dm: { name: "张DM" },
    currentPlayers: 2,
    maxPlayers: 5,
    status: "recruiting",
    role: "participant",
    nextActivity: "周四 19:30",
    description: "以《山海经》为背景的东方奇幻世界，规则轻量，重叙事与想象。",
  },
  {
    id: "051e97c4-f8eb-4612-8389-ce7b39d457a8",
    title: "赛博朋克：夜之城",
    system: "Cyberpunk RED",
    coverIcon: "bot",
    dm: { name: "艾琳·夜风", isMe: true },
    currentPlayers: 2,
    maxPlayers: 4,
    status: "recruiting",
    role: "host",
    nextActivity: "周五 21:00",
    description: "霓虹灯下的夜之城，边缘行者接到一单看似简单的委托，高能整活欢迎脑洞。",
  },
  {
    id: "d3c2912e-b46a-4069-956b-b6f793c94211",
    title: "龙枪编年史：长枪之战",
    system: "D&D 5e",
    coverIcon: "swords",
    dm: { name: "艾琳·夜风", isMe: true },
    currentPlayers: 5,
    maxPlayers: 6,
    status: "ongoing",
    role: "host",
    nextActivity: "周三 20:30",
    description: "克莱恩大陆战火重燃，战术导向的高难度战役，适合喜欢策略与配合的老玩家。",
  },
  {
    id: "d7954d04-09c4-495c-963e-37879069fc7a",
    title: "废土求生：最后一班车",
    system: "Cyberpunk RED",
    coverIcon: "bot",
    dm: { name: "小王" },
    currentPlayers: 4,
    maxPlayers: 4,
    status: "ended",
    role: "participant",
    nextActivity: null,
    description: "文明崩塌后的废土，一辆装甲列车载着最后的希望穿越辐射荒原。已完结。",
  },
];

interface ReviewItem {
  id: string;
  applicant: string;
  session: string;
  time: string;
}
interface ApplicationItem {
  id: string;
  session: string;
  dm: string;
  status: "待回应" | "已通过" | "已拒绝";
  time: string;
}
interface NoticeItem {
  id: string;
  text: string;
  time: string;
  icon: IconName;
}

const REVIEWS: ReviewItem[] = [
  { id: "r1", applicant: "灰雁", session: "赛博朋克：夜之城", time: "2 小时前" },
  { id: "r2", applicant: "石头", session: "龙枪编年史：长枪之战", time: "昨天" },
];

const APPLICATIONS: ApplicationItem[] = [
  { id: "a1", session: "克苏鲁的呼唤：暗影低语", dm: "张DM", status: "待回应", time: "1 天前" },
  { id: "a2", session: "被遗忘的国度：初探", dm: "老李", status: "已通过", time: "3 天前" },
];

const NOTICES: NoticeItem[] = [
  { id: "n1", text: "「被遗忘的国度：初探」本周六活动提前至 19:00", time: "今天 09:20", icon: "clock" },
];

const activeSessions = MY_SESSIONS.filter((s) => s.status !== "ended");
const participated = activeSessions.filter((s) => s.role === "participant");
const hosted = activeSessions.filter((s) => s.role === "host");
const ended = MY_SESSIONS.filter((s) => s.status === "ended");

const STATS = {
  participating: participated.length,
  hosting: hosted.length,
  pending: REVIEWS.length + APPLICATIONS.length + NOTICES.length,
  ended: ended.length,
};

function StatCard({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 text-accent-600 shrink-0">
          <Icon name={icon} className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-2xl font-bold text-primary leading-none">{value}</p>
          <p className="text-xs text-muted mt-1.5 truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: MyStatus }) {
  const map = {
    recruiting: { label: "招募中", variant: "accent" },
    ongoing: { label: "进行中", variant: "primary" },
    ended: { label: "已结束", variant: "neutral" },
  } as const;
  const c = map[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function MetaRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} className="w-4 h-4 text-muted/60" />
      <span className="text-foreground/75">{children}</span>
    </div>
  );
}

function MySessionCard({ session }: { session: MySession }) {
  return (
    <Card hover className="h-full flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/5 text-accent-600 shrink-0">
            <Icon name={session.coverIcon} className="w-6 h-6" />
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={session.role === "host" ? "accent" : "primary"}>
              {session.role === "host" ? "我主持的" : "我参与的"}
            </Badge>
            <StatusBadge status={session.status} />
          </div>
        </div>

        <h3 className="font-serif text-lg font-semibold text-primary leading-snug mb-2">
          {session.title}
        </h3>
        <div className="mb-3">
          <Badge variant="neutral">{session.system}</Badge>
        </div>
        <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-2">{session.description}</p>

        <div className="flex items-center gap-2.5 mb-4">
          <Avatar name={session.dm.name} size="sm" />
          <p className="text-sm text-foreground/80 truncate">
            DM {session.dm.name}
            {session.dm.isMe && <span className="text-accent-600">（我）</span>}
          </p>
        </div>

        <div className="space-y-2 text-sm mb-5">
          <MetaRow icon="users">
            {session.currentPlayers}/{session.maxPlayers} 人
          </MetaRow>
          <MetaRow icon="clock">
            {session.nextActivity ? `下次活动：${session.nextActivity}` : "暂无后续活动"}
          </MetaRow>
        </div>

        <Button href={`/sessions/${session.id}`} size="sm" className="w-full mt-auto">
          查看详情
          <Icon name="arrow-right" className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

function SessionList({ sessions, emptyTitle }: { sessions: MySession[]; emptyTitle: string }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Icon name="scroll" className="w-8 h-8" />}
          title={emptyTitle}
          description="去跑团大厅看看，找到适合你的那一桌冒险。"
          action={
            <Button href="/sessions" variant="outline">
              <Icon name="compass" className="w-4 h-4" />
              前往跑团大厅
            </Button>
          }
        />
      </Card>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {sessions.map((s) => (
        <MySessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}

function PendingGroup({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-sm font-semibold text-primary">{title}</p>
        {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PendingCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="inbox" className="w-4 h-4 text-accent-600" />
            <CardTitle className="text-lg">待处理事项</CardTitle>
          </div>
          <Badge variant="neutral">演示</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <PendingGroup title="待审核申请" subtitle="我主持的跑团">
          {REVIEWS.map((r) => (
            <div key={r.id} className="flex items-start gap-3">
              <Avatar name={r.applicant} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/85">
                  <span className="font-medium">{r.applicant}</span> 申请加入
                </p>
                <p className="text-xs text-muted truncate">{r.session}</p>
                <p className="text-[11px] text-muted/60 mt-0.5">{r.time}</p>
              </div>
              <Badge variant="warning" className="shrink-0">待审核</Badge>
            </div>
          ))}
        </PendingGroup>

        <div className="border-t border-border pt-6">
          <PendingGroup title="已提交申请" subtitle="我参与的跑团">
            {APPLICATIONS.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-muted shrink-0">
                  <Icon name="scroll" className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground/85 truncate">{a.session}</p>
                  <p className="text-xs text-muted">DM {a.dm} · {a.time}</p>
                </div>
                <Badge
                  variant={a.status === "已通过" ? "success" : a.status === "已拒绝" ? "danger" : "warning"}
                  className="shrink-0"
                >
                  {a.status}
                </Badge>
              </div>
            ))}
          </PendingGroup>
        </div>

        <div className="border-t border-border pt-6">
          <PendingGroup title="跑团通知">
            {NOTICES.map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-accent-600 shrink-0">
                  <Icon name={n.icon} className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground/85 leading-snug">{n.text}</p>
                  <p className="text-[11px] text-muted/60 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </PendingGroup>
        </div>

        <p className="text-xs text-muted/70 leading-relaxed">
          本批仅静态展示演示数据，审批、通知与状态写入功能将于后续上线。
        </p>
      </CardContent>
    </Card>
  );
}

function tabLabel(text: string, count: number): ReactNode {
  return (
    <>
      {text}
      <span className="ml-1 text-xs opacity-60">{count}</span>
    </>
  );
}

export default function MySessionsPage() {
  const tabItems: TabItem[] = [
    {
      key: "all",
      label: tabLabel("全部", MY_SESSIONS.length),
      content: <SessionList sessions={MY_SESSIONS} emptyTitle="暂无跑团" />,
    },
    {
      key: "participated",
      label: tabLabel("我参与的", participated.length),
      content: <SessionList sessions={participated} emptyTitle="暂无参与中的跑团" />,
    },
    {
      key: "hosted",
      label: tabLabel("我主持的", hosted.length),
      content: <SessionList sessions={hosted} emptyTitle="暂无主持中的跑团" />,
    },
    {
      key: "ended",
      label: tabLabel("已结束", ended.length),
      content: <SessionList sessions={ended} emptyTitle="暂无已结束的跑团" />,
    },
  ];

  return (
    <div>
      {/* 页面标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="swords" className="w-3.5 h-3.5" />
            冒险者公会 · 我的冒险
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">我的跑团</h1>
          <p className="text-muted text-base mt-2">管理你参与的冒险与主持的战役。</p>
        </div>
        <Button href="/sessions" variant="outline" className="shrink-0 self-start sm:self-auto">
          <Icon name="compass" className="w-4 h-4" />
          探索跑团
        </Button>
      </div>

      {/* 数据概览 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold tracking-wider text-accent-600">数据概览</p>
          <Badge variant="neutral">演示数据</Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="swords" value={STATS.participating} label="参与中的跑团" />
          <StatCard icon="dice" value={STATS.hosting} label="我主持的跑团" />
          <StatCard icon="inbox" value={STATS.pending} label="待处理事项" />
          <StatCard icon="bookmark" value={STATS.ended} label="已结束的跑团" />
        </div>
        <p className="text-xs text-muted/70 mt-3">以上概览为演示数据，不代表真实数据库统计。</p>
      </div>

      {/* 分类列表 + 待处理事项 */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Tabs items={tabItems} defaultKey="all" />
        </div>
        <div className="lg:col-span-1">
          <PendingCard />
        </div>
      </div>
    </div>
  );
}