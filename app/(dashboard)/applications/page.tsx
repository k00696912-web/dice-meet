"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Select,
  Tabs,
  type TabItem,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";

type AppStatus = "pending" | "approved" | "rejected";
type Experience = "新手" | "进阶" | "资深" | "硬核";
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

interface Application {
  id: string;
  applicant: string;
  experience: Experience;
  systems: string[];
  sessionId: string;
  sessionTitle: string;
  sessionSystem: string;
  appliedAt: string;
  message: string;
  status: AppStatus;
}

// 我主持的跑团（用于「按跑团筛选」与卡片展示）——演示数据
const HOSTED_SESSIONS = [
  { id: "cyberpunk", title: "赛博朋克：夜之城", system: "Cyberpunk RED" },
  { id: "dragonlance", title: "龙枪编年史：长枪之战", system: "D&D 5e" },
];

// 申请记录——演示数据，刷新后恢复初始
const INITIAL_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    applicant: "灰雁",
    experience: "资深",
    systems: ["Cyberpunk RED", "D&D 5e"],
    sessionId: "cyberpunk",
    sessionTitle: "赛博朋克：夜之城",
    sessionSystem: "Cyberpunk RED",
    appliedAt: "2 小时前",
    message: "跑过两年夜之城，喜欢高能整活，周五能固定出勤，想加入你们的边缘行者小队一起搞事。",
    status: "pending",
  },
  {
    id: "app-2",
    applicant: "石头",
    experience: "硬核",
    systems: ["D&D 5e", "Pathfinder"],
    sessionId: "dragonlance",
    sessionTitle: "龙枪编年史：长枪之战",
    sessionSystem: "D&D 5e",
    appliedAt: "5 小时前",
    message: "战术导向的老玩家，擅长法师与团队配合，能接受高难度战役，希望长期固定团。",
    status: "pending",
  },
  {
    id: "app-3",
    applicant: "拾光",
    experience: "新手",
    systems: ["D&D 5e"],
    sessionId: "cyberpunk",
    sessionTitle: "赛博朋克：夜之城",
    sessionSystem: "Cyberpunk RED",
    appliedAt: "昨天",
    message: "第一次接触赛博朋克，只跑过几次 D&D，很感兴趣，愿意提前补规则，求带。",
    status: "pending",
  },
  {
    id: "app-4",
    applicant: "墨白",
    experience: "进阶",
    systems: ["D&D 5e", "COC 7th"],
    sessionId: "dragonlance",
    sessionTitle: "龙枪编年史：长枪之战",
    sessionSystem: "D&D 5e",
    appliedAt: "2 天前",
    message: "跑过一两年团，喜欢角色扮演多于数值，时间稳定，能配合周三的节奏。",
    status: "approved",
  },
  {
    id: "app-5",
    applicant: "青柠",
    experience: "进阶",
    systems: ["Cyberpunk RED"],
    sessionId: "cyberpunk",
    sessionTitle: "赛博朋克：夜之城",
    sessionSystem: "Cyberpunk RED",
    appliedAt: "3 天前",
    message: "夜之城老住户，做过几次独狼，想找个固定队，麦克风和网络都稳定。",
    status: "approved",
  },
  {
    id: "app-6",
    applicant: "老周",
    experience: "资深",
    systems: ["D&D 5e"],
    sessionId: "dragonlance",
    sessionTitle: "龙枪编年史：长枪之战",
    sessionSystem: "D&D 5e",
    appliedAt: "4 天前",
    message: "时间不太固定，可能经常请假，先申请看看，不合适也没关系。",
    status: "rejected",
  },
  {
    id: "app-7",
    applicant: "阿蛮",
    experience: "新手",
    systems: ["无固定系统"],
    sessionId: "cyberpunk",
    sessionTitle: "赛博朋克：夜之城",
    sessionSystem: "Cyberpunk RED",
    appliedAt: "5 天前",
    message: "纯萌新，什么都想试试，规则还不太懂，如果有新手引导就好了。",
    status: "rejected",
  },
];

