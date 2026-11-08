"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, Badge, Alert, H1 } from "@/components/ui";
import type { Session } from "@/lib/types";

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "加载失败");
        setSession(json.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-muted">加载中...</div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl">
        <Alert variant="error" title="加载失败">{error ?? "跑团不存在"}</Alert>
        <div className="text-center mt-6">
          <Link href="/sessions" className="text-accent hover:text-accent-600">← 返回跑团大厅</Link>
        </div>
      </div>
    );
  }

  const modeLabel =
    session.voice_or_text === "voice" ? "语音" : session.voice_or_text === "text" ? "文字" : "线下";
  const full = session.current_players >= session.max_players;

  return (
    <div className="max-w-3xl">
      <Link href="/sessions" className="text-accent hover:text-accent-600 text-sm">
        ← 返回跑团大厅
      </Link>

      <Card className="mt-4">
        <CardContent className="p-8">
          <div className="flex justify-between items-start gap-4 mb-6">
            <H1 className="text-3xl">{session.title}</H1>
            <Badge variant={session.status === "recruiting" ? "success" : "primary"}>
              {session.status === "recruiting" ? "招募中" : "进行中"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="primary">{session.system}</Badge>
            {session.beginner_friendly && <Badge variant="success">新手友好</Badge>}
            {session.tags
              .filter((tag) => tag !== "新手友好")
              .map((tag) => (
                <Badge key={tag} variant={tag === "AI NPC" ? "accent" : "neutral"}>{tag}</Badge>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoItem label="🎭 风格" value={session.style} />
            <InfoItem label="⏰ 时间" value={session.time_schedule} />
            <InfoItem label="👥 人数" value={`${session.current_players}/${session.max_players}`} />
            <InfoItem label="🎙️ 方式" value={modeLabel} />
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-serif font-semibold text-primary mb-2">跑团简介</h2>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {session.description}
            </p>
          </div>

          {session.dm && (
            <div className="bg-primary/5 border border-border rounded-xl p-4 mb-6">
              <h2 className="text-lg font-serif font-semibold text-primary mb-3">🎲 关于 DM</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-serif">
                  {session.dm.display_name.charAt(0)}
                </div>
                <div>
                  <div className="text-primary font-medium">{session.dm.display_name}</div>
                  <div className="text-sm text-muted">
                    ⭐ {session.dm.rating.toFixed(1)} · 出勤率 {session.dm.attendance_rate}%
                  </div>
                </div>
              </div>
              {session.dm.bio && <p className="text-muted text-sm mt-3">{session.dm.bio}</p>}
            </div>
          )}

          <Button
            disabled={full}
            className="w-full"
            size="lg"
            onClick={() => alert("申请加入功能将在用户系统上线后开放")}
          >
            {full ? "人数已满" : "申请加入"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-primary/5 rounded-lg px-4 py-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-primary font-medium">{value}</div>
    </div>
  );
}
