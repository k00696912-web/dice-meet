"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button, Card, CardContent, Input, Textarea, Select, FormField, Alert, H1 } from "@/components/ui";
import type { VoiceOrText } from "@/lib/types";

const TAG_OPTIONS = ["长期团", "中期团", "短团", "硬核", "AI NPC"];

export default function CreateSessionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    system: "D&D 5e",
    style: "严肃剧情",
    time_schedule: "",
    max_players: 5,
    description: "",
    voice_or_text: "voice" as VoiceOrText,
    beginner_friendly: false,
    tags: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      router.push(`/sessions/${json.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link href="/sessions" className="text-accent hover:text-accent-600 text-sm">
        ← 返回跑团大厅
      </Link>
      <H1 className="text-3xl sm:text-4xl mb-8 mt-4">📝 发布跑团</H1>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="跑团名称" required htmlFor="title">
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：被遗忘的国度：初探"
                required
              />
            </FormField>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="跑团系统" required htmlFor="system">
                <Select
                  id="system"
                  value={formData.system}
                  onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                >
                  {["D&D 5e", "COC 7th", "Cyberpunk RED", "泛用无界", "其他"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="跑团风格" required htmlFor="style">
                <Select
                  id="style"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                >
                  {["严肃剧情", "轻松搞笑", "硬核战斗", "恐怖悬疑", "自由探索"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="跑团时间" required htmlFor="time">
                <Input
                  id="time"
                  value={formData.time_schedule}
                  onChange={(e) => setFormData({ ...formData, time_schedule: e.target.value })}
                  placeholder="例如：每周六 20:00"
                  required
                />
              </FormField>

              <FormField label="最大人数" required htmlFor="max">
                <Input
                  id="max"
                  type="number"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                  min="2"
                  max="10"
                  required
                />
              </FormField>
            </div>

            <FormField label="跑团方式" required>
              <div className="flex gap-4">
                {[
                  { label: "语音", value: "voice" },
                  { label: "文字", value: "text" },
                  { label: "线下", value: "offline" },
                ].map((m) => (
                  <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="voice_or_text"
                      checked={formData.voice_or_text === m.value}
                      onChange={() => setFormData({ ...formData, voice_or_text: m.value as VoiceOrText })}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-foreground">{m.label}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="跑团描述" required htmlFor="desc">
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="描述你的跑团背景、规则、期望..."
                required
              />
            </FormField>

            <FormField label="标签">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.beginner_friendly}
                    onChange={(e) => setFormData({ ...formData, beginner_friendly: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span className="text-foreground">新手友好</span>
                </label>
                {TAG_OPTIONS.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, tags: [...formData.tags, tag] });
                        } else {
                          setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
                        }
                      }}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span className="text-foreground">{tag}</span>
                  </label>
                ))}
              </div>
            </FormField>

            {error && <Alert variant="warning">{error}</Alert>}

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "发布中..." : "发布跑团"}
              </Button>
              <Button href="/sessions" variant="outline">取消</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