const EXPERIENCE_META: Record<Experience, { variant: BadgeVariant; hint: string }> = {
  新手: { variant: "neutral", hint: "刚入门" },
  进阶: { variant: "primary", hint: "1–3 年" },
  资深: { variant: "accent", hint: "3 年以上" },
  硬核: { variant: "warning", hint: "重度玩家" },
};

const STATUS_META: Record<AppStatus, { label: string; variant: BadgeVariant; icon: IconName; verb: string }> = {
  pending: { label: "待审核", variant: "warning", icon: "clock", verb: "待处理" },
  approved: { label: "已通过", variant: "success", icon: "shield", verb: "通过" },
  rejected: { label: "已拒绝", variant: "danger", icon: "close", verb: "拒绝" },
};

const EMPTY_COPY: Record<"all" | AppStatus, { title: string; desc: string }> = {
  all: { title: "暂无申请", desc: "你主持的跑团暂时还没有收到加入申请，去发布招募吸引更多冒险者吧。" },
  pending: { title: "暂无待审核申请", desc: "所有申请都已处理完毕，保持得很好。" },
  approved: { title: "暂无已通过申请", desc: "还没有通过任何申请，处理待审核后可以在这里查看。" },
  rejected: { title: "暂无已拒绝申请", desc: "还没有拒绝任何申请。" },
};

