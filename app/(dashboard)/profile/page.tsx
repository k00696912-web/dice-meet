"use client";

import { useState, type FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  FormField,
  Alert,
} from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";

const BIO_MAX = 200;
const NICKNAME_MAX = 40;

const ROLE_OPTIONS = ["玩家", "DM", "新手冒险者"];
const SYSTEM_OPTIONS = ["D&D 5e", "克苏鲁的呼唤", "Pathfinder", "Daggerheart", "Cyberpunk RED", "泛用无界"];
const STYLE_OPTIONS = ["探索", "战斗", "角色扮演", "解谜", "叙事", "恐怖悬疑"];
const VIBE_OPTIONS = ["轻松", "沉浸", "叙事", "硬核", "搞笑"];
const EXPERIENCE_OPTIONS = ["新手", "熟悉", "有经验"];
const TIME_OPTIONS = ["工作日白天", "工作日晚上", "周末上午", "周末下午", "周末晚上"];

interface ProfileData {
  nickname: string;
  bio: string;
  roles: string[];
  systems: string[];
  styles: string[];
  vibes: string[];
  experience: string;
  availability: string[];
  joinedAt: string;
  location: string;
  stats: { participated: number; hosted: number; completed: number };
}

const MOCK_PROFILE: ProfileData = {
  nickname: "艾琳·夜风",
  bio: "喜欢沉浸式的叙事团，偏爱探索与角色扮演。周末常跑短团，正在慢慢学习当 DM。",
  roles: ["玩家", "新手冒险者"],
  systems: ["D&D 5e", "克苏鲁的呼唤", "Daggerheart"],
  styles: ["探索", "角色扮演", "解谜"],
  vibes: ["沉浸", "叙事", "轻松"],
  experience: "熟悉",
  availability: ["工作日晚上", "周末下午", "周末晚上"],
  joinedAt: "2024-03-15",
  location: "剑湾 · 无冬城（虚构示例）",
  stats: { participated: 24, hosted: 3, completed: 18 },
};

