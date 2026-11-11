"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Alert,
  Avatar,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import type { Session } from "@/lib/types";

type JoinState = "idle" | "applied" | "joined";
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const STATUS_META: Record<Session["status"], { label: string; variant: BadgeVariant; icon: IconName }> = {
  recruiting: { label: "招募中", variant: "success", icon: "megaphone" },
  ongoing: { label: "进行中", variant: "primary", icon: "dice" },
  completed: { label: "已结束", variant: "neutral", icon: "scroll" },
  cancelled: { label: "已取消", variant: "neutral", icon: "close" },
};

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

// 演示用冒险者昵称：真实成员名单尚未接入，仅用于填充已占席位（人数为真实数据）
const DEMO_PLAYERS = [
  "林间游侠",
  "夜航船",
  "骰子诗人",
  "北境守望",
  "月见",
  "灰袍学徒",
  "风暴之子",
  "拾荒者",
  "青灯客",
  "远山黛",
];

function modeLabel(v: Session["voice_or_text"]) {
  return v === "voice" ? "语音团" : v === "text" ? "文字团" : "线下团";
}

function modeIcon(v: Session["voice_or_text"]): IconName {
  return v === "voice" ? "megaphone" : v === "text" ? "scroll" : "users";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function parseWeekdays(schedule: string): number[] {
  const map: Record<string, number> = { 一: 0, 二: 1, 三: 2, 四: 3, 五: 4, 六: 5, 日: 6, 天: 6 };
  const found = new Set<number>();
  const re = /(?:周|星期)([一二三四五六日天])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(schedule)) !== null) {
    const idx = map[m[1]];
    if (idx !== undefined) found.add(idx);
  }
  return Array.from(found).sort((a, b) => a - b);
}

