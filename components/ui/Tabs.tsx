"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  key: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ items, defaultKey, activeKey, onChange, className = "" }: TabsProps) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [internal, setInternal] = useState(
    () => defaultKey ?? items.find((i) => !i.disabled)?.key ?? ""
  );
  const current = activeKey ?? internal;
  const activeItem = items.find((i) => i.key === current);

  const select = (key: string) => {
    setInternal(key);
    onChange?.(key);
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    let j = index;
    for (let step = 0; step < items.length; step++) {
      j = (j + dir + items.length) % items.length;
      if (!items[j].disabled) {
        select(items[j].key);
        refs.current[j]?.focus();
        break;
      }
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-orientation="horizontal" className="flex flex-wrap gap-1 border-b border-border pb-2">
        {items.map((item, i) => (
          <button
            key={item.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.key}`}
            aria-selected={item.key === current}
            aria-controls={`${id}-panel-${item.key}`}
            disabled={item.disabled}
            tabIndex={item.key === current ? 0 : -1}
            onClick={() => select(item.key)}
            onKeyDown={(e) => handleKey(e, i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              item.key === current
                ? "bg-primary text-white shadow-sm"
                : item.disabled
                  ? "text-muted/50 cursor-not-allowed"
                  : "text-muted hover:text-primary hover:bg-primary/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem?.content != null && (
        <div
          role="tabpanel"
          id={`${id}-panel-${current}`}
          aria-labelledby={`${id}-tab-${current}`}
          className="pt-4"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}