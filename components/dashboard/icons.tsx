import type { SVGProps } from "react";

export type IconName =
  | "compass"
  | "sparkles"
  | "bookmark"
  | "swords"
  | "inbox"
  | "bell"
  | "megaphone"
  | "dice"
  | "bot"
  | "settings"
  | "search"
  | "plus"
  | "menu"
  | "close"
  | "chevron-down"
  | "scroll"
  | "users"
  | "shield"
  | "arrow-right"
  | "clock"
  | "eye"
  | "eye-off";

const paths: Record<IconName, React.ReactNode> = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
      <path d="M18 15l.7 1.8L20.5 17.5l-1.8.7L18 20l-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1z" />,
  swords: (
    <>
      <path d="M5 5l9 9M14.5 14.5 19 19M14 19l5-5M19 14l-1.5 4.5L13 20" />
      <path d="M19 5l-9 9M9.5 14.5 5 19M10 19l-5-5M5 14l1.5 4.5L11 20" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13l2.5-7.5A1 1 0 0 1 7.5 5h9a1 1 0 0 1 1 .5L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path d="M18 8a4 4 0 0 1 0 8M7 15v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  bot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 8V5M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 16.5h5M2.5 12v3M21.5 12v3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5l1.2 2.6 2.8-.6 1 2.7 2.6 1.2-.6 2.8 2 2.1-2 2.1.6 2.8-2.6 1.2-1 2.7-2.8-.6L12 21.5l-1.2-2.6-2.8.6-1-2.7-2.6-1.2.6-2.8-2-2.1 2-2.1-.6-2.8 2.6-1.2 1-2.7 2.8.6z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  scroll: (
    <>
      <path d="M7 4h11a2 2 0 0 1 2 2v1h-3" />
      <path d="M17 4a2 2 0 0 0-2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h9" />
      <path d="M9 8h5M9 11h5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5.5 5.5 0 0 1 3.5 5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9.5 12l1.8 1.8 3.2-3.6" />
    </>
  ),
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M9.9 5.7A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.2 6.9A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, className = "", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-5 h-5 shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}