function tabLabel(text: string, count: number): ReactNode {
  return (
    <>
      {text}
      <span className="ml-1 text-xs opacity-60">{count}</span>
    </>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [activeKey, setActiveKey] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");

  function updateStatus(id: string, status: AppStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  const statusFilter: "all" | AppStatus = activeKey === "all" ? "all" : (activeKey as AppStatus);

  const matchesSession = (a: Application) => sessionFilter === "all" || a.sessionId === sessionFilter;
  const countFor = (s: "all" | AppStatus) =>
    applications.filter((a) => (s === "all" || a.status === s) && matchesSession(a)).length;

  const visible = applications.filter(
    (a) => (statusFilter === "all" || a.status === statusFilter) && matchesSession(a)
  );

  const tabs: TabItem[] = [
    { key: "all", label: tabLabel("全部", countFor("all")) },
    { key: "pending", label: tabLabel("待审核", countFor("pending")) },
    { key: "approved", label: tabLabel("已通过", countFor("approved")) },
    { key: "rejected", label: tabLabel("已拒绝", countFor("rejected")) },
  ];

  const sessionName = HOSTED_SESSIONS.find((s) => s.id === sessionFilter)?.title;

  return (
    <div>
      {/* 页面标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="inbox" className="w-3.5 h-3.5" />
            冒险者公会 · 招募管理
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">申请管理</h1>
          <p className="text-muted text-base mt-2">查看冒险者的加入申请，管理你主持的战役招募。</p>
        </div>
        <Button href="/my-sessions" variant="outline" className="shrink-0 self-start sm:self-auto">
          <Icon name="swords" className="w-4 h-4" />
          返回我的跑团
        </Button>
      </div>

      <Alert variant="info" className="mb-8">
        本页为申请管理界面演示：申请记录与「通过 / 拒绝 / 撤销」操作均为前端 Mock，仅改变本地状态，不产生真实申请或成员记录，刷新后恢复初始。
      </Alert>

      {/* 申请概览 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold tracking-wider text-accent-600">申请概览</p>
          <Badge variant="neutral">演示数据</Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="inbox" value={applications.length} label="全部申请" />
          <StatCard icon="clock" value={applications.filter((a) => a.status === "pending").length} label="待审核" />
          <StatCard icon="shield" value={applications.filter((a) => a.status === "approved").length} label="已通过" />
          <StatCard icon="close" value={applications.filter((a) => a.status === "rejected").length} label="已拒绝" />
        </div>
        <p className="text-xs text-muted/70 mt-3">以上概览为全局演示数据，不代表真实数据库统计。</p>
      </div>

      {/* 筛选区域 */}
      <Tabs items={tabs} activeKey={activeKey} onChange={setActiveKey} className="mb-5" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-sm text-muted">
          共 <span className="font-semibold text-primary">{visible.length}</span> 条申请
          {sessionName && <span className="text-muted/80"> · {sessionName}</span>}
        </p>
        <div className="w-full sm:w-60">
          <label htmlFor="session-filter" className="block text-xs text-muted mb-1.5">
            按跑团筛选
          </label>
          <Select
            id="session-filter"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="all">全部跑团</option>
            {HOSTED_SESSIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 申请列表 / 空状态 */}
      {visible.length === 0 ? (
        <EmptyList status={statusFilter} />
      ) : (
        <div className="space-y-4">
          {visible.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              onApprove={() => updateStatus(a.id, "approved")}
              onReject={() => updateStatus(a.id, "rejected")}
              onUndo={() => updateStatus(a.id, "pending")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

function ApplicationCard({
  app,
  onApprove,
  onReject,
  onUndo,
}: {
  app: Application;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
}) {
  const st = STATUS_META[app.status];
  const exp = EXPERIENCE_META[app.experience];

  return (
    <Card>
      <CardContent className="p-5">
        {/* 申请者与状态 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={app.applicant} size="lg" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-lg font-semibold text-primary truncate">{app.applicant}</span>
                <Badge variant={exp.variant}>{app.experience}</Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">跑团经验 · {exp.hint}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {app.systems.map((s) => (
                  <Badge key={s} variant="neutral">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Badge variant={st.variant} className="shrink-0">
            <Icon name={st.icon} className="w-3.5 h-3.5" />
            {st.label}
          </Badge>
        </div>

        {/* 申请加入 + 时间 */}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg border border-border bg-primary/[0.03] p-3 min-w-0">
            <div className="text-xs text-muted mb-1">申请加入</div>
            <div className="text-primary font-medium truncate">{app.sessionTitle}</div>
            <div className="text-xs text-muted mt-0.5">{app.sessionSystem}</div>
          </div>
          <div className="rounded-lg border border-border bg-primary/[0.03] p-3 min-w-0">
            <div className="text-xs text-muted mb-1">申请时间</div>
            <div className="text-primary font-medium flex items-center gap-1.5">
              <Icon name="clock" className="w-4 h-4 text-accent-600" />
              {app.appliedAt}
            </div>
          </div>
        </div>

        {/* 留言 */}
        <div className="mt-3 rounded-lg border-l-2 border-accent/40 bg-accent/[0.04] p-3">
          <div className="text-xs text-muted mb-1 flex items-center gap-1.5">
            <Icon name="scroll" className="w-3.5 h-3.5" />
            申请者留言
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed break-words">{app.message}</p>
        </div>

        {/* 审核操作 */}
        <div className="mt-4 pt-3 border-t border-border">
          {app.status === "pending" ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onApprove}>
                <Icon name="shield" className="w-4 h-4" />
                通过申请
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}>
                <Icon name="close" className="w-4 h-4" />
                暂不通过
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Icon name={st.icon} className="w-3.5 h-3.5" />
                你已{st.verb}该申请（演示）
              </p>
              <button
                type="button"
                onClick={onUndo}
                className="text-xs text-accent-600 hover:text-accent-700 inline-flex items-center gap-1"
              >
                <Icon name="arrow-right" className="w-3.5 h-3.5 rotate-180" />
                撤销审核
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyList({ status }: { status: "all" | AppStatus }) {
  const copy = EMPTY_COPY[status];
  return (
    <Card>
      <EmptyState
        icon={<Icon name="inbox" className="w-8 h-8" />}
        title={copy.title}
        description={copy.desc}
        action={
          <>
            <Button href="/my-sessions" variant="outline">
              <Icon name="swords" className="w-4 h-4" />
              返回我的跑团
            </Button>
            <Button href="/sessions" variant="ghost">
              <Icon name="compass" className="w-4 h-4" />
              前往跑团大厅
            </Button>
          </>
        }
      />
    </Card>
  );
}
