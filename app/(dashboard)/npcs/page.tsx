"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
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
import type { Session } from "@/lib/types";

type NpcState = "enabled" | "pending" | "disabled";
// 与 database/schema.sql 中 ai_npcs.relationship 的 CHECK 取值一致
type Relationship = "ally" | "enemy" | "neutral" | "mysterious";
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

/**
 * 演示 NPC。字段形状对齐 ai_npcs 列：name / personality(TEXT，用「 · 」分隔) /
 * background / relationship / model / enabled。
 * state 中的 pending 与 lastActive 在数据库里没有对应列，页面已标注为演示。
 */
interface Npc {
  key: string;
  name: string;
  personality: string;
  background: string;
  relationship: Relationship;
  model: string;
  state: NpcState;
  /** ai_npcs.session_id 的演示绑定：优先匹配该系统，否则按序号取公告板委托 */
  preferSystem: string;
  sessionSlot: number;
  /** 演示：真实值需从 ai_npc_logs.created_at 聚合推导 */
  lastActive: string;
}

const NPCS: Npc[] = [
  {
    key: "vex",
    name: "维克斯",
    personality: "多疑 · 话少 · 守口如瓶",
    background: "夜之城的老牌义体医生，只在玩家伤重站不稳时才会出现。",
    relationship: "mysterious",
    model: "auto",
    state: "enabled",
    preferSystem: "Cyberpunk RED",
    sessionSlot: 0,
    lastActive: "12 分钟前",
  },
  {
    key: "ashawk",
    name: "灰隼",
    personality: "健谈 · 好奇 · 爱指路",
    background: "北境小镇酒馆的老板娘，掌握着商队与佣兵的所有传闻。",
    relationship: "ally",
    model: "auto",
    state: "enabled",
    preferSystem: "D&D 5e",
    sessionSlot: 1,
    lastActive: "1 小时前",
  },
  {
    key: "silent-mr",
    name: "沈默先生",
    personality: "礼貌 · 阴冷 · 步步紧逼",
    background: "总在调查员最脆弱时登门的绅士，没有人记得是谁放他进来的。",
    relationship: "enemy",
    model: "auto",
    state: "pending",
    preferSystem: "COC 7th",
    sessionSlot: 2,
    lastActive: "昨天",
  },
  {
    key: "azhu",
    name: "阿烛",
    personality: "活泼 · 追问 · 记仇",
    background: "一盏会说话的引魂灯，专门给第一次跑团的玩家解释规则。",
    relationship: "neutral",
    model: "auto",
    state: "enabled",
    preferSystem: "泛用无界",
    sessionSlot: 3,
    lastActive: "昨天",
  },
  {
    key: "screw",
    name: "螺丝",
    personality: "嘴贫 · 热心 · 贪小便宜",
    background: "无人机修师，能用报废零件拼出一把响得起来的枪。",
    relationship: "ally",
    model: "auto",
    state: "enabled",
    preferSystem: "Cyberpunk RED",
    sessionSlot: 4,
    lastActive: "2 天前",
  },
  {
    key: "whitecoat",
    name: "白大褂",
    personality: "冷静 · 术语多 · 回避",
    background: "疗养院的夜班医生，病历本里永远缺关键的一页。",
    relationship: "mysterious",
    model: "auto",
    state: "pending",
    preferSystem: "COC 7th",
    sessionSlot: 5,
    lastActive: "3 天前",
  },
  {
    key: "laohe",
    name: "老何",
    personality: "沉稳 · 谨慎 · 一诺千金",
    background: "佣兵团的军需官，负责在玩家冲动时提醒他们代价。",
    relationship: "neutral",
    model: "auto",
    state: "disabled",
    preferSystem: "D&D 5e",
    sessionSlot: 6,
    lastActive: "7 天前",
  },
  {
    key: "fog",
    name: "雾",
    personality: "沉默 · 模仿 · 难以捉摸",
    background: "跟着队伍翻山的山雾，会重复玩家最后一句说过的话。",
    relationship: "enemy",
    model: "auto",
    state: "disabled",
    preferSystem: "泛用无界",
    sessionSlot: 7,
    lastActive: "2 周前",
  },
];

