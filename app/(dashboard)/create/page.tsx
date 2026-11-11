"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import type { VoiceOrText } from "@/lib/types";

const SYSTEMS = ["D&D 5e", "COC 7th", "Cyberpunk RED", "泛用无界", "其他"];
const STYLES = ["严肃剧情", "轻松搞笑", "硬核战斗", "恐怖悬疑", "自由探索"];
const TAG_OPTIONS = ["长期团", "中期团", "短团", "硬核", "AI NPC"];

const MODES: { label: string; value: VoiceOrText; hint: string }[] = [
  { label: "语音", value: "voice", hint: "线上连麦" },
  { label: "文字", value: "text", hint: "纯文字" },
  { label: "线下", value: "offline", hint: "面对面" },
];

// 频率预设只把文本填入 time_schedule（真实入库字段），数据库没有独立频率字段
const CADENCE_PRESETS = [
  { label: "每周一次", sample: "每周六 20:00（北京时间）" },
  { label: "隔周一次", sample: "隔周六 20:00（北京时间）" },
  { label: "每月一次", sample: "每月首个周日 19:30（北京时间）" },
  { label: "短期集中", sample: "连续三个周末 20:00（北京时间）" },
];

const TITLE_MAX = 40;
const DESC_MIN = 20;
const DESC_MAX = 500;

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;
type FieldKey = "title" | "time_schedule" | "max_players" | "description";
type FieldErrors = Partial<Record<FieldKey, string>>;

const FIELD_ID: Record<FieldKey, string> = {
  title: "title",
  time_schedule: "time",
  max_players: "max",
  description: "desc",
};

interface FormState {
  title: string;
  system: string;
  style: string;
  time_schedule: string;
  max_players: number;
  description: string;
  voice_or_text: VoiceOrText;
  beginner_friendly: boolean;
  tags: string[];
}

const INITIAL_FORM: FormState = {
  title: "",
  system: "D&D 5e",
  style: "严肃剧情",
  time_schedule: "",
  max_players: 5,
  description: "",
  voice_or_text: "voice",
  beginner_friendly: false,
  tags: [],
};

