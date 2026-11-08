import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "primary" | "accent" | "success" | "warning" | "danger";

const styles: Record<BadgeVariant, string> = {
  neutral: "bg-primary/5 text-primary/70 border-primary/10",
  primary: "bg-primary/10 text-primary border-primary/15",
  accent: "bg-accent/10 text-accent-700 border-accent/20",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
