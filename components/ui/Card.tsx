import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: ReactNode;
}

export function Card({ hover = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-card ${
        hover ? "transition duration-200 hover:shadow-card-hover hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionProps {
  className?: string;
  children: ReactNode;
}

export function CardHeader({ className = "", children }: SectionProps) {
  return <div className={`p-6 pb-0 ${className}`}>{children}</div>;
}

export function CardTitle({ className = "", children }: SectionProps) {
  return (
    <h3 className={`text-xl font-serif font-semibold text-primary ${className}`}>{children}</h3>
  );
}

export function CardDescription({ className = "", children }: SectionProps) {
  return <p className={`text-sm text-muted mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ className = "", children }: SectionProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }: SectionProps) {
  return <div className={`p-6 pt-0 flex items-center gap-3 ${className}`}>{children}</div>;
}
