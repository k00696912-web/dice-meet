import Link from "next/link";
import { Card, CardContent, Badge } from "@/components/ui";
import { Icon, type IconName } from "./icons";
import type { Session } from "@/lib/types";

const MODE_LABEL: Record<string, string> = { voice: "语音", text: "文字", offline: "线下" };

function Meta({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="w-4 h-4 text-muted/70" />
      <span className="truncate">{children}</span>
    </div>
  );
}

export default function CommissionCard({ session }: { session: Session }) {
  const full = session.current_players >= session.max_players;
  const recruiting = session.status === "recruiting";
  const fillRatio = Math.min(100, Math.round((session.current_players / session.max_players) * 100));

  return (
    <Link href={`/sessions/${session.id}`} className="block group h-full">
      <Card hover className="h-full overflow-hidden flex flex-col">
        {/* 委托抬头 */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-primary/[0.03]">
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent-700">
            <Icon name="scroll" className="w-4 h-4" />
            冒险委托
          </span>
          <Badge variant={recruiting ? "success" : "primary"}>
            {recruiting ? "招募中" : "进行中"}
          </Badge>
        </div>

        <CardContent className="p-5 flex-1 flex flex-col">
          <h3 className="font-serif font-semibold text-primary text-lg leading-snug mb-3 group-hover:text-accent-700 transition">
            {session.title}
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge variant="primary">{session.system}</Badge>
            <Badge variant="neutral">{session.style}</Badge>
            {session.beginner_friendly && <Badge variant="success">新手友好</Badge>}
          </div>

          <div className="space-y-2 text-sm text-muted mb-4">
            <Meta icon="clock">{session.time_schedule}</Meta>
            <Meta icon="dice">DM {session.dm?.display_name ?? "未知"}</Meta>
            <Meta icon="users">
              {session.current_players}/{session.max_players} 名冒险者 · {MODE_LABEL[session.voice_or_text] ?? "语音"}
            </Meta>
          </div>

          {/* 名额进度 */}
          <div className="mb-4">
            <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${full ? "bg-muted/50" : "bg-accent"}`}
                style={{ width: `${fillRatio}%` }}
              />
            </div>
          </div>

          {session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {session.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant={tag === "AI NPC" ? "accent" : "neutral"}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div
            className={`mt-auto w-full py-2 rounded-lg font-medium text-center text-sm transition ${
              full
                ? "bg-primary/5 text-muted"
                : "bg-primary text-white group-hover:bg-primary-600"
            }`}
          >
            {full ? "名额已满" : "接受委托 →"}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}