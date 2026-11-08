"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, Alert, H1 } from "@/components/ui";

export default function TestDBPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase.from("sessions").select("id").limit(1);
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("success");
        setMessage("数据库连接成功，sessions 表可读取。");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "未知错误");
      }
    }
    testConnection();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <H1 className="text-3xl mb-8">🔌 数据库连接测试</H1>
      <Card>
        <CardContent>
          {status === "loading" && <p className="text-muted text-center py-8">正在连接数据库...</p>}
          {status === "success" && (
            <Alert variant="success" title="连接成功">{message}</Alert>
          )}
          {status === "error" && (
            <Alert variant="error" title="连接失败">{message}</Alert>
          )}
          <div className="mt-6 text-center">
            <Link href="/" className="text-accent hover:text-accent-600 text-sm">← 返回首页</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
