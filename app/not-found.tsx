import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { Icon } from "@/components/dashboard/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-16">
      <Card className="w-full max-w-xl">
        <CardContent className="p-8 sm:p-10">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-600 mb-3">
            <Icon name="compass" className="w-3.5 h-3.5" />
            冒险者公会 · 未探明的区域
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            页面不存在
          </h1>
          <p className="text-muted text-base mt-3 leading-relaxed">
            公会档案里没有这条路径。可能是链接过期、地址输错，或者那个入口本来就还没开放。
            你可以通过下面的入口回到有委托的地方。
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Button href="/">
              <Icon name="shield" className="w-4 h-4" />
              返回首页
            </Button>
            <Button href="/sessions" variant="outline">
              <Icon name="scroll" className="w-4 h-4" />
              进入跑团大厅
            </Button>
          </div>

          <p className="text-xs text-muted/70 mt-6 leading-relaxed">
            想发布新的招募委托？
            <Link
              href="/create"
              className="text-accent-600 hover:text-accent-700 ml-1 underline underline-offset-4"
            >
              去发布招募
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