const RELATIONSHIP_META: Record<Relationship, { label: string; variant: BadgeVariant; hint: string }> = {
  ally: { label: "盟友", variant: "success", hint: "站在玩家一侧" },
  neutral: { label: "中立", variant: "neutral", hint: "各取所需" },
  mysterious: { label: "神秘", variant: "accent", hint: "动机未知" },
  enemy: { label: "敌对", variant: "danger", hint: "与玩家作对" },
};

const STATE_META: Record<NpcState, { label: string; variant: BadgeVariant; icon: IconName; demo: boolean }> = {
  enabled: { label: "已启用", variant: "success", icon: "shield", demo: false },
  pending: { label: "待审核", variant: "warning", icon: "clock", demo: true },
  disabled: { label: "已停用", variant: "neutral", icon: "close", demo: false },
};

const EMPTY_COPY: Record<"all" | NpcState, { title: string; desc: string }> = {
  all: {
    title: "还没有 NPC",
    desc: "创建功能开放后，你的冒险世界就会有第一批智能角色。",
  },
  enabled: { title: "暂无已启用 NPC", desc: "当前筛选下没有正在陪伴队伍的 NPC。" },
  pending: { title: "暂无待审核 NPC", desc: "没有等待确认的智能角色。" },
  disabled: { title: "暂无已停用 NPC", desc: "停用的 NPC 会出现在这里，随时可以重新启用。" },
};

function tabLabel(text: string, count: number): ReactNode {
  return (
    <>
      {text}
      <span className="ml-1 text-xs opacity-60">{count}</span>
    </>
  );
}

/** 把演示 NPC 绑到公告板真实委托：优先同系统，否则按序号取 */
function pickSession(sessions: Session[], preferSystem: string, slot: number): Session | undefined {
  if (sessions.length === 0) return undefined;
  const bySystem = sessions.find((s) => s.system === preferSystem);
  if (bySystem) return bySystem;
  return sessions[slot % sessions.length];
}

