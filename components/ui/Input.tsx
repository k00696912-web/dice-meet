import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

const fieldBase =
  "w-full bg-card border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted/60 transition focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${fieldBase} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function FormField({
  label,
  required,
  error,
  help,
  htmlFor,
  children,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  help?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-primary mb-1.5">
          {label}
          {required && <span className="text-accent ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      ) : help ? (
        <p className="text-sm text-muted mt-1">{help}</p>
      ) : null}
    </div>
  );
}
