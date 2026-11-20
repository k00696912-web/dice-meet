"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
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
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";
// 上限直接取后端常量，避免两边字数规则漂移；type-only 导入不会把服务端代码带进客户端。
import {
  PROFILE_BIO_MAX as BIO_MAX,
  PROFILE_DISPLAY_NAME_MAX as NICKNAME_MAX,
  type OwnProfile,
} from "@/lib/profile";

const ROLE_LABEL: Record<OwnProfile["role"], string> = {
  player: "玩家",
  dm: "DM",
  both: "玩家兼 DM",
};

type LoadState = "loading" | "ready" | "unauthenticated" | "error";

interface ProfileResponse {
  profile?: OwnProfile;
  error?: string;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="font-serif text-2xl sm:text-3xl font-bold text-primary leading-none">{value}</p>
      <p className="text-xs text-muted mt-1.5">{label}</p>
    </div>
  );
}

function NotConnected({ label }: { label: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted mb-2">{label}</p>
      <span className="text-sm text-muted/70">暂未接入</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">正在加载你的冒险者档案…</p>
      <Card className="mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <SkeletonCircle size="lg" className="self-start" />
            <div className="flex-1 min-w-0 space-y-3">
              <Skeleton className="h-7 w-40 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <SkeletonText lines={2} />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-56 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ nickname: "", bio: "" });
  const [errors, setErrors] = useState<{ nickname?: string; bio?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    setState("loading");
    setLoadError("");
    try {
      const res = await fetch("/api/profile", { headers: { Accept: "application/json" } });
      const json: ProfileResponse | null = await res.json().catch(() => null);
      if (res.status === 401) {
        setState("unauthenticated");
        return;
      }
      if (!res.ok || !json?.profile) {
        setLoadError(json?.error ?? "暂时无法读取你的档案，请稍后重试。");
        setState("error");
        return;
      }
      setProfile(json.profile);
      setState("ready");
    } catch {
      setLoadError("网络异常，未能连接到服务器。请检查网络后重试。");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function enterEdit() {
    if (!profile) return;
    setDraft({ nickname: profile.display_name, bio: profile.bio ?? "" });
    setErrors({});
    setSaveError("");
    setSaved(false);
    setEditing(true);
  }

  // 取消即丢弃 draft，展示回到最近一次服务端返回的 profile，不发任何请求。
  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setSaveError("");
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !profile) return;

    const nickname = draft.nickname.trim();
    const next: { nickname?: string; bio?: string } = {};
    if (!nickname) next.nickname = "昵称不能为空";
    else if (nickname.length > NICKNAME_MAX) next.nickname = `昵称不能超过 ${NICKNAME_MAX} 字`;
    // 简介按原始长度计数且不 trim，与后端校验器一致。
    if (draft.bio.length > BIO_MAX) next.bio = `简介不能超过 ${BIO_MAX} 字`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ display_name: nickname, bio: draft.bio }),
      });
      const json: ProfileResponse | null = await res.json().catch(() => null);
      if (!res.ok || !json?.profile) {
        // 失败保留 draft 与编辑态，用户输入不丢。
        setSaveError(json?.error ?? "保存失败，请稍后重试。");
        return;
      }
      setProfile(json.profile);
      setEditing(false);
      setSaved(true);
    } catch {
      setSaveError("网络异常，未能保存。你的输入已保留，请重试。");
    } finally {
      setSaving(false);
    }
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
        {state === "ready" && !editing && (
          <Button onClick={enterEdit} className="shrink-0 self-start sm:self-auto">
            <Icon name="settings" className="w-4 h-4" />
            编辑资料
          </Button>
        )}
      </div>

      {state === "loading" && <ProfileSkeleton />}

      {state === "unauthenticated" && (
        <Alert variant="warning" title="请先登录" className="mb-6">
          登录后才能查看和编辑你的冒险者档案。
          <div className="mt-3">
            <Button href="/login" size="sm">
              前往登录
            </Button>
          </div>
        </Alert>
      )}

      {state === "error" && (
        <Alert variant="error" title="档案加载失败" className="mb-6">
          {loadError}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => void loadProfile()}>
              重试
            </Button>
          </div>
        </Alert>
      )}

      {state === "ready" && profile && saved && !editing && (
        <Alert variant="success" title="已保存" className="mb-6">
          昵称与简介已写入数据库，刷新页面后依然保留。
          <button
            type="button"
            onClick={() => setSaved(false)}
            className="ml-2 font-medium underline underline-offset-2"
          >
            知道了
          </button>
        </Alert>
      )}

      {state === "ready" && profile && editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">编辑冒险者档案</CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
            <form onSubmit={handleSave} className="space-y-6" noValidate>
              {saveError && (
                <Alert variant="error" title="保存失败">
                  {saveError}
                </Alert>
              )}

              <FormField
                label="冒险者昵称"
                required
                htmlFor="nickname"
                error={errors.nickname}
                help={`最多 ${NICKNAME_MAX} 字`}
              >
                <Input
                  id="nickname"
                  value={draft.nickname}
                  maxLength={NICKNAME_MAX}
                  onChange={(e) => setDraft((d) => ({ ...d, nickname: e.target.value }))}
                  placeholder="你的冒险者代号"
                  aria-invalid={!!errors.nickname}
                  disabled={saving}
                />
              </FormField>

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
                  disabled={saving}
                />
              </FormField>

              <div className="rounded-lg border border-border bg-primary/5 p-4 text-xs text-muted leading-relaxed">
                用户名 <span className="font-medium text-primary">@{profile.username}</span>
                、身份、评分与出勤率由系统维护，不可在此修改。
                地点、游戏偏好、时间安排与冒险统计尚未接入数据库，本批不开放编辑。
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="sm:w-auto"
                >
                  取消
                </Button>
                <Button type="submit" disabled={saving} className="sm:flex-1">
                  {saving ? "保存中…" : "保存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {state === "ready" && profile && !editing && (
        <>
          {/* 个人身份卡片 */}
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name}
                  size="xl"
                  online
                  className="self-start"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="font-serif text-2xl font-bold text-primary break-words">
                      {profile.display_name}
                    </h2>
                    <Badge variant="primary">{ROLE_LABEL[profile.role]}</Badge>
                  </div>
                  <p className="text-sm text-muted mb-3 break-words">@{profile.username}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4 break-words">
                    {profile.bio || <span className="text-muted/70">还没有填写个人简介。</span>}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Icon name="clock" className="w-3.5 h-3.5" />
                      加入于 {profile.created_at.slice(0, 10)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="compass" className="w-3.5 h-3.5" />
                      地点暂未接入
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs font-semibold tracking-wider text-accent-600 mb-4">公会信用</p>
                <div className="grid grid-cols-2 gap-4">
                  <Stat value={profile.rating} label="评分" />
                  <Stat value={`${profile.attendance_rate}%`} label="出勤率" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs font-semibold tracking-wider text-accent-600">冒险统计</p>
                  <Badge variant="neutral">暂未接入</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Stat value="—" label="参与跑团" />
                  <Stat value="—" label="主持跑团" />
                  <Stat value="—" label="完成冒险" />
                </div>
                <p className="text-xs text-muted/70 mt-4">
                  场次统计尚未接入数据库，接入后在此显示真实记录。
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* 游戏偏好 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon name="sparkles" className="w-4 h-4 text-accent-600" />
                    <CardTitle className="text-lg">游戏偏好</CardTitle>
                  </div>
                  <Badge variant="neutral">暂未接入</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <NotConnected label="游戏系统" />
                <NotConnected label="喜欢的游戏风格" />
                <NotConnected label="偏好的团风" />
                <NotConnected label="玩家经验等级" />
              </CardContent>
            </Card>

            {/* 时间安排 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="w-4 h-4 text-accent-600" />
                    <CardTitle className="text-lg">时间安排</CardTitle>
                  </div>
                  <Badge variant="neutral">暂未接入</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <NotConnected label="可参与跑团的时间段" />
                <p className="text-xs text-muted/70 mt-4 leading-relaxed">
                  偏好时段尚未接入数据库，日历与时间投票功能将于后续上线。
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}