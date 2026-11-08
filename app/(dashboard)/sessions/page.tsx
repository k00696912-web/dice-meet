"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Badge, Select, Alert } from "@/components/ui";
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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    system: "全部",
    style: "全部",
    voice_or_text: "",
    beginner_friendly: false,
  });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.system !== "全部") params.set("system", filters.system);
    if (filters.style !== "全部") params.set("style", filters.style);
    if (filters.voice_or_text) params.set("voice_or_text", filters.voice_or_text);
    if (filters.beginner_friendly) params.set("beginner_friendly", "true");

    try {
      const res = await fetch(`/api/sessions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setSessions(json.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
        <div className="flex items-center gap-2 px-6 pt-5 text-sm font-semibold text-primary">
          <Icon name="settings" className="w-4 h-4 text-accent-600" />
          筛选委托
        </div>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <CardContent className="text-center py-16">
              <div className="flex justify-center mb-5">
                <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 text-muted/50">
                  <Icon name="scroll" className="w-8 h-8" />
                </span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-primary mb-2">公告板上暂无委托</h3>
              <p className="text-muted mb-6 max-w-sm mx-auto">
                没有符合条件的跑团，换个筛选条件，或成为第一个发布招募的 DM。
              </p>
              <Button href="/create" variant="outline">
                <Icon name="megaphone" className="w-4 h-4" /> 发布第一个跑团
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((session) => (
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
