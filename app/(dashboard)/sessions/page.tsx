"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardContent, Badge, Select, Alert, Input, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import type { Session } from "@/lib/types";

const SYSTEMS = ["全部", "D&D 5e", "COC 7th", "Cyberpunk RED", "泛用无界"];
const STYLES = ["全部", "严肃剧情", "轻松搞笑", "硬核战斗", "恐怖悬疑", "自由探索"];
const MODES = [
  { label: "全部", value: "" },
  { label: "语音", value: "voice" },
  { label: "文字", value: "text" },
  { label: "线下", value: "offline" },
];
const SORTS = [
  { label: "最新发布", value: "newest" },
  { label: "最早发布", value: "oldest" },
  { label: "人数较多优先", value: "players" },
];

// 面向用户的故障文案：原始接口错误只进 console，不进 DOM
const LOAD_ERROR_COPY = "跑团大厅暂时读不到委托，可能是网络波动或公会服务正在维护。";

// 「最早发布」必须比较真实时间戳，不能用数组反转冒充：反转只会得到接口倒序的镜像。
// created_at 可能缺失或非法，Date.parse 会返回 NaN，此时一律沉底，保证比较结果确定且不抛错。
function byCreatedAtAsc(a: Session, b: Session) {
  const ta = Date.parse(a.created_at ?? "");
  const tb = Date.parse(b.created_at ?? "");
  if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
  if (!Number.isFinite(ta)) return 1;
  if (!Number.isFinite(tb)) return -1;
  return ta - tb;
}

// 搜索为当前已加载数据集内的客户端过滤（接口未提供全文检索参数）
function matchesQuery(session: Session, needle: string) {
  if (!needle) return true;
  return [
    session.title,
    session.description,
    session.system,
    session.style,
    session.dm?.display_name ?? "",
    ...(session.tags ?? []),
  ].some((value) => String(value).toLowerCase().includes(needle));
}

