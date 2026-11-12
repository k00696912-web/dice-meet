"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, FormField, Alert, H3 } from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";
import { supabase } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 与 lib/profile.ts 的服务端校验保持一致：档案写入前服务端还会再校验一次，前端规则只是提前反馈。
const USERNAME_RE = /^[a-zA-Z0-9_]{2,20}$/;
const PASSWORD_MIN = 6;
const DISPLAY_NAME_MAX = 30;

interface RegisterErrors {
  username?: string;
  display_name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function describeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) {
    return "这个邮箱已经注册过了。请先去登录，或回邮箱里找那封确认邮件。";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("over quota")) {
    return "确认邮件发送过于频繁。当前用的是认证服务的默认发信通道，限额很紧，请稍后再试。";
  }
  if (m.includes("password")) {
    return `密码没有通过认证服务的要求（默认至少 ${PASSWORD_MIN} 位）。`;
  }
  if (m.includes("email") || m.includes("invalid") || m.includes("block")) {
    return "邮箱没有通过认证服务的校验，请检查拼写后重试。";
  }
  return "注册没有成功，请稍后重试。";
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [autoConfirmed, setAutoConfirmed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  function validate(): RegisterErrors {
    const next: RegisterErrors = {};
    if (!username.trim()) next.username = "请输入用户名";
    else if (!USERNAME_RE.test(username.trim()))
      next.username = "用户名只能是 2–20 位字母、数字或下划线";
    if (!displayName.trim()) next.display_name = "请输入显示名";
    else if (displayName.trim().length > DISPLAY_NAME_MAX)
      next.display_name = `显示名不能超过 ${DISPLAY_NAME_MAX} 个字符`;
    if (!email.trim()) next.email = "请输入邮箱";
    else if (!EMAIL_RE.test(email.trim())) next.email = "邮箱格式不正确";
    if (!password) next.password = "请输入密码";
    else if (password.length < PASSWORD_MIN) next.password = `密码至少 ${PASSWORD_MIN} 位`;
    if (!confirm) next.confirm = "请再次输入密码";
    else if (confirm !== password) next.confirm = "两次输入的密码不一致";
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const next = validate();
    setErrors(next);
    setSent(false);
    setAutoConfirmed(false);
    setAuthError(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim(), display_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (process.env.NODE_ENV === "development") {
          // 原始提示只留在开发态控制台，页面上不展示底层错误详情。
          console.warn("signUp failed:", error.message);
        }
        setAuthError(describeAuthError(error.message));
      } else {
        setSent(true);
        // Confirm email 开启时 signUp 不应返回 session；返回了说明配置与预期不一致。
        setAutoConfirmed(!!data.session);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("signUp threw:", err);
      }
      setAuthError("无法连接认证服务，请检查网络后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-6">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-accent-200 shadow-sm">
            <Icon name="dice" className="w-6 h-6" />
          </span>
          <span className="leading-tight text-left">
            <span className="block font-serif font-bold text-primary text-lg">骰子局</span>
            <span className="block text-[11px] tracking-wide text-accent-600">
              DiceMeet · 冒险者公会
            </span>
          </span>
        </Link>

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <H3>创建冒险者档案</H3>
              <p className="text-sm text-muted mt-1.5">加入骰子局，找到你的跑团搭子。</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <FormField label="用户名" required htmlFor="register-username" error={errors.username}>
                <Input
                  id="register-username"
                  type="text"
                  autoComplete="username"
                  placeholder="字母、数字或下划线，2–20 位"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-invalid={!!errors.username}
                />
              </FormField>

              <FormField
                label="显示名"
                required
                htmlFor="register-display-name"
                error={errors.display_name}
                help="公告板上展示的名字，可以用中文。"
              >
                <Input
                  id="register-display-name"
                  type="text"
                  autoComplete="nickname"
                  placeholder="例如：老李"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  aria-invalid={!!errors.display_name}
                />
              </FormField>

              <FormField label="邮箱" required htmlFor="register-email" error={errors.email}>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
              </FormField>

              <FormField label="密码" required htmlFor="register-password" error={errors.password}>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={`至少 ${PASSWORD_MIN} 位`}
                    className="pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-primary transition"
                  >
                    <Icon name={showPassword ? "eye" : "eye-off"} />
                  </button>
                </div>
              </FormField>

              <FormField
                label="确认密码"
                required
                htmlFor="register-confirm"
                error={errors.confirm}
              >
                <div className="relative">
                  <Input
                    id="register-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="再次输入密码"
                    className="pr-11"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={!!errors.confirm}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "隐藏确认密码" : "显示确认密码"}
                    aria-pressed={showConfirm}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-primary transition"
                  >
                    <Icon name={showConfirm ? "eye" : "eye-off"} />
                  </button>
                </div>
              </FormField>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin motion-reduce:animate-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeOpacity="0.25"
                        strokeWidth="3"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    提交中…
                  </>
                ) : (
                  "注册并发送确认邮件"
                )}
              </Button>
            </form>

            {sent && !autoConfirmed && (
              <Alert variant="success" title="验证邮件已发送" className="mt-4">
                我们给 <span className="font-medium">{email.trim()}</span> 发了一封确认邮件。
                点开邮件里的链接会自动完成验证并建立你的档案；收不到请先看垃圾箱。
                确认之前还不能发布跑团。
                <Link
                  href="/sessions"
                  className="font-medium underline underline-offset-2 ml-1 whitespace-nowrap"
                >
                  先去大厅逛逛 →
                </Link>
              </Alert>
            )}

            {sent && autoConfirmed && (
              <Alert variant="warning" title="账号已创建，但没有要求邮箱确认" className="mt-4">
                认证服务这次直接返回了会话，说明邮箱确认开关与我们的预期配置不一致。
                档案要等确认链接走完才会建立，请先检查认证服务的确认邮件设置。
              </Alert>
            )}

            {authError && (
              <Alert variant="error" title="注册未完成" className="mt-4">
                {authError}
                <Link
                  href="/login"
                  className="font-medium underline underline-offset-2 ml-1 whitespace-nowrap"
                >
                  去登录 →
                </Link>
              </Alert>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted">
              已有账号？{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-accent-600 transition"
              >
                去登录
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6">
          <Link href="/sessions" className="text-sm text-muted hover:text-primary transition">
            先去逛逛跑团大厅 →
          </Link>
        </p>
      </div>
    </main>
  );
}