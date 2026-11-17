import DashboardShell from "@/components/dashboard/DashboardShell";
import { getServerIdentity } from "@/lib/auth-session";

// 身份在服务端布局一次取好（Cookie → getUser → 档案最小字段），
// 再作为普通对象传给客户端菜单；令牌始终留在服务端，不进客户端。
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const identity = await getServerIdentity();
  return <DashboardShell identity={identity}>{children}</DashboardShell>;
}
