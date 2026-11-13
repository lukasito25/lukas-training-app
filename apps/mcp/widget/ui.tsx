import { createContext, type ComponentChildren } from "preact";
import { useContext, useState } from "preact/hooks";
import { host } from "./host";
import type { ViewData } from "./types";

export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/** App-wide actions: navigate to a new view, call tools with a busy flag + error toast. */
export interface Nav {
  show: (d: ViewData) => void;
  back: (() => void) | null;
  /** Calls a tool; on success shows its view (unless keep=true) and returns the data. */
  run: (name: string, args?: Record<string, unknown>, opts?: { keep?: boolean }) => Promise<Record<string, unknown> | null>;
  busy: string | null;
  error: (msg: string) => void;
}
export const NavCtx = createContext<Nav>(null as unknown as Nav);
export const useNav = () => useContext(NavCtx);

export function Icon({ name, size = 16 }: { name: "expand" | "chev" | "back" | "ext" | "undo" | "check"; size?: number }) {
  const d = {
    expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
    chev: "M9 6l6 6-6 6",
    back: "M15 6l-6 6 6 6",
    ext: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    undo: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
    check: "M5 12l5 5 9-10",
  }[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Chip({ on, onClick, children, label, tall }: { on?: boolean; onClick: () => void; children: ComponentChildren; label?: string; tall?: boolean }) {
  return (
    <button type="button" class={`chip${tall ? " tall" : ""}`} aria-pressed={on ? "true" : "false"} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function Stepper({ label, value, step, min = 0, max = 1000, unit, onChange }: {
  label: string; value: number | null; step: number; min?: number; max?: number; unit?: string; onChange: (v: number | null) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  const bump = (dir: 1 | -1) => {
    setText(null);
    onChange(clamp((value ?? 0) + dir * step));
  };
  return (
    <div class="stepper">
      <span class="label">{label}</span>
      <div class="stepper-box">
        <button type="button" aria-label={`Less ${label}`} onClick={() => bump(-1)}>−</button>
        <input
          inputMode="decimal" aria-label={label} placeholder={unit === "kg" ? "kg" : "–"}
          value={text ?? (value == null ? "" : fmt(value))}
          onInput={(e) => {
            const t = (e.target as HTMLInputElement).value.replace(",", ".");
            setText(t);
            const n = Number(t);
            onChange(t.trim() === "" || Number.isNaN(n) ? null : clamp(n));
          }}
          onBlur={() => setText(null)}
        />
        <button type="button" aria-label={`More ${label}`} onClick={() => bump(1)}>+</button>
      </div>
    </div>
  );
}

export function Btn({ kind = "", onClick, children, busyKey, disabled, label, class: cls = "" }: {
  kind?: string; onClick: () => void; children: ComponentChildren; busyKey?: string; disabled?: boolean; label?: string; class?: string;
}) {
  const nav = useNav();
  const busy = busyKey != null && nav.busy === busyKey;
  return (
    <button type="button" class={`btn ${kind} ${cls}`} aria-label={label} disabled={disabled || nav.busy != null} aria-busy={busy} onClick={onClick}>
      {busy ? "…" : children}
    </button>
  );
}

/** Sends a chat message through the host (hidden when the host can't). */
export function Ask({ text, children, kind = "ghost small" }: { text: string; children: ComponentChildren; kind?: string }) {
  const nav = useNav();
  if (!host.can.message()) return null;
  return (
    <button type="button" class={`btn ${kind}`} onClick={() => host.say(text).catch((e) => nav.error(e?.message ?? "Couldn't send that."))}>
      {children}
    </button>
  );
}
