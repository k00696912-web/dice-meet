"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Avatar, Badge, Button, Card, CardContent, EmptyState } from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import type { Session } from "@/lib/types";
import { NPCS, RELATIONSHIP_META, STATE_META, pickSession, type Npc } from "../mock-npcs";

interface NpcDetailPageProps {
  params: { id: string };
}

export default function NpcDetailPage({ params }: NpcDetailPageProps) {
  // NPCS 里的 key 是稳定 slug，直接来自路由参数，不做随机生成
  const npc = NPCS.find((n) => n.key === params.id);
  if (!npc) return <NpcNotFound id={params.id} />;
  return <NpcDetail npc={npc} />;
}

function NpcDetail({ npc }: { npc: Npc }) {
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

  const session = useMemo(
    () => pickSession(sessions, npc.preferSystem, npc.sessionSlot),
    [sessions, npc.preferSystem, npc.sessionSlot]
  );

  const rel = RELATIONSHIP_META[npc.relationship];
  const st = STATE_META[npc.state];
  const traits = npc.personality.split(" · ").filter(Boolean);

  return (
    <div>
      <Link
        href="/npcs"
        className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 mb-4"
      >
        <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
        返回 AI NPC 工作台
      </Link>

      {/* 头部 */}
      <Card className="relative overflow-hidden">
        {npc.state === "enabled" && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
          />
        )}
        <CardContent className="p-6 sm:p-7">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-4">
            <Icon name="bot" className="w-3.5 h-3.5" />
            冒险者公会 · 智能角色档案
          </p>

          <div className="flex items-start gap-4">
            <span className="relative shrink-0">
              <Avatar name={npc.name} size="xl" className="ring-1 ring-accent/25" />
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-accent-200 border-2 border-card">
                <Icon name="bot" className="w-4 h-4" />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight break-words">
                  {npc.name}
                </h1>
                <Badge variant={rel.variant}>{rel.label}</Badge>
                <Badge variant={st.variant}>
                  <Icon name={st.icon} className="w-3.5 h-3.5" />
                  {st.label}
                  {st.demo && <span className="opacity-70">· 演示</span>}
                </Badge>
              </div>
              <p className="text-muted text-sm mt-2">
                角色定位：{rel.hint} · 性格关键词 {traits.length} 个 · model: {npc.model}
              </p>
            </div>
          </div>

          {/* 所属跑团 */}
          <div className="grid sm:grid-cols-2 gap-3 mt-6 pt-5 border-t border-border/70">
            <div className="rounded-lg border border-border bg-primary/[0.03] p-4 min-w-0">
              <div className="text-xs text-muted mb-1 flex items-center gap-1.5">
                <Icon name="swords" className="w-3.5 h-3.5" />
                所属跑团
                <span className="text-[10px] px-1 rounded bg-primary/10 text-primary/70">真实</span>
              </div>
              {sessionsState === "loading" && (
                <div className="animate-pulse space-y-1.5 pt-1">
                  <div className="h-4 w-2/3 rounded bg-primary/10" />
                  <div className="h-3 w-1/3 rounded bg-primary/10" />
                </div>
              )}
              {sessionsState === "error" && (
                <>
                  <div className="text-sm text-amber-800">公告板委托未加载</div>
                  <button
                    type="button"
                    onClick={fetchSessions}
                    className="mt-1 text-sm font-medium underline underline-offset-2 hover:opacity-80"
                  >
                    重新加载
                  </button>
                </>
              )}
              {sessionsState === "ready" && (
                <>
                  <div className="text-primary font-medium break-words">
                    {session?.title ?? "未关联委托"}
                  </div>
                  <div className="text-xs text-muted mt-0.5 break-words">
                    {session ? `${session.system} · ${session.time_schedule}` : "公告板暂无可绑定的委托"}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border border-border bg-primary/[0.03] p-4 min-w-0">
              <div className="text-xs text-muted mb-1 flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5" />
                最近活动
                <span className="text-[10px] px-1 rounded bg-accent/15 text-accent-700">演示</span>
              </div>
              <div className="text-primary font-medium">{npc.lastActive}</div>
              <div className="text-xs text-muted mt-0.5 font-mono">
                真实值需由 ai_npc_logs 聚合 · 本批未接入
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert variant="info" className="my-6">
        本页设定与工作台列表是同一份演示数据：真实
        <code className="mx-1 px-1 rounded bg-primary/5 text-foreground/80">ai_npcs</code>
        表受 RLS 保护，未登录读不到，本批也不新增查询 API。卡片上的
        <span className="mx-1 font-medium text-primary">所属跑团</span>
        来自公告板的真实委托。
      </Alert>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* 角色档案 */}
          <Card>
            <CardContent className="p-6">
              <SectionTitle icon="scroll" title="角色档案" desc="字段与 ai_npcs 列一一对应" />
              <div className="space-y-5 mt-5">
                <FieldRow label="name" value={npc.name} note="NPC 名称" />
                <div>
                  <FieldLabel label="personality" note="性格 · 数据库里是一个字符串" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {traits.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full text-xs border border-accent/20 bg-accent/[0.06] text-accent-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {/* 标签只是展示层拆分，原始字符串原样保留 */}
                  <p className="text-xs text-muted mt-2 font-mono break-words">原文：{npc.personality}</p>
                </div>
                <FieldRow
                  label="background"
                  value={npc.background || "（演示数据未填写）"}
                  note="背景"
                  muted={!npc.background}
                />
                <FieldRow
                  label="relationship"
                  value={`${rel.label}（${npc.relationship}）`}
                  note="关系定位 · CHECK 四值之一"
                />
                <FieldRow
                  label="behavior_boundaries"
                  value={npc.behavior_boundaries || "（演示数据未填写）"}
                  note="行为边界"
                  muted={!npc.behavior_boundaries}
                />
                <FieldRow label="model" value={npc.model} note="模型 · 项目未接入供应商，只有 auto" mono />
                <FieldRow
                  label="enabled"
                  value={
                    npc.state === "pending"
                      ? "演示态：ai_npcs 没有审核状态列"
                      : npc.state === "enabled"
                        ? "true（已启用）"
                        : "false（已停用）"
                  }
                  note="启用状态"
                  mono={npc.state !== "pending"}
                  muted={npc.state === "pending"}
                />
                <FieldRow
                  label="id / created_at"
                  value="演示数据不提供主键与时间戳"
                  note="真实值由数据库生成"
                  muted
                />
              </div>
            </CardContent>
          </Card>

          {/* 隐藏秘密区域 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <SectionTitle icon="eye-off" title="隐藏秘密" desc="ai_npcs.secrets" />
                <Badge variant="accent" className="ml-auto shrink-0">
                  DM 专属区域 · 前端演示
                </Badge>
              </div>
              <Alert variant="warning" className="mt-4" title="这里没有真实权限隔离">
                当前实现里，<code className="mx-1 px-1 rounded bg-white/50">ai_npcs</code> 的 SELECT 策略允许已通过审核的成员读取整行，
                也就是说这段文字<span className="font-medium">并不只对 DM 可见</span>。
                本批不修改 RLS，也不接真实接口，请勿在此存放真实敏感内容。
              </Alert>
              <p className="text-foreground/85 leading-relaxed mt-4 whitespace-pre-line break-words">
                {npc.secrets || "（演示数据未填写秘密）"}
              </p>
            </CardContent>
          </Card>

          {/* 活动记录 */}
          <Card>
            <CardContent className="p-6">
              <SectionTitle icon="clock" title="活动记录" desc="未来的数据来源：ai_npc_logs" />
              <EmptyState
                className="py-8"
                icon={<Icon name="clock" className="w-8 h-8" />}
                title="活动记录尚未接入"
                description="本批没有 NPC 日志接口，因此不展示任何聊天记录、时间戳或次数。接入后这里会列出 ai_npc_logs 的 input_text、output_text、context_summary 与 created_at。"
                action={
                  <Button href="/npcs" variant="outline" size="sm">
                    <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
                    返回工作台
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* 侧栏 */}
        <div className="space-y-5 min-w-0">
          <Card>
            <CardContent className="p-6 space-y-4">
              <SectionTitle icon="settings" title="操作" desc="本批只开放导航" />
              <div className="space-y-3">
                <div>
                  <Button disabled className="w-full justify-start">
                    <Icon name="scroll" className="w-4 h-4" />
                    编辑设定
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/15">待开放</span>
                  </Button>
                  <p className="text-xs text-muted mt-1.5">编辑表单将在后续批次与写入接口一起开放</p>
                </div>
                <div>
                  <Button disabled className="w-full justify-start">
                    <Icon name="sparkles" className="w-4 h-4" />
                    开始对话
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/15">待开放</span>
                  </Button>
                  <p className="text-xs text-muted mt-1.5">AI 对话与日志写入均未接入，本页不发起相关请求</p>
                </div>
                <Button href="/npcs" variant="outline" className="w-full justify-start">
                  <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
                  返回工作台
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
                <Icon name="shield" className="w-3.5 h-3.5" />
                数据边界
              </p>
              <ul className="space-y-2 text-xs text-muted leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-primary font-medium shrink-0">真实</span>
                  所属跑团名称、系统、活动时间：公告板委托
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-700 font-medium shrink-0">演示</span>
                  姓名、性格、背景、边界、秘密、最近活动：工作台同一份 Mock
                </li>
                <li className="flex gap-2">
                  <span className="text-muted font-medium shrink-0">未接</span>
                  NPC 查询 / 更新接口、AI 对话、ai_npc_logs 日志
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
                <Icon name="users" className="w-3.5 h-3.5" />
                其他演示角色
              </p>
              <div className="flex flex-wrap gap-1.5">
                {NPCS.filter((n) => n.key !== npc.key).map((n) => (
                  <Link
                    key={n.key}
                    href={`/npcs/${n.key}`}
                    className="px-2.5 py-1 rounded-lg text-xs border border-border bg-primary/[0.03] text-primary hover:border-accent/40 hover:bg-accent/[0.06] transition"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NpcNotFound({ id }: { id: string }) {
  return (
    <div>
      <Link
        href="/npcs"
        className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 mb-4"
      >
        <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
        返回 AI NPC 工作台
      </Link>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
            <Icon name="bot" className="w-3.5 h-3.5" />
            冒险者公会 · 智能角色档案
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            找不到这个 NPC
          </h1>
          <p className="text-muted text-base mt-3 leading-relaxed">
            <code className="px-1.5 py-0.5 rounded bg-primary/5 text-foreground/80 break-all">/npcs/{id}</code>
            不在当前演示角色列表里。演示数据只有下面这几位；在创建表单里演示提交的角色不会出现在这里 ——
            那份数据没有写入数据库。
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            {NPCS.map((n) => (
              <Link
                key={n.key}
                href={`/npcs/${n.key}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-primary/[0.03] text-primary hover:border-accent/40 hover:bg-accent/[0.06] transition"
              >
                <Avatar name={n.name} size="sm" />
                {n.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button href="/npcs">
              <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
              返回工作台
            </Button>
            <Button href="/npcs/create" variant="outline">
              <Icon name="plus" className="w-4 h-4" />
              去创建表单看看
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  desc,
}: {
  icon: IconName;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/[0.07] text-accent-700 shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <h2 className="font-serif text-lg font-semibold text-primary leading-tight">{title}</h2>
        {desc && <p className="text-xs text-muted mt-1">{desc}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">{label}</code>
      <span className="text-xs text-muted">{note}</span>
    </div>
  );
}

function FieldRow({
  label,
  value,
  note,
  mono = false,
  muted = false,
}: {
  label: string;
  value: string;
  note: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel label={label} note={note} />
      <p
        className={`mt-1.5 leading-relaxed break-words whitespace-pre-line ${
          muted ? "text-muted/70 italic" : "text-foreground/85"
        } ${mono ? "font-mono text-sm" : "text-sm"}`}
      >
        {value}
      </p>
    </div>
  );
}
