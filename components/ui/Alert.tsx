import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

const config: Record<AlertVariant, { cls: string; icon: string }> = {
  info: { cls: "bg-primary/5 border-primary/20 text-primary", icon: "ℹ️" },
  success: { cls: "bg-green-50 border-green-200 text-green-800", icon: "✅" },
  warning: { cls: "bg-amber-50 border-amber-200 text-amber-800", icon: "⚠️" },
  error: { cls: "bg-red-50 border-red-200 text-red-800", icon: "⛔" },
};

export function Alert({
  variant = "info",
  title,
  children,
  className = "",
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const c = config[variant];
  return (
    <div className={`flex gap-3 border rounded-xl p-4 ${c.cls} ${className}`} role="alert">
      <span className="text-lg leading-none">{c.icon}</span>
      <div className="text-sm">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
}
