import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { ensureProfileForUser, type ProfileBootstrap } from "@/lib/profile";

export const dynamic = "force-dynamic";

type CheckState = "pass" | "fail" | "pending";
type Tone = "ok" | "warn" | "bad";

interface View {
  tone: Tone;
  status: number;
  title: string;
  summary: string;
  checks: { label: string; state: CheckState; note?: string }[];
  actions: { href: string; label: string; primary?: boolean }[];
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const toneColor: Record<Tone, string> = { ok: "#2F6B4F", warn: "#B58B4C", bad: "#9A3B2E" };
const checkMark: Record<CheckState, { glyph: string; color: string }> = {
  pass: { glyph: "✓", color: "#2F6B4F" },
  fail: { glyph: "✕", color: "#9A3B2E" },
  pending: { glyph: "—", color: "#8A8577" },
};

function render(view: View): string {
  const checks = view.checks
    .map((c) => {
      const m = checkMark[c.state];
      const note = c.note ? `<span class="note">${esc(c.note)}</span>` : "";
      return `<li><span class="mark" style="color:${m.color}">${m.glyph}</span><span>${esc(c.label)}</span>${note}</li>`;
    })
    .join("");

  const actions = view.actions
    .map((a, i) => {
      const cls = a.primary || i === 0 ? "btn btn-primary" : "btn";
      return `<a class="${cls}" href="${esc(a.href)}">${esc(a.label)}</a>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(view.title)} · 骰子局</title>
<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;padding:40px 16px;background:#F3F0E8;color:#243B32;
font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
display:flex;justify-content:center;align-items:flex-start;min-height:100vh}
.card{width:100%;max-width:520px;background:#FFFDF7;border:1px solid #E2DCCB;
border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(36,59,50,.08)}
.brand{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#B58B4C;margin-bottom:10px}
h1{font-family:Georgia,"Songti SC",serif;font-size:22px;margin:0 0 8px;color:${toneColor[view.tone]}}
.sum{font-size:14px;line-height:1.7;margin:0 0 20px;color:#3C4F46}
ul{list-style:none;margin:0 0 22px;padding:16px;background:#F7F4EA;border-radius:12px;font-size:14px}
li{display:flex;align-items:baseline;gap:10px;padding:5px 0}
.mark{font-weight:700;width:14px;flex:none}
.note{margin-left:auto;font-size:12px;color:#8A8577;padding-left:12px}
.btns{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-block;padding:10px 16px;border:1px solid #C9C2AE;border-radius:10px;
font-size:14px;text-decoration:none;color:#243B32;background:#FFFDF7}
.btn-primary{background:#243B32;border-color:#243B32;color:#F3F0E8;font-weight:600}
.foot{margin-top:20px;font-size:12px;color:#8A8577;line-height:1.6}
</style></head>
<body><div class="card">
<div class="brand">DiceMeet · 冒险者公会</div>
<h1>${esc(view.title)}</h1>
<p class="sum">${esc(view.summary)}</p>
<ul>${checks}</ul>
<div class="btns">${actions}</div>
<p class="foot">本页面只确认邮箱验证与档案建立状态，不显示任何令牌、密钥或底层错误详情。</p>
</div></body></html>`;
}

function html(view: View): NextResponse {
  return new NextResponse(render(view), {
    status: view.status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

const SESSION_CHECK: { label: string; state: CheckState; note?: string }[] = [
  { label: "邮箱已确认", state: "pass" },
  { label: "Cookie Session 已建立", state: "pass", note: "服务端已校验" },
];

function profileChecks(username: string, created: boolean) {
  return created
    ? { label: `档案已创建（用户名 ${username}）`, state: "pass" as CheckState }
    : { label: "档案已存在，无需重复创建", state: "pass" as CheckState };
}

function bootstrapView(
  bootstrap: ProfileBootstrap,
  retryHref: string
): View {
  if (bootstrap.status === "ready") {
    return {
      tone: "ok",
      status: 200,
      title: "邮箱验证完成，档案就绪",
      summary: "公会已经记住你了。现在可以浏览大厅，登录态会在后续操作中自动使用。",
      checks: [...SESSION_CHECK, profileChecks(bootstrap.username, bootstrap.created)],
      actions: [
        { href: "/sessions", label: "前往跑团大厅", primary: true },
        { href: "/create", label: "发布一个跑团" },
      ],
    };
  }

  if (bootstrap.status === "username-taken") {
    return {
      tone: "warn",
      status: 200,
      title: "邮箱已确认，但档案没能建立",
      summary: `用户名「${bootstrap.username}」已被其他冒险者占用。我们不会自动改写你选择的用户名。`,
      checks: [
        ...SESSION_CHECK,
        { label: "档案未创建：用户名冲突", state: "fail" },
      ],
      actions: [
        { href: "/sessions", label: "先去浏览大厅", primary: true },
        { href: "/register", label: "用新邮箱重新注册" },
      ],
    };
  }

  return {
    tone: "bad",
    status: 500,
    title: "邮箱已确认，但档案没能建立",
    summary:
      bootstrap.status === "invalid-metadata"
        ? bootstrap.message
        : "档案写入没有成功。",
    checks: [
      ...SESSION_CHECK,
      { label: "档案未创建", state: "fail" },
    ],
    actions: [
      { href: retryHref, label: "重试建立档案", primary: true },
      { href: "/sessions", label: "先去浏览大厅" },
    ],
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const retryProfile = url.searchParams.get("retry") === "profile";
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const supabase = createServerSupabase();

  const invalidLinkView = (title: string, summary: string, note?: string): View => ({
    tone: "bad",
    status: 400,
    title,
    summary,
    checks: [
      { label: "邮箱确认未完成", state: "fail", note },
      { label: "Cookie Session 未建立", state: "fail" },
      { label: "档案未创建", state: "pending" },
    ],
    actions: [
      { href: "/register", label: "回到注册页重新提交", primary: true },
      { href: "/sessions", label: "先去浏览大厅" },
    ],
  });

  if (providerError) {
    return html(
      invalidLinkView(
        "确认链接被服务端拒绝",
        `Supabase 返回：${providerError}`,
        providerError
      )
    );
  }

  // 恢复入口：邮箱已确认、Cookie 里有有效 Session 时，可以不带 code 重新走一次档案建立。
  if (retryProfile) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return html(
        invalidLinkView(
          "当前没有有效登录态",
          "重试建立档案需要已确认邮箱的有效 Session。请重新注册，或等登录功能接入后重新登录。"
        )
      );
    }
    return html(bootstrapView(await ensureProfileForUser(supabase, user), url.pathname + "?retry=profile"));
  }

  if (!code) {
    const legacy = url.searchParams.has("token_hash") || url.searchParams.has("confirmation_token");
    return html(
      legacy
        ? invalidLinkView(
            "确认邮件用的是旧链接格式",
            "这封邮件的链接里没有新版授权码，服务端当前只支持新版 code 交换。需要在 Dashboard 确认邮箱模板的链接变量，我不会擅自改动 Dashboard 配置。",
            "legacy-link"
          )
        : invalidLinkView(
            "确认链接无效",
            "链接里没有授权码，可能已被使用过、已过期，或不是本项目的确认链接。",
            "no-code"
          )
    );
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return html(
      invalidLinkView(
        "确认失败：链接已过期或被使用过",
        "授权码无法换成会话。回到注册页重新提交一次，会收到一封新的确认邮件。请确认在新邮件里点击，并保证用同一个浏览器打开。",
        "exchange-failed"
      )
    );
  }

  // 交换成功不等于 Cookie Session 可用：再向服务端要一次用户，作为 SSR Session 的真实证据。
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();
  if (getUserError || !user) {
    return html(
      invalidLinkView(
        "确认邮件已通过，但服务端会话没建立",
        "邮箱确认本身成功了，服务端却读不到有效会话，通常是浏览器 Cookie 被拦截或 SameSite 限制。请换用发起注册的同一个浏览器重试。",
        "session-missing"
      )
    );
  }

  const bootstrap = await ensureProfileForUser(supabase, user);
  return html(bootstrapView(bootstrap, url.pathname + "?retry=profile"));
}
