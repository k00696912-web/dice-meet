import Link from "next/link";
import { Button, Card, CardContent, Badge, H1, H2, Lead, Muted, buttonClasses } from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import CommissionCard from "@/components/dashboard/CommissionCard";
import { getPublicClient } from "@/lib/supabase-server";
import type { Session } from "@/lib/types";

export const dynamic = "force-dynamic";

const DM_EMBED =
  "dm:profiles!sessions_dm_id_fkey(id, username, display_name, avatar_url, role, rating, attendance_rate)";

interface BoardResult {
  sessions: Session[];
  failed: boolean;
}

// 查询失败与「查询成功但没有委托」必须分开：否则数据库故障会被伪装成空公告板
async function getLatestSessions(): Promise<BoardResult> {
  const supabase = getPublicClient();
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select(`*, ${DM_EMBED}`)
      .in("status", ["recruiting", "ongoing"])
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("[home] 公告板委托读取失败:", error.code, error.message);
      return { sessions: [], failed: true };
    }
    return { sessions: (data ?? []) as Session[], failed: false };
  } catch (err) {
    console.error("[home] 公告板请求异常:", err);
    return { sessions: [], failed: true };
  }
}

export default async function Home() {
  const { sessions, failed } = await getLatestSessions();

  return (
    <div>
      {/* 欢迎横幅 */}
      <Card className="relative overflow-hidden border-accent/30 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.10] pointer-events-none" />
        <div className="absolute -right-8 -top-10 text-[11rem] leading-none opacity-[0.05] select-none pointer-events-none">
          🎲
        </div>
        <CardContent className="relative p-8 sm:p-10">
          <Badge variant="accent" className="mb-5 px-3 py-1">
            <Icon name="shield" className="w-3.5 h-3.5" /> 冒险者公会 · 公告板
          </Badge>
          <H1 className="text-3xl sm:text-4xl mb-4">
            欢迎回到公会，<span className="text-accent">冒险者</span>
          </H1>
          <Lead className="max-w-2xl mb-7">
            缺 DM？凑不齐人？在这里浏览公会发布的跑团委托，或发布你自己的招募——
            还有 AI 伴随 NPC 随时补位，让开团不再等待。
          </Lead>
          <div className="flex flex-wrap gap-3">
            <Button href="/sessions" size="lg">
              <Icon name="compass" /> 浏览委托
            </Button>
            <Button href="/create" variant="outline" size="lg">
              <Icon name="megaphone" /> 发布招募
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        <QuickCard
          icon="compass"
          title="跑团大厅"
          description="按系统、风格、时间筛选公会委托，找到合拍的那一桌。"
          href="/sessions"
        />
        <QuickCard
          icon="megaphone"
          title="发布招募"
          description="以 DM 之名发布跑团委托，等待冒险者接受申请。"
          href="/create"
        />
        <QuickCard
          icon="bot"
          title="AI 伴随 NPC"
          description="缺人时由智能角色补位，有性格、有动机、受 DM 约束。"
          href="#ai-npc"
          accent
        />
      </div>

      {/* 公会公告板 */}
      <section className="mb-10">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <H2 className="text-2xl flex items-center gap-2">
              <Icon name="scroll" className="text-accent-600" /> 公会公告板
            </H2>
            <Muted className="mt-1">最新发布的跑团委托，等待冒险者接受</Muted>
          </div>
          <Button href="/sessions" variant="ghost" size="sm">
            查看全部 <Icon name="arrow-right" className="w-4 h-4" />
          </Button>
        </div>

        {failed ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="flex justify-center mb-4 text-muted/40">
                <Icon name="scroll" className="w-12 h-12" />
              </div>
              <p className="text-muted mb-2">公告板暂时读不到委托。</p>
              <p className="text-sm text-muted/80 mb-6">
                可能是网络波动或公会服务正在维护，稍后重试即可；上面的快捷入口不受影响。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="/" className={buttonClasses("primary", "md")}>
                  <Icon name="compass" className="w-4 h-4" /> 重新加载公告板
                </a>
                <Button href="/create" variant="outline">
                  <Icon name="megaphone" className="w-4 h-4" /> 去发布招募
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : sessions.length > 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {sessions.map((session) => (
              <CommissionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <div className="flex justify-center mb-4 text-muted/40">
                <Icon name="scroll" className="w-12 h-12" />
              </div>
              <p className="text-muted mb-5">公告板上还没有委托，成为第一个发布招募的 DM 吧。</p>
              <Button href="/create" variant="outline">
                <Icon name="megaphone" className="w-4 h-4" /> 发布第一个跑团
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* AI NPC 亮点 */}
      <section id="ai-npc" className="scroll-mt-24">
        <Card className="relative overflow-hidden bg-primary border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent pointer-events-none" />
          <Icon
            name="bot"
            className="absolute -right-6 -bottom-8 w-52 h-52 text-white/[0.06]"
          />
          <CardContent className="relative p-8 sm:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <Badge variant="accent" className="mb-4">✨ 核心亮点</Badge>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 text-balance">
                AI 伴随 NPC，缺人也能开团
              </h2>
              <p className="text-white/70 max-w-xl leading-relaxed">
                由 AI 主控的 NPC 角色补位你的队伍：有性格、有动机、受 DM 约束。
                新手引导、单人跑团、临时缺人，都能随时补上——这是骰子局与众不同的地方。
              </p>
            </div>
            <div className="flex flex-col gap-3 md:w-56">
              <Button href="/npcs" variant="accent">
                <Icon name="bot" className="w-4 h-4" /> 配置我的 NPC
              </Button>
              <Button
                href="/sessions"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                看看哪些团在用 <Icon name="arrow-right" className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  description,
  href,
  accent = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="block group h-full">
      <Card hover className={`h-full ${accent ? "border-accent/40" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <span
              className={`flex items-center justify-center w-11 h-11 rounded-xl ${
                accent ? "bg-accent/15 text-accent-700" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon name={icon} className="w-6 h-6" />
            </span>
            <Icon
              name="arrow-right"
              className="w-5 h-5 text-muted/40 group-hover:text-accent group-hover:translate-x-0.5 transition"
            />
          </div>
          <h3 className="font-serif font-semibold text-primary text-lg mb-1.5">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}