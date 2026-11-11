"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import type { Session } from "@/lib/types";

// 取值与 database/schema.sql 中 ai_npcs.relationship 的 CHECK 完全一致
type Relationship = "ally" | "enemy" | "neutral" | "mysterious";
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;
type FieldKey =
  | "name"
  | "session_id"
  | "personality"
  | "background"
  | "behavior_boundaries"
  | "secrets";
type FieldErrors = Partial<Record<FieldKey, string>>;

const NAME_MAX = 30;
const PERSONALITY_MIN = 10;
const PERSONALITY_MAX = 200;
const BACKGROUND_MAX = 500;
const BOUNDARIES_MAX = 300;
const SECRETS_MAX = 300;

const FIELD_ID: Record<FieldKey, string> = {
  name: "npc-name",
  session_id: "npc-session",
  personality: "npc-personality",
  background: "npc-background",
  behavior_boundaries: "npc-boundaries",
  secrets: "npc-secrets",
};

const RELATIONSHIP_META: Record<Relationship, { label: string; variant: BadgeVariant; hint: string }> = {
  ally: { label: "盟友", variant: "success", hint: "站在玩家一侧，愿意主动帮忙" },
  neutral: { label: "中立", variant: "neutral", hint: "各取所需，态度跟着交易走" },
  mysterious: { label: "神秘", variant: "accent", hint: "动机未知，留给玩家去查" },
  enemy: { label: "敌对", variant: "danger", hint: "与队伍作对，会设障也会威胁" },
};

const RELATIONSHIP_ORDER: Relationship[] = ["ally", "neutral", "mysterious", "enemy"];

/**
 * 表单字段形状 = ai_npcs 的列。personality / background / behavior_boundaries /
 * secrets 全部保持字符串（schema 里都是 TEXT），不拆成数组或对象。
 * id 与 created_at 由数据库生成，不在表单里填写。
 */
interface NpcForm {
  session_id: string;
  name: string;
  relationship: Relationship;
  personality: string;
  background: string;
  behavior_boundaries: string;
  secrets: string;
  model: string;
  enabled: boolean;
}

const INITIAL_FORM: NpcForm = {
  session_id: "",
  name: "",
  relationship: "ally",
  personality: "",
  background: "",
  behavior_boundaries: "",
  secrets: "",
  model: "auto",
  enabled: true,
};

// 必填规则对齐 ai_npcs 的 NOT NULL；长度上限只是本页 UI 约束，schema 未限制文本长度
function validate(form: NpcForm, hasSessionOptions: boolean): FieldErrors {
  const errors: FieldErrors = {};

  const name = form.name.trim();
  if (!name) errors.name = "请填写 NPC 名称";
  else if (name.length < 2) errors.name = "名称至少 2 个字符";
  else if (name.length > NAME_MAX) errors.name = `名称不超过 ${NAME_MAX} 字，当前 ${name.length} 字`;

  if (!hasSessionOptions) errors.session_id = "公告板暂无可选跑团，无法创建 NPC";
  else if (!form.session_id) errors.session_id = "请选择这个 NPC 属于哪个跑团";

  const personality = form.personality.trim();
  if (!personality) errors.personality = "请填写性格描述（ai_npcs.personality 为必填）";
  else if (personality.length < PERSONALITY_MIN)
    errors.personality = `性格至少 ${PERSONALITY_MIN} 字，当前 ${personality.length} 字`;
  else if (personality.length > PERSONALITY_MAX)
    errors.personality = `性格不超过 ${PERSONALITY_MAX} 字，当前 ${personality.length} 字`;

  const optional: readonly [FieldKey, string, number][] = [
    ["background", form.background, BACKGROUND_MAX],
    ["behavior_boundaries", form.behavior_boundaries, BOUNDARIES_MAX],
    ["secrets", form.secrets, SECRETS_MAX],
  ];
  for (const [key, value, max] of optional) {
    const len = value.trim().length;
    if (len > max) errors[key] = `不超过 ${max} 字，当前 ${len} 字`;
  }

  return errors;
}

