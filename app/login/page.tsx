"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, FormField, Alert, H3 } from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): LoginErrors {
    const next: LoginErrors = {};
    if (!email.trim()) next.email = "请输入邮箱";
    else if (!EMAIL_RE.test(email.trim())) next.email = "邮箱格式不正确";
    if (!password) next.password = "请输入密码";
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const next = validate();
    setErrors(next);
    setDone(false);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitting(false);
    setDone(true);
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
              <H3>欢迎回来</H3>
              <p className="text-sm text-muted mt-1.5">登录你的冒险者档案，继续未完的跑团。</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <FormField label="邮箱" required htmlFor="login-email" error={errors.email}>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
              </FormField>

              <FormField label="密码" required htmlFor="login-password" error={errors.password}>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="请输入密码"
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
                    登录中…
                  </>
                ) : (
                  "登录"
                )}
              </Button>
            </form>

            {done && (
              <Alert variant="success" title="前端模拟：登录交互已完成" className="mt-4">
                这是纯前端演示，未连接真实认证服务，也未创建任何登录状态。
                <Link
                  href="/sessions"
                  className="font-medium underline underline-offset-2 ml-1 whitespace-nowrap"
                >
                  前往跑团大厅 →
                </Link>
              </Alert>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted">
              还没有账号？{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-accent-600 transition"
              >
                立即注册
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