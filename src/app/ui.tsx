import type { ReactNode } from "react";

// Icons are the simple strokes from the design source (design/redesign/*.dc.html).
const PATHS = {
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  down: <path d="M12 3v18M5 14l7 7 7-7" />,
  play: <path d="M7 4v16l13-8z" />,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  train: <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />,
  progress: <path d="M4 19h16M7 15l4-4 3 3 5-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  you: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>),
  back: <path d="M15 18l-6-6 6-6" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  video: (<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9l5 3-5 3z" /></>),
  timer: (<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></>),
  x: <path d="M6 6l12 12M18 6L6 18" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, strokeWidth = 2, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[name]}
    </svg>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-surface border border-line rounded-[18px] ${className}`}>{children}</div>;
}

export function ScreenTitle({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish">{title}</h1>
        {sub && <span className="text-[13px] text-muted">{sub}</span>}
      </div>
      {right}
    </div>
  );
}

export type Tab = "today" | "train" | "progress" | "habits" | "you";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "today", label: "Today", icon: "home" },
  { id: "train", label: "Train", icon: "train" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "habits", label: "Habits", icon: "check" },
  { id: "you", label: "You", icon: "you" },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav aria-label="Main" className="grid grid-cols-5 px-2 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] bg-surface border-t border-line">
      {TABS.map((t) => {
        const active = t.id === tab;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-1.5 min-h-[44px] text-[11px] ${active ? "text-ink font-semibold" : "text-muted-nav font-medium"}`}>
            <Icon name={t.icon} size={22} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Thin progress bar used across cards. */
export function Bar({ pct, height = 6, track = "bg-hairline" }: { pct: number; height?: number; track?: string }) {
  return (
    <div className={`${track} overflow-hidden`} style={{ height, borderRadius: height / 2 }}>
      <div className="bg-ink" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height }} />
    </div>
  );
}