// 前端校验规则与 sessions 表的 NOT NULL / CHECK 约束对齐
function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  const title = form.title.trim();
  if (!title) errors.title = "请填写跑团名称";
  else if (title.length < 2) errors.title = "名称至少 2 个字符";
  else if (title.length > TITLE_MAX) errors.title = `名称不超过 ${TITLE_MAX} 字，当前 ${title.length} 字`;

  const time = form.time_schedule.trim();
  if (!time) errors.time_schedule = "请填写固定活动时间，或点选上方频率预设";
  else if (time.length < 4) errors.time_schedule = "请写清星期与时间，例如「每周六 20:00」";

  if (!Number.isInteger(form.max_players)) errors.max_players = "请填写最大玩家人数";
  else if (form.max_players < 2 || form.max_players > 10) errors.max_players = "人数需在 2–10 之间";

  const desc = form.description.trim();
  if (!desc) errors.description = "请填写跑团简介";
  else if (desc.length < DESC_MIN) errors.description = `简介至少 ${DESC_MIN} 字，当前 ${desc.length} 字`;

  return errors;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (attempted) setErrors(validate(formData));
  }, [attempted, formData]);

  const setField = (patch: Partial<FormState>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const toggleTag = (tag: string) =>
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));

  // 「玩家经验要求」由新手友好 + 硬核标签推导，只读展示，不写入数据库
  const experienceHint: { label: string; variant: BadgeVariant; text: string } = useMemo(() => {
    if (formData.tags.includes("硬核")) {
      return {
        label: "需要经验",
        variant: "warning",
        text: "已勾选「硬核」：建议玩家具备同系统跑团经验，能接受高难度判定与严格规则。",
      };
    }
    if (formData.beginner_friendly) {
      return {
        label: "欢迎新手",
        variant: "success",
        text: "已开启「新手友好」：不设经验门槛，建议在简介里说明你会带大家熟悉规则。",
      };
    }
    return {
      label: "轻度门槛",
      variant: "neutral",
      text: "未标注新手友好也未标注硬核：默认玩家了解基础规则即可加入。",
    };
  }, [formData.beginner_friendly, formData.tags]);

  const titleLength = formData.title.trim().length;
  const descLength = formData.description.trim().length;
  const errorCount = Object.keys(errors).length;
  const modeLabel = MODES.find((m) => m.value === formData.voice_or_text)?.label ?? "语音";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const found = validate(formData);
    setAttempted(true);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = (Object.keys(found) as FieldKey[])[0];
      document.getElementById(FIELD_ID[firstKey])?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("发布跑团需要先登录（用户系统将于下一阶段上线）");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发布失败");
      setSuccess("委托已登记到公告板，正在前往详情页…");
      router.push(`/sessions/${json.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl">
      {/* 页面标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="megaphone" className="w-3.5 h-3.5" />
            冒险者公会 · 委托发布
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            发布招募
          </h1>
          <p className="text-muted text-base mt-2">
            填好委托详情，发布后即刻挂上公会公告板，等待冒险者应征。
          </p>
        </div>
        <Button href="/sessions" variant="outline" className="shrink-0 self-start sm:self-auto">
          <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
          返回跑团大厅
        </Button>
      </div>

      <div className="grid xl:grid-cols-3 gap-6 items-start">
        <form className="xl:col-span-2 space-y-6" onSubmit={handleSubmit} noValidate>
          {/* ① 基础信息 */}
          <FormSection
            index={1}
            icon="scroll"
            title="基础信息"
            desc="让冒险者一眼看懂这是一个什么团。"
          >
            <FormField
              label="跑团名称"
              required
              htmlFor="title"
              error={errors.title}
              help={`显示在公告板卡片标题 · 已写 ${titleLength}/${TITLE_MAX} 字`}
            >
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setField({ title: e.target.value })}
                placeholder="例如：被遗忘的国度：初探"
                required
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="游戏系统" required htmlFor="system" help="决定玩家需要的规则书">
                <Select
                  id="system"
                  value={formData.system}
                  onChange={(e) => setField({ system: e.target.value })}
                >
                  {SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="游戏风格" required htmlFor="style" help="影响玩家在招募页看到的调性">
                <Select
                  id="style"
                  value={formData.style}
                  onChange={(e) => setField({ style: e.target.value })}
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField
              label="跑团简介与故事背景"
              required
              htmlFor="desc"
              error={errors.description}
              help="「剧情简介」与「故事背景」共用数据库 description 字段：建议先写背景，再写对玩家的期望。"
            >
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setField({ description: e.target.value })}
                rows={6}
                placeholder="背景：玩家扮演一支临时拼凑的佣兵团……&#10;期望：能固定出席、接受角色死亡……"
                required
              />
              <div className="flex justify-end mt-1">
                <Counter current={descLength} min={DESC_MIN} max={DESC_MAX} />
              </div>
            </FormField>
          </FormSection>

          {/* ② 招募设置 */}
          <FormSection
            index={2}
            icon="users"
            title="招募设置"
            desc="决定这桌能坐几个人、欢迎什么样的玩家。"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="最大玩家人数"
                required
                htmlFor="max"
                error={errors.max_players}
                help="2–10 人；满员后大厅卡片显示「人数已满」"
              >
                <Input
                  id="max"
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={10}
                  value={Number.isInteger(formData.max_players) ? formData.max_players : ""}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    setField({ max_players: Number.isNaN(parsed) ? Number.NaN : parsed });
                  }}
                  required
                />
              </FormField>

              <FormField label="跑团方式" required help="写入 voice_or_text 字段，可在招募类型筛选中命中">
                <div className="flex flex-wrap gap-2">
                  {MODES.map((m) => {
                    const active = formData.voice_or_text === m.value;
                    return (
                      <label
                        key={m.value}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm cursor-pointer transition ${
                          active
                            ? "border-accent/45 bg-accent/[0.07] text-primary"
                            : "border-border bg-card text-foreground hover:border-accent/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="voice_or_text"
                          checked={active}
                          onChange={() => setField({ voice_or_text: m.value })}
                          className="w-4 h-4 accent-accent"
                        />
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-muted/80">{m.hint}</span>
                      </label>
                    );
                  })}
                </div>
              </FormField>
            </div>

            <FormField label="新手友好" help="勾选后玩家可用「仅新手友好」筛出这桌">
              <label
                className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-sm cursor-pointer transition ${
                  formData.beginner_friendly
                    ? "border-accent/45 bg-accent/[0.07] text-primary"
                    : "border-border bg-card text-foreground hover:border-accent/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.beginner_friendly}
                  onChange={(e) => setField({ beginner_friendly: e.target.checked })}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span className="font-medium">欢迎第一次跑团的玩家</span>
              </label>
            </FormField>

            <FormField label="标签" help="用于公告板卡片展示与筛选">
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <label
                    key={tag}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm cursor-pointer transition ${
                      formData.tags.includes(tag)
                        ? "border-accent/45 bg-accent/[0.07] text-primary"
                        : "border-border bg-card text-foreground hover:border-accent/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span className="font-medium">{tag}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <ReadOnlyNote
              icon="shield"
              title="玩家经验要求"
              tag="自动汇总"
              badgeVariant={experienceHint.variant}
              badgeLabel={experienceHint.label}
            >
              {experienceHint.text}
            </ReadOnlyNote>

            <ReadOnlyNote
              icon="megaphone"
              title="招募状态"
              tag="默认值"
              badgeVariant="success"
              badgeLabel="招募中"
            >
              新发布的委托由数据库默认写入 recruiting（招募中），人数从 1 人（DM 自己）起算；本页不提供状态修改。
            </ReadOnlyNote>
          </FormSection>

          {/* ③ 时间安排 */}
          <FormSection
            index={3}
            icon="clock"
            title="时间安排"
            desc="给出稳定可预期的开团节奏，减少反复沟通。"
          >
            <FormField label="游戏频率" help="点选预设会帮你填入下方「固定活动时间」">
              <div className="flex flex-wrap gap-2">
                {CADENCE_PRESETS.map((p) => {
                  const active = formData.time_schedule === p.sample;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setField({ time_schedule: p.sample })}
                      className={`px-3.5 py-2 rounded-lg border text-sm transition ${
                        active
                          ? "border-accent/45 bg-accent/[0.07] text-primary font-medium"
                          : "border-border bg-card text-foreground hover:border-accent/40"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted/70 mt-2">
                频率是快捷填入的文本，数据库没有独立的频率字段，最终以下方时间说明为准。
              </p>
            </FormField>

            <FormField
              label="固定活动时间"
              required
              htmlFor="time"
              error={errors.time_schedule}
              help="请注明时区，例如「每周六 20:00（北京时间）」；平台暂未存储独立时区字段。"
            >
              <Input
                id="time"
                value={formData.time_schedule}
                onChange={(e) => setField({ time_schedule: e.target.value })}
                placeholder="例如：每周六 20:00（北京时间）"
                required
              />
            </FormField>
          </FormSection>

          {/* 反馈与提交 */}
          <div className="space-y-4">
            {attempted && errorCount > 0 && (
              <Alert variant="warning" title={`还有 ${errorCount} 处需要修改`}>
                请检查标红的字段后再提交，信息不会写入公告板。
              </Alert>
            )}
            {error && (
              <Alert variant="error" title="发布未成功">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" title="发布成功">
                {success}
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <p className="text-xs text-muted sm:mr-auto">
                带 <span className="text-accent">*</span> 为必填；提交后真实写入公告板委托。
              </p>
              <div className="flex gap-3">
                <Button href="/sessions" variant="outline">取消</Button>
                <Button type="submit" disabled={submitting} className="min-w-[140px]">
                  <Icon name="megaphone" className="w-4 h-4" />
                  {submitting ? "发布中…" : "发布跑团"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* 右侧：实时预览与说明 */}
        <aside className="xl:col-span-1 space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600">
                <Icon name="eye" className="w-3.5 h-3.5" />
                公告板实时预览
              </p>
              <Badge variant="neutral">未发布</Badge>
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="min-w-0 break-words font-serif text-base font-semibold text-primary leading-snug">
                  {formData.title.trim() || "未命名的冒险"}
                </h3>
                <Badge variant="primary" className="whitespace-nowrap shrink-0">
                  {formData.system}
                </Badge>
              </div>

              <div className="space-y-2.5 mb-4 text-sm">
                <PreviewRow icon="sparkles">{formData.style}</PreviewRow>
                <PreviewRow icon="clock">{formData.time_schedule.trim() || "待填写活动时间"}</PreviewRow>
                <PreviewRow icon="users">
                  {Number.isInteger(formData.max_players) ? `可加入 ${formData.max_players} 人` : "人数待定"} · {modeLabel}
                </PreviewRow>
                <PreviewRow icon="dice">DM 你（登录后自动关联）</PreviewRow>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {formData.beginner_friendly && <Badge variant="success">新手友好</Badge>}
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant={tag === "AI NPC" ? "accent" : "neutral"}>
                    {tag}
                  </Badge>
                ))}
                {!formData.beginner_friendly && formData.tags.length === 0 && (
                  <span className="text-xs text-muted/70">还没有标签，勾一个更抢眼</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold tracking-wider text-accent-600 mb-3">
                表单字段 → 数据库列
              </p>
              <div className="space-y-2.5">
                <FieldMap label="跑团名称" value="sessions.title" />
                <FieldMap label="游戏系统 / 风格" value="system · style" />
                <FieldMap label="简介与背景" value="description" />
                <FieldMap label="固定活动时间" value="time_schedule" />
                <FieldMap label="最大玩家人数" value="max_players (2–10)" />
                <FieldMap label="方式 / 新手 / 标签" value="voice_or_text · beginner_friendly · tags" />
                <FieldMap label="频率预设 · 时区" value="填入 time_schedule" />
                <FieldMap label="经验要求 · 招募状态" value="只读，不入库" muted />
              </div>
              <p className="text-xs text-muted/70 mt-3">
                本页未新增任何数据库字段，全部映射到现有 sessions 表。
              </p>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2.5">
              <Icon name="shield" className="w-3.5 h-3.5" />
              发布须知
            </p>
            <ul className="space-y-2 text-xs text-muted leading-relaxed list-disc pl-4">
              <li>提交真实调用 POST /api/sessions，写入的是公告板真实委托，不是演示数据。</li>
              <li>登录体系尚未接入：未登录时会提示「发布跑团需要先登录」。</li>
              <li>校验通过后才会发请求；未通过的字段会标红并自动聚焦第一个。</li>
            </ul>
          </div>
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

function ReadOnlyNote({
  icon,
  title,
  tag,
  badgeVariant,
  badgeLabel,
  children,
}: {
  icon: IconName;
  title: string;
  tag: string;
  badgeVariant: BadgeVariant;
  badgeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-primary/[0.03] px-4 py-3.5">
      <Icon name={icon} className="w-4 h-4 text-muted/70 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
          {title}
          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          <span className="text-xs font-normal text-muted/70">{tag}</span>
        </p>
        <p className="text-sm text-muted mt-1 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Counter({ current, min = 0, max }: { current: number; min?: number; max: number }) {
  const over = current > max;
  const underMin = current > 0 && current < min;
  return (
    <span
      className={`text-xs tabular-nums ${
        over ? "text-red-600" : underMin ? "text-accent-700" : "text-muted/70"
      }`}
    >
      {current}/{max} 字{underMin ? ` · 还需 ${min - current} 字` : ""}
    </span>
  );
}

function PreviewRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Icon name={icon} className="w-4 h-4 text-muted/60 shrink-0" />
      <span className="text-foreground/75 truncate">{children}</span>
    </div>
  );
}

function FieldMap({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-right break-words ${muted ? "text-muted/70" : "text-primary font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