type ArrayField = "roles" | "systems" | "styles" | "vibes" | "availability";

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={active}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              active
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card text-foreground/70 border-border hover:border-primary/30 hover:text-primary"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TagList({ items, variant = "neutral" }: { items: string[]; variant?: "neutral" | "primary" | "accent" }) {
  if (items.length === 0) return <span className="text-sm text-muted/70">暂未设置</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant={variant}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="font-serif text-2xl sm:text-3xl font-bold text-primary leading-none">{value}</p>
      <p className="text-xs text-muted mt-1.5">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(MOCK_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(MOCK_PROFILE);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ nickname?: string; bio?: string }>({});

  function enterEdit() {
    setDraft(structuredClone(profile));
    setErrors({});
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
  }

  function toggleField(field: ArrayField, value: string) {
    setDraft((d) => ({
      ...d,
      [field]: d[field].includes(value) ? d[field].filter((v) => v !== value) : [...d[field], value],
    }));
  }

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: { nickname?: string; bio?: string } = {};
    if (!draft.nickname.trim()) next.nickname = "昵称不能为空";
    if (draft.bio.length > BIO_MAX) next.bio = `简介不能超过 ${BIO_MAX} 字`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setProfile({ ...structuredClone(draft), nickname: draft.nickname.trim() });
    setEditing(false);
    setSaved(true);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-2">
            <Icon name="shield" className="w-3.5 h-3.5" />
            冒险者公会 · 个人档案
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">冒险者档案</h1>
          <p className="text-muted text-base mt-2">管理你的身份、游戏偏好与冒险经历。</p>
        </div>
        {!editing && (
          <Button onClick={enterEdit} className="shrink-0 self-start sm:self-auto">
            <Icon name="settings" className="w-4 h-4" />
            编辑资料
          </Button>
        )}
      </div>

      {saved && !editing && (
        <Alert variant="success" title="已保存（本地前端演示）" className="mb-6">
          本次修改仅更新当前页面展示的演示数据，不会写入数据库；刷新页面后将恢复初始示例。
          <button
            type="button"
            onClick={() => setSaved(false)}
            className="ml-2 font-medium underline underline-offset-2"
          >
            知道了
          </button>
        </Alert>
      )}

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">编辑冒险者档案</CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
            <form onSubmit={handleSave} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField label="冒险者昵称" required htmlFor="nickname" error={errors.nickname}>
                  <Input
                    id="nickname"
                    value={draft.nickname}
                    maxLength={NICKNAME_MAX}
                    onChange={(e) => setDraft((d) => ({ ...d, nickname: e.target.value }))}
                    placeholder="你的冒险者代号"
                    aria-invalid={!!errors.nickname}
                  />
                </FormField>
                <FormField label="游戏经验等级" htmlFor="experience">
                  <ChipGroup
                    options={EXPERIENCE_OPTIONS}
                    selected={[draft.experience]}
                    onToggle={(v) => setDraft((d) => ({ ...d, experience: v }))}
                  />
                </FormField>
              </div>

              <FormField
                label="个人简介"
                htmlFor="bio"
                error={errors.bio}
                help={`${draft.bio.length} / ${BIO_MAX} 字`}
              >
                <Textarea
                  id="bio"
                  rows={3}
                  value={draft.bio}
                  maxLength={BIO_MAX}
                  onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                  placeholder="介绍一下你的跑团经历与偏好..."
                  aria-invalid={!!errors.bio}
                />
              </FormField>

              <FormField label="玩家身份标签">
                <ChipGroup
                  options={ROLE_OPTIONS}
                  selected={draft.roles}
                  onToggle={(v) => toggleField("roles", v)}
                />
              </FormField>

              <FormField label="游戏系统偏好">
                <ChipGroup
                  options={SYSTEM_OPTIONS}
                  selected={draft.systems}
                  onToggle={(v) => toggleField("systems", v)}
                />
              </FormField>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField label="喜欢的游戏风格">
                  <ChipGroup
                    options={STYLE_OPTIONS}
                    selected={draft.styles}
                    onToggle={(v) => toggleField("styles", v)}
                  />
                </FormField>
                <FormField label="偏好的团风">
                  <ChipGroup
                    options={VIBE_OPTIONS}
                    selected={draft.vibes}
                    onToggle={(v) => toggleField("vibes", v)}
                  />
                </FormField>
              </div>

              <FormField label="可参与时间">
                <ChipGroup
                  options={TIME_OPTIONS}
                  selected={draft.availability}
                  onToggle={(v) => toggleField("availability", v)}
                />
              </FormField>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" onClick={cancelEdit} className="sm:w-auto">
                  取消
                </Button>
                <Button type="submit" className="sm:flex-1">
                  保存
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 个人身份卡片 */}
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar name={profile.nickname} size="xl" online className="self-start" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="font-serif text-2xl font-bold text-primary break-words">{profile.nickname}</h2>
                    <Badge variant="warning">演示数据</Badge>
                  </div>
                  <div className="mb-3">
                    <TagList items={profile.roles} variant="primary" />
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4 break-words">{profile.bio}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Icon name="clock" className="w-3.5 h-3.5" />
                      加入于 {profile.joinedAt}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="compass" className="w-3.5 h-3.5" />
                      {profile.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs font-semibold tracking-wider text-accent-600">冒险统计</p>
                  <Badge variant="neutral">Mock Data</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Stat value={profile.stats.participated} label="参与跑团" />
                  <Stat value={profile.stats.hosted} label="主持跑团" />
                  <Stat value={profile.stats.completed} label="完成冒险" />
                </div>
                <p className="text-xs text-muted/70 mt-4">以上统计为演示数据，不代表真实数据库记录。</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* 游戏偏好 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon name="sparkles" className="w-4 h-4 text-accent-600" />
                  <CardTitle className="text-lg">游戏偏好</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">游戏系统</p>
                  <TagList items={profile.systems} variant="accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">喜欢的游戏风格</p>
                  <TagList items={profile.styles} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">偏好的团风</p>
                  <TagList items={profile.vibes} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">玩家经验等级</p>
                  <Badge variant="primary">{profile.experience}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 时间安排 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon name="clock" className="w-4 h-4 text-accent-600" />
                  <CardTitle className="text-lg">时间安排</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-semibold text-muted mb-2">可参与跑团的时间段</p>
                <TagList items={profile.availability} variant="primary" />
                <p className="text-xs text-muted/70 mt-4 leading-relaxed">
                  本批仅展示偏好时段，日历与时间投票功能将于后续上线。
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}