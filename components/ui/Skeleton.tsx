import type { HTMLAttributes } from "react";

const pulse = "animate-pulse motion-reduce:animate-none bg-primary/10";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={`${pulse} rounded-md ${className}`} {...props} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`${pulse} h-4 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

type CircleSize = "sm" | "md" | "lg";

const circleSizes: Record<CircleSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

export function SkeletonCircle({ size = "md", className = "" }: { size?: CircleSize; className?: string }) {
  return <div aria-hidden="true" className={`${pulse} rounded-full ${circleSizes[size]} ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`bg-card border border-border rounded-xl shadow-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <Skeleton className="h-6 w-2/3 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      </div>
      <SkeletonText lines={4} className="mb-5" />
      <div className="flex gap-1.5 mb-5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}