export default function SessionsPage() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    system: "全部",
    style: "全部",
    voice_or_text: "",
    beginner_friendly: false,
  });
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  // 请求序号 + AbortController：新筛选发出后，迟到的旧响应必须被丢弃
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSessions = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.system !== "全部") params.set("system", filters.system);
    if (filters.style !== "全部") params.set("style", filters.style);
    if (filters.voice_or_text) params.set("voice_or_text", filters.voice_or_text);
    if (filters.beginner_friendly) params.set("beginner_friendly", "true");

    try {
      const res = await fetch(`/api/sessions?${params.toString()}`, { signal: controller.signal });
      const json = await res.json().catch(() => null);
      if (requestId !== requestIdRef.current) return;
      if (!res.ok || !json?.sessions) {
        console.error(`[sessions] 委托列表读取失败 status=${res.status}`, json?.error);
        setError(LOAD_ERROR_COPY);
        return;
      }
      setSessions(json.sessions as Session[]);
    } catch (err) {
      // 被新请求或卸载主动取消，不算用户可见故障
      if (requestId !== requestIdRef.current || controller.signal.aborted) return;
      console.error("[sessions] 委托列表请求异常", err);
      setError(LOAD_ERROR_COPY);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  // Topbar 提交关键词时只切换过滤词，复用已加载数据，不重复请求
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    const filtered = needle ? sessions.filter((s) => matchesQuery(s, needle)) : sessions;
    if (sort === "oldest") return [...filtered].sort(byCreatedAtAsc);
    if (sort === "players") {
      return [...filtered].sort((a, b) => b.current_players - a.current_players);
    }
    // 「最新发布」沿用接口既有的 created_at 倒序，不重排
    return filtered;
  }, [sessions, needle, sort]);

  return (
    <div>
      {/* 页面标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="shield" className="w-3.5 h-3.5" />
            冒险者公会 · 委托大厅
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            跑团大厅
          </h1>
          <p className="text-muted text-base mt-2">浏览公会发布的跑团委托，找到适合你的那一桌冒险。</p>
        </div>
        <Button href="/create" className="shrink-0 self-start sm:self-auto">
          <Icon name="plus" className="w-4 h-4" />
          发布跑团
        </Button>
      </div>

      {/* 筛选面板 */}
      <Card className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Icon name="settings" className="w-4 h-4 text-accent-600" />
            筛选委托
          </p>
          {!loading && !error && (
            <span className="text-xs text-muted">
              共 {visible.length} 份委托
              {needle ? ` · 已在 ${sessions.length} 份筛选结果中检索` : ""}
            </span>
          )}
        </div>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2 md:col-span-4">
            <label htmlFor="session-keyword" className="block text-sm font-medium text-muted mb-1.5">
              关键词
            </label>
            <div className="relative">
              <Icon
                name="search"
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none"
              />
              <Input
                id="session-keyword"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索跑团名称、简介、标签或 DM"
                className="pl-10 pr-10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="清空搜索"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-primary hover:bg-primary/5 transition"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted/80 mt-1.5">
              在当前筛选出的委托中检索标题、简介、标签与 DM 昵称，即时生效。
            </p>
          </div>
          <FilterSelect
            label="系统"
            value={filters.system}
            options={SYSTEMS.map((s) => ({ label: s, value: s }))}
            onChange={(v) => setFilters({ ...filters, system: v })}
          />
          <FilterSelect
            label="风格"
            value={filters.style}
            options={STYLES.map((s) => ({ label: s, value: s }))}
            onChange={(v) => setFilters({ ...filters, style: v })}
          />
          <FilterSelect
            label="方式"
            value={filters.voice_or_text}
            options={MODES}
            onChange={(v) => setFilters({ ...filters, voice_or_text: v })}
          />
          <FilterSelect
            label="排序"
            value={sort}
            options={SORTS}
            onChange={(v) => setSort(v)}
          />
          <div>
            <span className="block text-sm font-medium text-muted mb-1.5">偏好</span>
            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border bg-card cursor-pointer hover:border-accent/40 transition">
              <input
                type="checkbox"
                checked={filters.beginner_friendly}
                onChange={(e) => setFilters({ ...filters, beginner_friendly: e.target.checked })}
                className="w-4 h-4 accent-accent rounded"
              />
              <span className="text-sm text-foreground">仅新手友好</span>
            </label>
          </div>
        </CardContent>
      </Card>

        {loading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <Alert variant="error" title="加载失败">
            <div className="mt-1">{error}</div>
            <button
              onClick={fetchSessions}
              className="mt-3 text-sm font-medium underline underline-offset-2 hover:opacity-80"
            >
              重试
            </button>
          </Alert>
        )}

        {!loading && !error && sessions.length === 0 && (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <EmptyState
                icon={<Icon name="scroll" className="w-8 h-8" />}
                title="公告板上暂无委托"
                description="没有符合条件的跑团，换个筛选条件，或成为第一个发布招募的 DM。"
                action={
                  <Button href="/create" variant="outline">
                    <Icon name="megaphone" className="w-4 h-4" /> 发布第一个跑团
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {!loading && !error && sessions.length > 0 && visible.length === 0 && (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <EmptyState
                icon={<Icon name="search" className="w-8 h-8" />}
                title={`没有匹配「${query.trim()}」的委托`}
                description="关键词会检索标题、简介、标签与 DM 昵称。换个说法，或清空搜索看看全部委托。"
                action={
                  <>
                    <Button onClick={() => setQuery("")}>
                      <Icon name="close" className="w-4 h-4" /> 清空搜索
                    </Button>
                    <Button href="/create" variant="outline">
                      <Icon name="megaphone" className="w-4 h-4" /> 发布新委托
                    </Button>
                  </>
                }
              />
            </CardContent>
          </Card>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1.5">{label}</label>
      <Select className="text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="h-full">
      <div className="p-5 animate-pulse">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="h-6 w-2/3 bg-primary/10 rounded-lg" />
          <div className="h-6 w-16 bg-primary/10 rounded-full shrink-0" />
        </div>
        <div className="space-y-2.5 mb-5">
          <div className="h-4 w-1/2 bg-primary/10 rounded" />
          <div className="h-4 w-2/3 bg-primary/10 rounded" />
          <div className="h-4 w-1/3 bg-primary/10 rounded" />
          <div className="h-4 w-2/5 bg-primary/10 rounded" />
        </div>
        <div className="flex gap-1.5 mb-5">
          <div className="h-6 w-16 bg-primary/10 rounded-full" />
          <div className="h-6 w-16 bg-primary/10 rounded-full" />
        </div>
        <div className="h-10 w-full bg-primary/10 rounded-lg" />
      </div>
    </Card>
  );
}

function MetaRow({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} className="w-4 h-4 text-muted/60" />
      <span className="text-foreground/75">{children}</span>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const modeLabel =
    session.voice_or_text === "voice" ? "语音" : session.voice_or_text === "text" ? "文字" : "线下";
  const full = session.current_players >= session.max_players;

  return (
    <Link href={`/sessions/${session.id}`} className="block group h-full">
      <Card hover className="h-full flex flex-col">
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="font-serif text-lg font-semibold text-primary leading-snug group-hover:text-accent-700 transition">
              {session.title}
            </h3>
            <Badge variant="primary" className="whitespace-nowrap shrink-0">{session.system}</Badge>
          </div>

          <div className="space-y-2.5 mb-5 text-sm">
            <MetaRow icon="sparkles">{session.style}</MetaRow>
            <MetaRow icon="clock">{session.time_schedule}</MetaRow>
            <MetaRow icon="users">{session.current_players}/{session.max_players} 人 · {modeLabel}</MetaRow>
            <MetaRow icon="dice">DM {session.dm?.display_name ?? "未知"}</MetaRow>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {session.beginner_friendly && <Badge variant="success">新手友好</Badge>}
            {/* 去掉与上方绿色 Badge 重复的"新手友好"，并优先保留 AI NPC 以免被截断 */}
            {session.tags
              .filter((tag) => tag !== "新手友好")
              .sort((a, b) => (a === "AI NPC" ? -1 : b === "AI NPC" ? 1 : 0))
              .slice(0, 3)
              .map((tag) => (
                <Badge key={tag} variant={tag === "AI NPC" ? "accent" : "neutral"}>
                  {tag}
                </Badge>
              ))}
          </div>

          <div className={`mt-auto flex items-center justify-center gap-1.5 h-10 w-full rounded-lg text-sm font-medium transition ${
            full ? "bg-primary/5 text-muted" : "bg-primary text-white group-hover:bg-primary-600"
          }`}>
            {full ? "人数已满" : <>查看详情 <Icon name="arrow-right" className="w-4 h-4" /></>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
