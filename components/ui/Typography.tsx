import type { ReactNode } from "react";

interface TypeProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className = "" }: TypeProps) {
  return (
    <h1 className={`font-serif text-4xl sm:text-5xl font-bold text-primary text-balance ${className}`}>
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: TypeProps) {
  return (
    <h2 className={`font-serif text-3xl font-bold text-primary text-balance ${className}`}>
      {children}
    </h2>
  );
}

export function H3({ children, className = "" }: TypeProps) {
  return (
    <h3 className={`font-serif text-2xl font-semibold text-primary ${className}`}>{children}</h3>
  );
}

export function H4({ children, className = "" }: TypeProps) {
  return (
    <h4 className={`font-serif text-xl font-semibold text-primary ${className}`}>{children}</h4>
  );
}

export function Lead({ children, className = "" }: TypeProps) {
  return <p className={`text-lg text-muted text-balance ${className}`}>{children}</p>;
}

export function P({ children, className = "" }: TypeProps) {
  return <p className={`text-foreground leading-relaxed ${className}`}>{children}</p>;
}

export function Muted({ children, className = "" }: TypeProps) {
  return <p className={`text-sm text-muted ${className}`}>{children}</p>;
}