// 性格文本若是「短词 · 短词」这类列举，就拆成标签；整句描述则原样展示
function traitChips(text: string): string[] {
  const parts = text
    .split(/[ ·、,，/|]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 6) return [];
  return parts.every((p) => p.length <= 10) ? parts : [];
}

export default function NpcCreatePage() {
  const [form, setForm] = useState<NpcForm>(INITIAL_FORM);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsState, setSessionsState] = useState<"loading" | "ready" | "error">("loading");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [created, setCreated] = useState<NpcForm | null>(null);

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

  const hasSessionOptions = sessions.length > 0;
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === form.session_id),
    [sessions, form.session_id]
  );

  useEffect(() => {
    if (attempted) setErrors(validate(form, hasSessionOptions));
  }, [attempted, form, hasSessionOptions]);

  const setField = (patch: Partial<NpcForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setCreated(null);
  };

  const submitBlocked = sessionsState !== "ready" || !hasSessionOptions;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(form, hasSessionOptions);
    setAttempted(true);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0] as FieldKey;
      document.getElementById(FIELD_ID[firstKey])?.focus();
      setCreated(null);
      return;
    }
    // 本批不写库：不发起 INSERT，也不伪造请求，只在本地留下一份将要提交的形态
    setCreated({
      ...form,
      name: form.name.trim(),
      personality: form.personality.trim(),
      background: form.background.trim(),
      behavior_boundaries: form.behavior_boundaries.trim(),
      secrets: form.secrets.trim(),
    });
  };

  return (
    <div className="max-w-6xl">
      {/* 标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="bot" className="w-3.5 h-3.5" />
            冒险者公会 · 智能角色工坊
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            创建 AI NPC
          </h1>
          <p className="text-muted text-base mt-2">
            为一个真实委托设定一位智能角色，右侧随时预览它在工作台里的样子。
          </p>
        </div>
        <Button href="/npcs" variant="outline" className="shrink-0 self-start sm:self-auto">
          <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
          返回工作台
        </Button>
      </div>

      {/* 本批边界声明 */}
      <Alert variant="info" className="mb-6">
        本页为<span className="mx-1 font-medium text-primary">前端表单演示</span>：校验与预览真实可用，
        点「创建 NPC」<span className="font-medium text-primary">不会写入 ai_npcs</span>
        ，也不会请求任何写入接口。真实落库需要登录态与 NPC 写入 API，将在后续批次开放。
      </Alert>

      {sessionsState === "error" && (
        <Alert variant="warning" title="公告板委托加载失败" className="mb-6">
          「所属跑团」必须绑定真实委托，当前读不到 <code className="mx-1 px-1 rounded bg-white/50">/api/sessions</code>，
          因此暂时无法提交。
          <button
            type="button"
            onClick={fetchSessions}
            className="mt-2 block text-sm font-medium underline underline-offset-2 hover:opacity-80"
          >
            重新加载委托列表
          </button>
        </Alert>
      )}

      {sessionsState === "ready" && !hasSessionOptions && (
        <Alert variant="warning" title="公告板暂无可选跑团" className="mb-6">
          NPC 必须挂在一个跑团下（<code className="mx-1 px-1 rounded bg-white/50">ai_npcs.session_id NOT NULL</code>），
          现在没有任何进行中或招募中的委托，创建按钮已禁用。
          <div className="mt-3 flex flex-wrap gap-3">
            <Button href="/create" size="sm">
              <Icon name="megaphone" className="w-4 h-4" />
              去发布一个招募
            </Button>
            <Button href="/npcs" size="sm" variant="outline">
              返回工作台
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid xl:grid-cols-3 gap-6 items-start">
        <form className="xl:col-span-2 space-y-6" onSubmit={handleSubmit} noValidate>
          {/* ① 基本信息 */}
          <FormSection index={1} icon="scroll" title="基本信息" desc="先把角色挂在哪个团里、它站在哪一边定下来。">
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="NPC 名称"
                required
                htmlFor={FIELD_ID.name}
                error={errors.name}
                help={`会显示在工作台卡片标题 · 已写 ${form.name.trim().length}/${NAME_MAX} 字`}
              >
                <Input
                  id={FIELD_ID.name}
                  value={form.name}
                  onChange={(e) => setField({ name: e.target.value })}
                  placeholder="例如：维克斯"
                  maxLength={NAME_MAX + 10}
                />
              </FormField>

              <FormField
                label="所属跑团"
                required
                htmlFor={FIELD_ID.session_id}
                error={errors.session_id}
                help={
                  sessionsState === "ready"
                    ? `来自公会公告板的真实委托，共 ${sessions.length} 个可选`
                    : "来自公会公告板的真实委托"
                }
              >
                {sessionsState === "loading" ? (
                  <div className="space-y-2">
                    <Skeleton className="h-11 w-full rounded-lg" />
                    <p className="text-xs text-muted">正在加载公告板委托…</p>
                  </div>
                ) : (
                  <Select
                    id={FIELD_ID.session_id}
                    value={form.session_id}
                    onChange={(e) => setField({ session_id: e.target.value })}
                    disabled={!hasSessionOptions}
                  >
                    <option value="">
                      {hasSessionOptions ? "请选择跑团" : "暂无可选跑团"}
                    </option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}（{s.system}）
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>

            <div>
              <p className="block text-sm font-medium text-primary mb-1.5">
                关系定位
                <span className="text-accent ml-0.5">*</span>
              </p>
              <div role="radiogroup" aria-label="关系定位" className="grid sm:grid-cols-2 gap-3">
                {RELATIONSHIP_ORDER.map((value) => {
                  const meta = RELATIONSHIP_META[value];
                  const checked = form.relationship === value;
                  return (
                    <label key={value} htmlFor={`npc-rel-${value}`} className="cursor-pointer">
                      <input
                        id={`npc-rel-${value}`}
                        name="relationship"
                        type="radio"
                        value={value}
                        checked={checked}
                        onChange={() => setField({ relationship: value })}
                        className="peer sr-only"
                      />
                      <span
                        className={`block rounded-lg border p-3 transition peer-checked:border-accent/60 peer-checked:bg-accent/[0.06] peer-focus-visible:ring-2 peer-focus-visible:ring-accent/30 ${
                          checked ? "border-accent/60 bg-accent/[0.06]" : "border-border bg-card hover:border-accent/30"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">{meta.label}</span>
                          <Badge variant={meta.variant}>{value}</Badge>
                        </span>
                        <span className="block text-xs text-muted mt-1.5 leading-relaxed">{meta.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-sm text-muted mt-1.5">
                四种取值与 <code className="px-1 rounded bg-primary/5">ai_npcs.relationship</code> 的 CHECK 约束一一对应，默认 ally。
              </p>
            </div>
          </FormSection>

          {/* ② 角色设定 */}
          <FormSection index={2} icon="sparkles" title="角色设定" desc="决定它说话的方式、来处，以及 DM 手上留了什么牌。">
            <FormField
              label="性格（personality）"
              required
              htmlFor={FIELD_ID.personality}
              error={errors.personality}
              help="一段纯文本即可；用「 · 」分隔短词时，预览卡片会拆成性格标签"
            >
              <Textarea
                id={FIELD_ID.personality}
                value={form.personality}
                onChange={(e) => setField({ personality: e.target.value })}
                rows={3}
                placeholder="多疑 · 话少 · 守口如瓶&#10;或整句：只在玩家伤重站不稳时才肯开口。"
              />
              <div className="flex justify-end mt-1">
                <Counter current={form.personality.trim().length} min={PERSONALITY_MIN} max={PERSONALITY_MAX} />
              </div>
            </FormField>

            <FormField
              label="背景（background）"
              htmlFor={FIELD_ID.background}
              error={errors.background}
              help="可选 · 写清它是谁、在哪儿活动、和这个团有什么关系"
            >
              <Textarea
                id={FIELD_ID.background}
                value={form.background}
                onChange={(e) => setField({ background: e.target.value })}
                rows={3}
                placeholder="夜之城的老牌义体医生，只在玩家伤重站不稳时才会出现。"
              />
              <div className="flex justify-end mt-1">
                <Counter current={form.background.trim().length} max={BACKGROUND_MAX} />
              </div>
            </FormField>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="行为边界（behavior_boundaries）"
                htmlFor={FIELD_ID.behavior_boundaries}
                error={errors.behavior_boundaries}
                help="可选 · 明确它绝不会做什么"
              >
                <Textarea
                  id={FIELD_ID.behavior_boundaries}
                  value={form.behavior_boundaries}
                  onChange={(e) => setField({ behavior_boundaries: e.target.value })}
                  rows={3}
                  placeholder="不会替玩家做决定；不提供规则书之外的数值；不透露其他玩家的秘密。"
                />
                <div className="flex justify-end mt-1">
                  <Counter current={form.behavior_boundaries.trim().length} max={BOUNDARIES_MAX} />
                </div>
              </FormField>

              <FormField
                label="秘密（secrets）"
                htmlFor={FIELD_ID.secrets}
                error={errors.secrets}
                help="可选 · 只有 DM 该知道的伏笔与把柄"
              >
                <Textarea
                  id={FIELD_ID.secrets}
                  value={form.secrets}
                  onChange={(e) => setField({ secrets: e.target.value })}
                  rows={3}
                  placeholder="他当年的手术台上有过一具不该存在的义体。"
                />
                <div className="flex justify-end mt-1">
                  <Counter current={form.secrets.trim().length} max={SECRETS_MAX} />
                </div>
              </FormField>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              提示：秘密目前与其余设定存在 <code className="px-1 rounded bg-primary/5">ai_npcs</code> 同一行，
              现有 RLS 允许已批准成员读取整行，玩家侧的真正隔离留待后续批次设计；这里先按叙事用途填写。
            </p>
          </FormSection>

          {/* ③ 模型与状态 */}
          <FormSection index={3} icon="settings" title="模型与状态" desc="只开放项目里确认存在的配置。">
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="模型（model）"
                htmlFor="npc-model"
                help="项目尚未接入任何模型供应商（见 DECISIONS.md），因此本批只提供 auto"
              >
                <Select
                  id="npc-model"
                  value={form.model}
                  onChange={(e) => setField({ model: e.target.value })}
                >
                  <option value="auto">auto · 自动分派（默认）</option>
                  <option value="" disabled>
                    指定具体模型 · 供应商未接入，暂不可选
                  </option>
                </Select>
              </FormField>

              <FormField label="启用状态（enabled）" help="对应 ai_npcs.enabled，布尔值，默认开启">
                <label
                  htmlFor="npc-enabled"
                  className="flex items-center gap-3 rounded-lg border border-border bg-primary/[0.03] p-3.5 cursor-pointer"
                >
                  <input
                    id="npc-enabled"
                    type="checkbox"
                    className="peer sr-only"
                    checked={form.enabled}
                    onChange={(e) => setField({ enabled: e.target.checked })}
                  />
                  <span
                    aria-hidden="true"
                    className="relative inline-flex h-[26px] w-[46px] shrink-0 rounded-full border border-border bg-primary/15 transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-accent/30 after:absolute after:inset-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-primary">
                      {form.enabled ? "已启用" : "已停用"}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {form.enabled
                        ? "接上真实对话后，这个角色会参与队伍"
                        : "停用后不参与队伍，随时可以重新启用"}
                    </span>
                  </span>
                </label>
              </FormField>
            </div>
          </FormSection>

          {/* ④ 提交 */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={submitBlocked}>
                  <Icon name="plus" className="w-4 h-4" />
                  创建 NPC
                </Button>
                <Button href="/npcs" variant="outline">
                  取消
                </Button>
                <p className="text-xs text-muted">
                  {submitBlocked
                    ? "等可选跑团就绪后即可提交"
                    : "本批仅前端校验与演示反馈，不写入数据库"}
                </p>
              </div>

              {created && (
                <div className="space-y-4">
                  <Alert variant="success" title="演示创建完成：数据未保存到数据库">
                    表单校验通过，下面就是这份 NPC 将来要落库的形态。当前页面没有发起任何写入请求，
                    刷新或离开本页后不会保留，也不会出现在工作台列表里。
                  </Alert>
                  <div className="rounded-xl border border-border bg-primary/[0.03] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
                      <Icon name="shield" className="w-3.5 h-3.5" />
                      将要写入 ai_npcs 的形态
                    </p>
                    <dl className="grid sm:grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
                      <PayloadRow k="session_id" v={sessions.find((s) => s.id === created.session_id)?.title ?? "已选委托"} />
                      <PayloadRow k="name" v={created.name} />
                      <PayloadRow k="relationship" v={`${RELATIONSHIP_META[created.relationship].label}（${created.relationship}）`} />
                      <PayloadRow k="model" v={created.model} />
                      <PayloadRow k="enabled" v={created.enabled ? "true" : "false"} />
                      <PayloadRow k="id / created_at" v="由数据库生成" />
                      <PayloadRow k="personality" v={created.personality} wide />
                      <PayloadRow k="background" v={created.background || "（空）"} wide />
                      <PayloadRow k="behavior_boundaries" v={created.behavior_boundaries || "（空）"} wide />
                      <PayloadRow k="secrets" v={created.secrets || "（空）"} wide />
                    </dl>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm(INITIAL_FORM);
                        setErrors({});
                        setAttempted(false);
                        setCreated(null);
                      }}
                    >
                      <Icon name="plus" className="w-4 h-4" />
                      再建一个
                    </Button>
                    <Button href="/npcs" size="sm" variant="outline">
                      返回工作台
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        {/* 侧栏：实时预览 + 字段对照 */}
        <aside className="xl:sticky xl:top-6 space-y-5">
          <NpcPreviewCard form={form} session={selectedSession} />

          <Card>
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
                <Icon name="scroll" className="w-3.5 h-3.5" />
                字段对照 ai_npcs
              </p>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed">
                <SchemaRow col="session_id" note="必填 · FK → sessions" />
                <SchemaRow col="name" note="必填" />
                <SchemaRow col="personality" note="必填 · 纯文本字符串" />
                <SchemaRow col="relationship" note="四个枚举值 · 默认 ally" />
                <SchemaRow col="background" note="可选" />
                <SchemaRow col="behavior_boundaries" note="可选" />
                <SchemaRow col="secrets" note="可选" />
                <SchemaRow col="model" note="默认 auto" />
                <SchemaRow col="enabled" note="布尔 · 默认 true" />
                <SchemaRow col="id" note="数据库生成，不填" />
                <SchemaRow col="created_at" note="数据库生成，不填" />
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function FormSection({
  index,
  icon,
  title,
  desc,
  children,
}: {
  index: number;
  icon: IconName;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3 px-6 pt-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/[0.07] text-accent-700 shrink-0">
          <Icon name={icon} className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-semibold text-primary leading-tight">{title}</h2>
          <p className="text-sm text-muted mt-1">{desc}</p>
        </div>
        <span className="ml-auto font-serif text-sm text-accent/70 shrink-0">0{index}</span>
      </div>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function Counter({ current, min = 0, max }: { current: number; min?: number; max: number }) {
  const over = current > max;
  const under = min > 0 && current > 0 && current < min;
  const tone = over ? "text-red-700" : under ? "text-amber-700" : "text-muted";
  return (
    <p className={`text-xs tabular-nums ${tone}`}>
      {current}/{max} 字
      {over ? " · 已超出" : under ? ` · 还需 ${min - current} 字` : ""}
    </p>
  );
}

function PayloadRow({ k, v, wide = false }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="font-mono text-[11px] text-muted">{k}</dt>
      <dd className="text-foreground/90 break-words mt-0.5 whitespace-pre-line">{v}</dd>
    </div>
  );
}

function SchemaRow({ col, note }: { col: string; note: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <code className="font-mono text-[11px] text-primary shrink-0">{col}</code>
      <span className="text-right">{note}</span>
    </li>
  );
}

function NpcPreviewCard({ form, session }: { form: NpcForm; session?: Session }) {
  const meta = RELATIONSHIP_META[form.relationship];
  const name = form.name.trim();
  const traits = traitChips(form.personality.trim());
  const personality = form.personality.trim();
  const background = form.background.trim();

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600">
            <Icon name="eye" className="w-3.5 h-3.5" />
            实时预览
          </p>
          <Badge variant={form.enabled ? "success" : "neutral"}>
            <Icon name={form.enabled ? "shield" : "close"} className="w-3.5 h-3.5" />
            {form.enabled ? "已启用" : "已停用"}
          </Badge>
        </div>

        {/* 名称 + 关系 */}
        <div className="flex items-start gap-3 min-w-0">
          <span className="relative shrink-0">
            <Avatar name={name || "N"} size="lg" className="ring-1 ring-accent/25" />
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-accent-200 border-2 border-card">
              <Icon name="bot" className="w-3.5 h-3.5" />
            </span>
          </span>
          <div className="min-w-0">
            <p className={`font-serif text-lg font-semibold truncate ${name ? "text-primary" : "text-muted/60"}`}>
              {name || "未命名 NPC"}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <span className="text-xs text-muted">{meta.hint}</span>
            </div>
          </div>
        </div>

        {/* 所属跑团 */}
        <div className="rounded-lg border border-border bg-primary/[0.03] p-3 mt-4 min-w-0">
          <div className="text-xs text-muted mb-1 flex items-center gap-1.5">
            <Icon name="swords" className="w-3.5 h-3.5" />
            所属跑团
            <span className="text-[10px] px-1 rounded bg-primary/10 text-primary/70">真实</span>
          </div>
          <div className={`font-medium truncate ${session ? "text-primary" : "text-muted/60"}`}>
            {session?.title ?? "未选择跑团"}
          </div>
          <div className="text-xs text-muted mt-0.5 truncate">
            {session ? `${session.system} · ${session.time_schedule}` : "必填：NPC 要挂在一个真实委托下"}
          </div>
        </div>

        {/* 性格 */}
        <div className="mt-4">
          <p className="text-xs text-muted mb-1.5">性格</p>
          {traits.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {traits.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-xs border border-accent/20 bg-accent/[0.06] text-accent-700"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : personality ? (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{personality}</p>
          ) : (
            <p className="text-sm text-muted/60 italic">（性格还没写 —— 这是必填项）</p>
          )}
        </div>

        {/* 背景 */}
        <div className="mt-3">
          <p className="text-xs text-muted mb-1.5">背景</p>
          {background ? (
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 whitespace-pre-line">{background}</p>
          ) : (
            <p className="text-sm text-muted/60 italic">（暂无背景设定，可选）</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted font-mono">model: {form.model}</p>
          <p className="text-xs text-muted">
            边界 {form.behavior_boundaries.trim() ? "已填" : "—"} · 秘密 {form.secrets.trim() ? "已填" : "—"}
          </p>
        </div>
      </div>
    </Card>
  );
}
