import type { ReactNode } from "react";

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center py-12 px-6 ${className}`}>
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 text-muted/50 mb-5">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-semibold text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-muted text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action && <div className="flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}