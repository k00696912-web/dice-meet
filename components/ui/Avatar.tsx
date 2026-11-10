"use client";

import { useState } from "react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const dotClasses: Record<AvatarSize, string> = {
  sm: "w-2 h-2 border",
  md: "w-2.5 h-2.5 border-2",
  lg: "w-3 h-3 border-2",
  xl: "w-4 h-4 border-2",
};

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

export function Avatar({ src, name, size = "md", online = false, className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`flex items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary font-semibold border border-border select-none ${sizeClasses[size]}`}
        role={showImage ? undefined : "img"}
        aria-label={showImage ? undefined : name}
      >
        {showImage ? (
          // 头像域名未配置 next/image remotePatterns，使用原生 img 以兼容任意来源
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src as string}
            alt={name}
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </span>
      {online && (
        <span
          aria-label="在线"
          className={`absolute bottom-0 right-0 rounded-full bg-green-500 border-card ${dotClasses[size]}`}
        />
      )}
    </span>
  );
}