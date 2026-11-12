import { notFound } from "next/navigation";
import DbProbe from "./DbProbe";

// 门禁必须放在服务端渲染阶段：一旦 notFound()，客户端探测组件不会被挂载，
// 生产包里即使残留着探测 chunk 也永远不会执行到 supabase 查询。
export default function TestDBPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DbProbe />;
}
