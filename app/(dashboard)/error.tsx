"use client";

import { useEffect } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error-boundary] 未捕获异常:", error);
  }, [error]);

  const code = error.digest;

  return (
    <Card className="w-full max-w-xl">
      <CardContent className="p-8 sm:p-10">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
          <Icon name="scroll" className="w-3.5 h-3.5" />
          冒险者公会 · 公会账房
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          这一页暂时打不开
        </h1>
        <p className="text-muted text-base mt-3 leading-relaxed">
          页面上的数据没能正常加载。我们已经记下这次故障，你的任何内容都不会因此被清除或修改，
          左侧的公会导航仍然可用。
        </p>

        <div className="flex flex-wrap gap-3 mt-7">
          <Button onClick={reset}>
            <Icon name="compass" className="w-4 h-4" />
            重试加载
          </Button>
          <Button href="/sessions" variant="outline">
            <Icon name="scroll" className="w-4 h-4" />
            进入跑团大厅
          </Button>
          <Button href="/" variant="ghost">
            返回首页
          </Button>
        </div>

        {code ? (
          <p className="text-xs text-muted/70 mt-6">
            故障编号 <span className="font-mono tabular-nums">{code}</span>
            ，反馈时附上可帮助我们定位。
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