export default function NpcsPage() {
  const [activeKey, setActiveKey] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsState, setSessionsState] = useState<"loading" | "ready" | "error">("loading");

  const fetchSessions = useCallback(async () => {
    setSessionsState("loading");
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("加载失败");
      const json = await res.json();
      setSessions(json.sessions ?? []);
      setSessionsState("ready");
    } catch {
      setSessionsState("error");
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const npcs = useMemo(
    () => NPCS.map((n) => ({ ...n, session: pickSession(sessions, n.preferSystem, n.sessionSlot) })),
    [sessions]
  );

  const stateFilter: "all" | NpcState = activeKey === "all" ? "all" : (activeKey as NpcState);
  const matchesSession = (n: (typeof npcs)[number]) =>
    sessionFilter === "all" || (n.session?.id ?? "") === sessionFilter;
  const countFor = (s: "all" | NpcState) =>
    npcs.filter((n) => (s === "all" || n.state === s) && matchesSession(n)).length;
  const visible = npcs.filter(
    (n) => (stateFilter === "all" || n.state === stateFilter) && matchesSession(n)
  );

  const linkedSessionCount = useMemo(
    () => new Set(npcs.map((n) => n.session?.id).filter(Boolean)).size,
    [npcs]
  );

  const tabs: TabItem[] = [
    { key: "all", label: tabLabel("全部", countFor("all")) },
    { key: "enabled", label: tabLabel("已启用", countFor("enabled")) },
    { key: "pending", label: tabLabel("待审核", countFor("pending")) },
    { key: "disabled", label: tabLabel("已停用", countFor("disabled")) },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="bot" className="w-3.5 h-3.5" />
            冒险者公会 · 智能角色工坊
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            AI NPC 工作台
          </h1>
          <p className="text-muted text-base mt-2">创建、管理和陪伴你的冒险世界中的智能角色。</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          <Button disabled>
            <Icon name="plus" className="w-4 h-4" />
            创建 NPC
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white/15">待开放</span>
          </Button>
          <p className="text-xs text-muted">NPC 设定表单将在下一批开放</p>
        </div>
      </div>

      {/* 数据来源声明 */}
      <Alert variant="info" className="mb-6">
        NPC 设定（名称、性格、背景、状态、最近活动）为前端演示数据：真实
        <code className="mx-1 px-1 rounded bg-primary/5 text-foreground/80">ai_npcs</code>
        表受 RLS 保护，未登录读不到，且本批不新增 API。卡片上的
        <span className="mx-1 font-medium text-primary">所属跑团</span>
        来自公告板的真实委托。
      </Alert>

      {sessionsState === "error" && (
        <Alert variant="warning" title="公告板委托未加载" className="mb-6">
          NPC 卡片的「所属跑团」需要真实委托数据，当前加载失败，暂时显示为未关联。
          <button
            type="button"
            onClick={fetchSessions}
            className="mt-2 block text-sm font-medium underline underline-offset-2 hover:opacity-80"
          >
            重新加载
          </button>
        </Alert>
      )}

      {/* 概览统计 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold tracking-wider text-accent-600">工坊概览</p>
          <Badge variant="neutral">演示数据</Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="bot" value={NPCS.length} label="NPC 总数" />
          <StatCard icon="shield" value={NPCS.filter((n) => n.state === "enabled").length} label="已启用" />
          <StatCard icon="clock" value={NPCS.filter((n) => n.state === "pending").length} label="待审核（演示态）" />
          <StatCard
            icon="swords"
            value={linkedSessionCount}
            label={sessionsState === "ready" ? "关联跑团（真实）" : "关联跑团（加载中）"}
          />
        </div>
      </div>

      {/* 筛选 */}
      <Tabs items={tabs} activeKey={activeKey} onChange={setActiveKey} className="mb-5" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-sm text-muted">
          共 <span className="font-semibold text-primary">{visible.length}</span> 个智能角色
          {sessionFilter !== "all" && (
            <span className="text-muted/80">
              {" "}·{" "}
              {sessions.find((s) => s.id === sessionFilter)?.title ?? "指定跑团"}
            </span>
          )}
        </p>
        <div className="w-full sm:w-64">
          <label htmlFor="npc-session-filter" className="block text-xs text-muted mb-1.5">
            按跑团筛选
          </label>
          <Select
            id="npc-session-filter"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="all">全部跑团</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 列表 */}
      {sessionsState === "loading" ? (
        <div className="grid md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <NpcSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Icon name="bot" className="w-8 h-8" />}
              title={EMPTY_COPY[stateFilter].title}
              description={EMPTY_COPY[stateFilter].desc}
              action={
                <Button href="/sessions" variant="outline">
                  <Icon name="compass" className="w-4 h-4" />
                  前往跑团大厅
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {visible.map((npc) => (
            <NpcCard key={npc.key} npc={npc} />
          ))}
        </div>
      )}

      {/* 字段与数据边界说明 */}
      <Card className="mt-8">
        <CardContent className="p-5 sm:p-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-4">
            <Icon name="settings" className="w-3.5 h-3.5" />
            字段与数据边界
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <BoundaryColumn
              title="真实来源"
              tone="primary"
              items={["所属跑团名称与系统：公告板委托", "relationship 取值：与 ai_npcs CHECK 一致", "性格文本形状：ai_npcs.personality TEXT"]}
            />
            <BoundaryColumn
              title="演示内容"
              tone="accent"
              items={["NPC 设定与数量：库中无可读数据", "待审核状态：ai_npcs 只有 enabled 布尔列", "最近活动时间：需由 ai_npc_logs 聚合"]}
            />
            <BoundaryColumn
              title="本批未做"
              tone="muted"
              items={["创建 / 编辑表单", "详情页与 secrets、行为边界", "真实 AI 对话与日志写入"]}
            />
          </div>
        </CardContent>
      </Card>
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

type BoundNpc = Npc & { session?: Session };

function NpcCard({ npc }: { npc: BoundNpc }) {
  const st = STATE_META[npc.state];
  const rel = RELATIONSHIP_META[npc.relationship];
  const traits = npc.personality.split(" · ");

  return (
    <Card hover className="h-full">
      <div className="relative p-5 flex flex-col h-full overflow-hidden">
        {npc.state === "enabled" && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
          />
        )}

        {/* 角色身份 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="relative shrink-0">
              <Avatar name={npc.name} size="lg" className="ring-1 ring-accent/25" />
              <span
                className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-accent-200 border-2 border-card"
                title="AI 驱动"
              >
                <Icon name="bot" className="w-3.5 h-3.5" />
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-lg font-semibold text-primary truncate">{npc.name}</span>
                <Badge variant={rel.variant}>{rel.label}</Badge>
              </div>
              <p className="text-xs text-muted mt-1">
                角色定位 · {rel.hint}
              </p>
            </div>
          </div>
          <Badge variant={st.variant} className="shrink-0">
            <Icon name={st.icon} className="w-3.5 h-3.5" />
            {st.label}
            {st.demo && <span className="opacity-70">· 演示</span>}
          </Badge>
        </div>

        {/* 性格标签 */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {traits.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full text-xs border border-accent/20 bg-accent/[0.06] text-accent-700"
            >
              {t}
            </span>
          ))}
        </div>

        {/* 背景 */}
        <p className="text-sm text-foreground/80 leading-relaxed mt-3 line-clamp-2">{npc.background}</p>

        {/* 所属跑团 + 最近活动 */}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg border border-border bg-primary/[0.03] p-3 min-w-0">
            <div className="text-xs text-muted mb-1 flex items-center gap-1.5">
              <Icon name="swords" className="w-3.5 h-3.5" />
              所属跑团
              <span className="text-[10px] px-1 rounded bg-primary/10 text-primary/70">真实</span>
            </div>
            <div className="text-primary font-medium truncate">{npc.session?.title ?? "未关联委托"}</div>
            <div className="text-xs text-muted mt-0.5 truncate">{npc.session?.system ?? "公告板数据未就绪"}</div>
          </div>
          <div className="rounded-lg border border-border bg-primary/[0.03] p-3 min-w-0">
            <div className="text-xs text-muted mb-1 flex items-center gap-1.5">
              <Icon name="clock" className="w-3.5 h-3.5" />
              最近活动
              <span className="text-[10px] px-1 rounded bg-accent/15 text-accent-700">演示</span>
            </div>
            <div className="text-primary font-medium">{npc.lastActive}</div>
            <div className="text-xs text-muted mt-0.5 font-mono">model: {npc.model}</div>
          </div>
        </div>

        {/* 详情入口 */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3 flex-wrap">
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted/60 bg-primary/5 cursor-not-allowed"
          >
            <Icon name="eye" className="w-4 h-4" />
            查看详情
            <span className="text-[10px]">待开放</span>
          </span>
          <p className="text-xs text-muted/70">行为边界与秘密待详情页展示</p>
        </div>
      </div>
    </Card>
  );
}

function NpcSkeleton() {
  return (
    <Card className="h-full">
      <div className="p-5 animate-pulse">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10" />
            <div className="space-y-2">
              <div className="h-5 w-24 bg-primary/10 rounded" />
              <div className="h-3 w-20 bg-primary/10 rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-primary/10 rounded-full" />
        </div>
        <div className="flex gap-1.5 mb-4">
          <div className="h-5 w-14 bg-primary/10 rounded-full" />
          <div className="h-5 w-14 bg-primary/10 rounded-full" />
        </div>
        <div className="h-4 w-11/12 bg-primary/10 rounded mb-4" />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="h-16 bg-primary/10 rounded-lg" />
          <div className="h-16 bg-primary/10 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}

function BoundaryColumn({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "primary" | "accent" | "muted";
  items: string[];
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent-700"
        : "text-muted";
  return (
    <div className="rounded-lg border border-border bg-primary/[0.02] p-4">
      <p className={`text-xs font-semibold tracking-wider mb-2.5 ${toneClass}`}>{title}</p>
      <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-4">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
