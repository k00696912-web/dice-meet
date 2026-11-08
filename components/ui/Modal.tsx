"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-card-hover w-full max-w-lg max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between gap-4 p-6 border-b border-border">
          {title && (
            <h3 className="text-xl font-serif font-semibold text-primary">{title}</h3>
          )}
          <button
            onClick={onClose}
            aria-label="关闭"
            className="ml-auto text-muted hover:text-primary transition text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6 text-foreground">{children}</div>
        {footer && (
          <div className="p-6 pt-0 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
