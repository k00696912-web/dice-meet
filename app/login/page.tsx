import Link from "next/link";
import { Card, CardContent, Button, H1 } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-md">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-5xl mb-4">🎲</div>
          <H1 className="text-2xl mb-2">登录骰子局</H1>
          <p className="text-muted mb-6">用户系统正在开发中，注册 / 登录即将上线。</p>

          <div className="space-y-3 opacity-50 pointer-events-none select-none text-left">
            <div>
              <label className="block text-sm text-primary mb-1">邮箱</label>
              <div className="w-full bg-primary/5 border border-border rounded-lg px-4 py-2.5 text-muted">
                you@example.com
              </div>
            </div>
            <div>
              <label className="block text-sm text-primary mb-1">密码</label>
              <div className="w-full bg-primary/5 border border-border rounded-lg px-4 py-2.5 text-muted">
                ••••••••
              </div>
            </div>
            <div className="bg-primary text-white text-center font-medium rounded-lg py-2.5">
              登录 / 注册
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button href="/sessions" variant="ghost" size="sm">
              先去逛逛跑团大厅 →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