function deriveExperience(session: Session): { label: string; variant: BadgeVariant; desc: string; suitable: string } {
  const hardcore = session.tags.some((t) => t.includes("硬核"));
  if (session.beginner_friendly) {
    return {
      label: "新手友好",
      variant: "success",
      desc: "无需跑团经验，DM 会带你快速上手，规则讲解到位。",
      suitable: "刚接触跑团的新人、想轻松体验剧情的玩家",
    };
  }
  if (hardcore) {
    return {
      label: "进阶 · 硬核",
      variant: "warning",
      desc: "规则较重、策略深度高，建议熟悉系统后再加入。",
      suitable: "熟悉规则、追求策略与角色深度的资深玩家",
    };
  }
  return {
    label: "建议有经验",
    variant: "neutral",
    desc: "适合了解基础规则的玩家，纯新手可先与 DM 沟通。",
    suitable: "了解基础规则、喜欢角色扮演与叙事的玩家",
  };
}

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<JoinState>("idle");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setJoinState("idle");
      try {
        const res = await fetch(`/api/sessions/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "加载失败");
        if (!cancelled) setSession(json.session);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (error || !session) {
    return (
      <div className="max-w-2xl">
        <Link href="/sessions" className="inline-flex items-center gap-1.5 text-accent-600 hover:text-accent-700 text-sm">
          <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
          返回跑团大厅
        </Link>
        <Alert variant="error" title="加载失败" className="mt-4">
          {error ?? "跑团不存在"}
        </Alert>
        <div className="mt-6">
          <Button href="/sessions" variant="outline">回到跑团大厅</Button>
        </div>
      </div>
    );
  }

  const status = STATUS_META[session.status];
  const full = session.current_players >= session.max_players;
  const ended = session.status === "completed" || session.status === "cancelled";
  const remaining = Math.max(0, session.max_players - session.current_players);
  const fillPct = session.max_players > 0 ? Math.min(100, Math.round((session.current_players / session.max_players) * 100)) : 0;
  const exp = deriveExperience(session);
  const weekdays = parseWeekdays(session.time_schedule);
  const hasAiNpc = session.tags.includes("AI NPC");
  const tags = session.tags.filter((t) => t !== "新手友好");
  const canApply = !ended && !full;

  const joinButton = (
    <JoinButton
      ended={ended}
      full={full}
      joinState={joinState}
      onApply={() => setJoinState("applied")}
    />
  );

  const demoControls =
    canApply && joinState !== "idle" ? (
      <DemoControls
        joinState={joinState}
        onApprove={() => setJoinState("joined")}
        onReset={() => setJoinState("idle")}
      />
    ) : null;

  return (
    <div className="dmd-page pb-40 lg:pb-8">
      <style>{`
        .dmd-page .dmd-rise { animation: dmdRise .55s cubic-bezier(.22,1,.36,1) both; }
        @keyframes dmdRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .dmd-page .dmd-drift { animation: dmdDrift 9s ease-in-out infinite; }
        @keyframes dmdDrift { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-12px) rotate(-4deg); } }
        .dmd-scroll { scrollbar-width: thin; scrollbar-color: #B58B4C #E2DDD0; }
        .dmd-scroll::-webkit-scrollbar { width: 8px; }
        .dmd-scroll::-webkit-scrollbar-track { background: #E2DDD0; border-radius: 8px; }
        .dmd-scroll::-webkit-scrollbar-thumb { background: #B58B4C; border-radius: 8px; border: 2px solid #E2DDD0; }
        .dmd-scroll::-webkit-scrollbar-thumb:hover { background: #9A7440; }
        @media (prefers-reduced-motion: reduce) {
          .dmd-page .dmd-rise, .dmd-page .dmd-drift { animation: none !important; }
        }
      `}</style>

      <Link
        href="/sessions"
        className="inline-flex items-center gap-1.5 text-accent-600 hover:text-accent-700 text-sm mb-4"
      >
        <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
        返回跑团大厅
      </Link>

      {/* 顶部信息区 */}
      <Card className="dmd-rise relative overflow-hidden bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.12]">
        <Icon
          name="scroll"
          className="dmd-drift pointer-events-none absolute -right-6 -top-8 w-56 h-56 text-primary/[0.05]"
        />
        <div className="pointer-events-none absolute -left-16 -bottom-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 text-accent-700 text-xs font-medium tracking-wide mb-3">
            <Icon name="compass" className="w-4 h-4" />
            冒险者公会 · 委托详情
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-primary text-balance leading-tight min-w-0">
              {session.title}
            </h1>
            <Badge variant={status.variant} className="shrink-0 self-start px-3 py-1 text-sm">
              <Icon name={status.icon} className="w-3.5 h-3.5" />
              {status.label}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="primary">{session.system}</Badge>
            {session.beginner_friendly && <Badge variant="success">新手友好</Badge>}
            {tags.map((tag) => (
              <Badge key={tag} variant={tag === "AI NPC" ? "accent" : "neutral"}>
                {tag === "AI NPC" && <Icon name="bot" className="w-3.5 h-3.5" />}
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-3 mt-6 pt-5 border-t border-border/70">
            <MetaChip icon="shield" label="主持 DM">
              {session.dm ? (
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Avatar name={session.dm.display_name} src={session.dm.avatar_url} size="sm" />
                  <span className="truncate">{session.dm.display_name}</span>
                </span>
              ) : (
                <span className="text-muted">待定</span>
              )}
            </MetaChip>
            <MetaChip icon="users" label="招募人数">
              <span className={full ? "text-accent-700" : "text-primary"}>
                {session.current_players}/{session.max_players}
              </span>
              {!ended && (
                <span className="text-muted text-xs ml-1.5">
                  {full ? "已满员" : `余 ${remaining} 席`}
                </span>
              )}
            </MetaChip>
            <MetaChip icon={modeIcon(session.voice_or_text)} label="进行方式">
              {modeLabel(session.voice_or_text)}
            </MetaChip>
            <MetaChip icon="clock" label="活动时间">
              <span className="truncate max-w-[16rem]">{session.time_schedule}</span>
            </MetaChip>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* 主内容列 */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* 剧情简介 */}
          <Card className="dmd-rise" style={{ animationDelay: "0.06s" }}>
            <CardContent className="p-6">
              <SectionTitle icon="scroll" title="剧情简介" hint="DM 发布的真实委托内容" />
              <div className="dmd-scroll max-h-[22rem] overflow-y-auto pr-3 mt-4 border-l-2 border-accent/40 pl-4">
                <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap break-words">
                  {session.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 跑团概况 */}
          <Card className="dmd-rise" style={{ animationDelay: "0.12s" }}>
            <CardContent className="p-6">
              <SectionTitle icon="compass" title="跑团概况" hint="关键信息一览" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <InfoTile icon="sparkles" label="跑团风格" value={session.style} />
                <InfoTile icon={modeIcon(session.voice_or_text)} label="进行方式" value={modeLabel(session.voice_or_text)} />
                <InfoTile icon="users" label="人数上限" value={`${session.current_players} / ${session.max_players} 人`} />
                <InfoTile icon="dice" label="游戏系统" value={session.system} />
              </div>

              <div className="mt-4 rounded-xl border border-border bg-primary/[0.03] p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm font-medium text-primary">加入建议</span>
                  <Badge variant={exp.variant}>{exp.label}</Badge>
                </div>
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{exp.desc}</p>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  <span className="text-primary/70 font-medium">适合玩家：</span>
                  {exp.suitable}
                  {hasAiNpc && "，以及想体验 AI 同行 NPC 的好奇冒险者"}。
                </p>
                <p className="text-xs text-muted/80 mt-3 flex items-center gap-1.5">
                  <Icon name="eye" className="w-3.5 h-3.5" />
                  根据标签与新手设置推断，仅供参考，非数据库字段。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 主持人与玩家 */}
          <Card className="dmd-rise" style={{ animationDelay: "0.18s" }}>
            <CardContent className="p-6">
              <SectionTitle icon="users" title="主持人与玩家" hint="DM 为真实数据 · 名单为演示" />

              {session.dm && (
                <div className="mt-4 rounded-xl border border-border bg-gradient-to-br from-primary/[0.05] to-accent/[0.06] p-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={session.dm.display_name} src={session.dm.avatar_url} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-lg font-semibold text-primary truncate">
                          {session.dm.display_name}
                        </span>
                        <Badge variant="accent">
                          <Icon name="shield" className="w-3.5 h-3.5" />
                          主持 DM
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted mt-1">
                        <span>⭐ {session.dm.rating.toFixed(1)}</span>
                        <span className="w-px h-3 bg-border" />
                        <span>出勤率 {session.dm.attendance_rate}%</span>
                      </div>
                      {session.dm.bio && (
                        <p className="text-sm text-foreground/75 mt-2 leading-relaxed break-words">
                          {session.dm.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 mt-5 mb-3 flex-wrap">
                <span className="text-sm font-medium text-primary">
                  冒险者席位
                  <span className="text-muted font-normal ml-2">
                    {session.current_players}/{session.max_players}
                  </span>
                </span>
                <Badge variant="neutral">人数真实 · 名单演示</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: session.max_players }).map((_, i) => (
                  <SeatTile
                    key={i}
                    index={i}
                    occupied={i < session.current_players}
                    name={DEMO_PLAYERS[i % DEMO_PLAYERS.length]}
                  />
                ))}
              </div>
              <p className="text-xs text-muted/80 mt-3 flex items-center gap-1.5">
                <Icon name="eye" className="w-3.5 h-3.5" />
                席位数量来自真实数据；玩家昵称与头像为演示占位，真实成员名单将在成员系统上线后展示。
              </p>
            </CardContent>
          </Card>

          {/* 活动安排 */}
          <Card className="dmd-rise" style={{ animationDelay: "0.24s" }}>
            <CardContent className="p-6">
              <SectionTitle icon="clock" title="活动安排" hint="DM 设定的固定时间" />
              <div className="mt-4 rounded-xl border border-border bg-primary/[0.03] p-4 flex items-start gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent-700 shrink-0">
                  <Icon name="clock" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted mb-0.5">固定活动时间</div>
                  <div className="text-primary font-medium break-words">{session.time_schedule}</div>
                </div>
              </div>

              {weekdays.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-muted mb-2">每周节奏（从时间描述解析 · 示意）</div>
                  <div className="flex gap-1.5">
                    {WEEK.map((w, i) => {
                      const active = weekdays.includes(i);
                      return (
                        <span
                          key={w}
                          className={`flex-1 text-center py-2 rounded-lg text-sm border transition ${
                            active
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-card text-muted/60 border-border"
                          }`}
                        >
                          {w}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <Alert variant="info" className="mt-4">
                时间投票与日历同步功能尚未上线，当前展示为 DM 设定的固定安排。如需调整时间，请在加入后与 DM 协商。
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6 min-w-0">
          <div className="lg:sticky lg:top-[88px] space-y-6">
            {/* 加入跑团（桌面） */}
            <Card className="dmd-rise hidden lg:block" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <SectionTitle icon="swords" title="加入跑团" />
                <SeatProgress
                  current={session.current_players}
                  max={session.max_players}
                  pct={fillPct}
                  remaining={remaining}
                  full={full}
                  ended={ended}
                />
                <div className="mt-4">{joinButton}</div>
                {demoControls && <div className="mt-3">{demoControls}</div>}
                <DemoNotice className="mt-3" />

                {session.dm && (
                  <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                    <Avatar name={session.dm.display_name} src={session.dm.avatar_url} size="sm" />
                    <div className="min-w-0 text-sm">
                      <div className="text-primary font-medium truncate">{session.dm.display_name}</div>
                      <div className="text-muted text-xs">⭐ {session.dm.rating.toFixed(1)} · 主持 DM</div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                    <Icon name={copied ? "shield" : "bookmark"} className="w-4 h-4" />
                    {copied ? "已复制链接" : "复制委托链接"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 委托信息 */}
            <Card className="dmd-rise" style={{ animationDelay: "0.16s" }}>
              <CardContent className="p-6">
                <SectionTitle icon="bookmark" title="委托信息" />
                <dl className="mt-4 space-y-3">
                  <MetaRow label="游戏系统" value={session.system} />
                  <MetaRow label="跑团风格" value={session.style} />
                  <MetaRow label="进行方式" value={modeLabel(session.voice_or_text)} />
                  <MetaRow label="发布时间" value={formatDate(session.created_at)} />
                  <MetaRow label="委托编号" value={`#${session.id.slice(0, 8).toUpperCase()}`} mono />
                </dl>
              </CardContent>
            </Card>

            {/* AI 伴随 NPC 亮点 */}
            {hasAiNpc && (
              <Card className="dmd-rise relative overflow-hidden bg-primary text-white border-primary" style={{ animationDelay: "0.22s" }}>
                <Icon name="bot" className="pointer-events-none absolute -right-4 -bottom-5 w-32 h-32 text-white/[0.07]" />
                <CardContent className="relative p-6">
                  <div className="flex items-center gap-2 text-accent-200">
                    <Icon name="sparkles" className="w-5 h-5" />
                    <span className="font-serif text-lg font-semibold text-white">AI 伴随 NPC</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed mt-3">
                    本团配有 AI 控制的同行 NPC，会扮演向导、对手或伙伴，根据你的选择实时回应，让故事永不冷场。
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/90">实时回应</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/90">推动剧情</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/90">永不冷场</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 移动端底部固定加入栏 */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-md px-5 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted">
              {ended ? "活动已结束" : full ? "名额已满" : `余 ${remaining} 席 · ${session.current_players}/${session.max_players}`}
            </div>
            <div className="h-1.5 rounded-full bg-primary/10 mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${fillPct}%` }} />
            </div>
          </div>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>
        {joinButton}
        {demoControls && <div className="mt-2">{demoControls}</div>}
        <DemoNotice compact className="mt-2" />
      </div>
    </div>
  );
}

function JoinButton({
  ended,
  full,
  joinState,
  onApply,
}: {
  ended: boolean;
  full: boolean;
  joinState: JoinState;
  onApply: () => void;
}) {
  if (ended) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full">
        <Icon name="scroll" className="w-4 h-4" />
        活动已结束
      </Button>
    );
  }
  if (joinState === "joined") {
    return (
      <div className="w-full flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 text-green-700 px-5 py-3 text-base font-medium">
        <Icon name="shield" className="w-5 h-5" />
        已加入 · 准备冒险（演示）
      </div>
    );
  }
  if (full) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full">
        <Icon name="users" className="w-4 h-4" />
        名额已满
      </Button>
    );
  }
  if (joinState === "applied") {
    return (
      <div className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 px-5 py-3 text-base font-medium">
        <Icon name="clock" className="w-5 h-5" />
        申请已提交 · 审核中（演示）
      </div>
    );
  }
  return (
    <Button onClick={onApply} size="lg" className="w-full">
      <Icon name="swords" className="w-5 h-5" />
      申请加入
    </Button>
  );
}

