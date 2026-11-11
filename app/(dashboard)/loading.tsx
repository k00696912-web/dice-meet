import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div aria-busy="true">
      <p className="sr-only">页面加载中</p>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Skeleton className="h-3.5 w-36 rounded mb-3" />
          <Skeleton className="h-8 w-56 rounded-lg mb-2.5" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SkeletonCircle size="md" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