function DemoControls({
  joinState,
  onApprove,
  onReset,
}: {
  joinState: JoinState;
  onApprove: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-accent/40 bg-accent/[0.05] p-2.5">
      <div className="text-xs text-accent-700 font-medium mb-2 flex items-center gap-1.5">
        <Icon name="sparkles" className="w-3.5 h-3.5" />
        演示操作
      </div>
      <div className="flex gap-2">
        {joinState === "applied" && (
          <Button variant="accent" size="sm" className="flex-1" onClick={onApprove}>
            模拟审核通过
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1" onClick={onReset}>
          {joinState === "applied" ? "撤销申请" : "退出跑团"}
        </Button>
      </div>
    </div>
  );
}

function DemoNotice({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <p className={`text-muted/80 leading-relaxed flex items-start gap-1.5 ${compact ? "text-[11px]" : "text-xs"} ${className}`}>
      <Icon name="eye" className={`shrink-0 ${compact ? "w-3 h-3 mt-0.5" : "w-3.5 h-3.5 mt-0.5"}`} />
      <span>
        {compact
          ? "前端演示交互 · 不产生真实申请记录 · 刷新后重置"
          : "前端演示交互，不产生真实申请记录，刷新页面后恢复初始状态。真实申请将在用户与成员系统上线后开放。"}
      </span>
    </p>
  );
}

function SeatProgress({
  current,
  max,
  pct,
  remaining,
  full,
  ended,
}: {
  current: number;
  max: number;
  pct: number;
  remaining: number;
  full: boolean;
  ended: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted">招募进度</span>
        <span className="font-medium text-primary">
          {current}/{max}
          {!ended && (
            <span className={`ml-2 text-xs font-normal ${full ? "text-accent-700" : "text-muted"}`}>
              {full ? "已满员" : `余 ${remaining} 席`}
            </span>
          )}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-primary/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SeatTile({ index, occupied, name }: { index: number; occupied: boolean; name: string }) {
  if (occupied) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 min-w-0">
        <Avatar name={name} size="sm" />
        <div className="min-w-0">
          <div className="text-sm text-primary font-medium truncate">{name}</div>
          <div className="text-xs text-muted">席位 {index + 1} · 演示</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-accent/40 bg-accent/[0.04] p-3 min-w-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent-700 shrink-0">
        <Icon name="plus" className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="text-sm text-accent-700 font-medium truncate">虚位以待</div>
        <div className="text-xs text-muted">空位 · 招募中</div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/[0.07] text-primary shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <h2 className="font-serif text-xl font-semibold text-primary leading-tight">{title}</h2>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function MetaChip({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border text-accent-700 shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm font-medium text-primary min-w-0">{children}</div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-primary/[0.03] p-3.5 min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-muted mb-1.5">
        <Icon name={icon} className="w-3.5 h-3.5 text-accent-700" />
        {label}
      </div>
      <div className="text-sm font-medium text-primary break-words">{value}</div>
    </div>
  );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-muted shrink-0">{label}</dt>
      <dd className={`text-sm text-primary font-medium text-right min-w-0 truncate ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="pb-40 lg:pb-8" aria-busy="true" aria-label="加载中">
      <Skeleton className="h-4 w-28 mb-4" />
      <Card>
        <CardContent className="p-6 sm:p-8">
          <Skeleton className="h-3 w-40 mb-4" />
          <div className="flex justify-between gap-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-7 w-20 rounded-full shrink-0" />
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border/70">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <SkeletonCircle size="sm" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <SkeletonText lines={4} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-28 mb-4" />
              <Skeleton className="h-2.5 w-full rounded-full mb-4" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-28 mb-4" />
              <SkeletonText lines={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
