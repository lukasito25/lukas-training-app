import { useState } from "preact/hooks";
import { Ask, Btn, Chip, fmt, Icon, useNav } from "./ui";
import { ExerciseDetail } from "./today";
import type { ChangeData, ExerciseData, ProgressData, ReviewData } from "./types";

function BackLink() {
  const nav = useNav();
  if (!nav.back) return null;
  return <button class="link row" style="gap:2px;align-self:flex-start" onClick={nav.back}><Icon name="back" size={14} />Back</button>;
}

export function ExerciseCard({ d }: { d: ExerciseData }) {
  const nav = useNav();
  const e = d.exercise;
  return (
    <div class="card">
      <BackLink />
      <div class="hero">
        <span class="kicker">{d.dayName} · {e.primary ?? "Exercise"}</span>
        <p class="title">{e.name}</p>
        <span class="sub">{e.sets} × {e.reps}{e.timed ? "" : ` @ ${e.rir} RIR`}{e.suggestedKg != null ? ` · ${fmt(e.suggestedKg)} kg suggested` : ""}</span>
      </div>
      <ExerciseDetail e={e} weekday={d.weekday} />
      {d.history.length > 1 && (
        <div class="col" style="gap:4px">
          <span class="label">Recent sessions</span>
          {d.history.map((h) => <div key={h.date} class="between m"><span>{h.date}</span><span>{h.sets.map((s) => `${fmt(s.weightKg)}×${s.reps}`).join(", ")}</span></div>)}
        </div>
      )}
      <Btn kind="volt block" busyKey="get_today_workout" onClick={() => nav.run("get_today_workout", { weekday: d.weekday })}>Open {d.dayName}'s session</Btn>
    </div>
  );
}

export function Change({ d }: { d: ChangeData }) {
  const nav = useNav();
  const [done, setDone] = useState(false);
  if (d.stage === "pick") {
    return (
      <div class="card">
        <BackLink />
        <span class="h2">Swap {d.exercise}</span>
        <span class="m">{d.dayLabel} · pick a replacement. You'll see the change before anything is saved.</span>
        <div class="chips">
          {(d.alternatives ?? []).map((a) => (
            <Chip key={a.id} tall onClick={() => nav.run("swap_exercise", { exercise: d.exerciseId, weekday: d.weekday, replacement: a.id, reason: d.reason ?? undefined })}>
              {a.name}<small>{a.equipment.join(", ") || "Bodyweight"}</small>
            </Chip>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div class="card">
      <div class="between"><span class="h2">Proposed program change</span><span class="m">v{d.fromVersion} → v{d.toVersion}</span></div>
      <div class="diff">
        <span class="label">{d.dayLabel}</span>
        <span class="from">{d.before}</span>
        <span class="to">→ {d.after}</span>
      </div>
      <span class="m">Sets, reps and progression carry over. Nothing is saved until you apply it.</span>
      {done ? <span class="m" role="status">No change made.</span> : (
        <div class="row">
          <Btn kind="volt" busyKey="swap_exercise" onClick={() => nav.run("swap_exercise", d.confirmArgs)}>Apply change</Btn>
          <button class="link" onClick={() => setDone(true)}>Not now</button>
        </div>
      )}
    </div>
  );
}

export function Review({ d }: { d: ReviewData }) {
  const nav = useNav();
  const [open, setOpen] = useState<string | null>(null);
  const r = d.review;
  const pct = r.setsPlanned ? Math.round((r.setsDone / r.setsPlanned) * 100) : 0;
  return (
    <div class="card">
      <BackLink />
      <div class="between"><span class="h2">Week {d.overallWeek} review{d.finished ? "" : " · so far"}</span><span class="m">{d.from}</span></div>
      <div class="grid3">
        <div class="stat"><b>{r.sessionsDone}/{r.sessionsPlanned}</b><span class="m">sessions</span></div>
        <div class="stat"><b>{pct}%</b><span class="m">sets done</span></div>
        <div class="stat"><b>{d.newBests.length}</b><span class="m">new bests</span></div>
      </div>
      <div class="col" style="gap:2px">
        <span class="label">Sets per muscle · tap for detail</span>
        <div class="list">
          {d.muscles.map((m) => {
            const isOpen = open === m.group;
            const w = Math.min(100, (m.done / Math.max(1, m.planned)) * 100);
            return (
              <div key={m.group} class={isOpen ? "open" : ""}>
                <button class="ex-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.group)}>
                  <span style="width:84px">{m.label}</span>
                  <div class="grow bar" role="img" aria-label={`${m.label}: ${m.done} of ${m.planned} sets`}><i style={`width:${w}%`} /></div>
                  <span class="m" style="width:44px;text-align:right">{m.done}/{m.planned}</span>
                  <span class="chev"><Icon name="chev" size={14} /></span>
                </button>
                {isOpen && (
                  <div class="detail m">
                    {m.exercises.length ? m.exercises.map((x) => <div key={x.name} class="between"><span>{x.name}</span><span>{x.sets} sets</span></div>)
                      : <span>No sets logged for {m.label.toLowerCase()} yet.</span>}
                    <span>{m.done >= m.planned ? "On target for the week." : `${m.planned - m.done} sets to go to hit the plan.`}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {d.newBests.length > 0 && (
        <div class="note"><b>New bests</b>{d.newBests.slice(0, 4).map((b) => <div key={b.name}>{b.name} · {fmt(b.weightKg)} kg × {b.reps}</div>)}</div>
      )}
      <div class="row" style="flex-wrap:wrap;gap:6px">
        <Btn kind="small" busyKey="get_progress" onClick={() => nav.run("get_progress", {})}>See goal trend</Btn>
        <Ask text="Based on this week's review, what should I focus on next week?">Plan next week</Ask>
      </div>
    </div>
  );
}

function Chart({ d }: { d: ProgressData }) {
  const W = 320, H = 140, P = { l: 30, r: 10, t: 10, b: 20 };
  const pts = d.points;
  const lastWeek = Math.max(0, ...pts.map((p) => p.week));
  const maxWeek = Math.max(lastWeek, 1, Math.min(d.goalWeek, Math.max(8, lastWeek + 4)));
  const vals = [...pts.map((p) => p.value), ...(d.target != null ? [d.target] : [])];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = (w: number) => P.l + (Math.max(0, w) / maxWeek) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p.week).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${d.label} trend: ${pts.map((p) => `week ${p.week} ${p.label}`).join(", ")}${d.targetLabel ? `; goal ${d.targetLabel}` : ""}`}>
      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--line)" />
      {d.target != null && <>
        <line x1={P.l} x2={W - P.r} y1={y(d.target)} y2={y(d.target)} stroke="var(--muted)" stroke-dasharray="4 4" />
        <text x={W - P.r} y={y(d.target) - 4} text-anchor="end">goal {d.targetLabel}</text>
      </>}
      <text x={P.l - 4} y={y(hi - pad) + 3} text-anchor="end">{fmt(Math.round((hi - pad) * 10) / 10)}</text>
      <text x={P.l - 4} y={y(lo + pad) + 3} text-anchor="end">{fmt(Math.round((lo + pad) * 10) / 10)}</text>
      <text x={P.l} y={H - 6}>wk 0</text>
      <text x={W - P.r} y={H - 6} text-anchor="end">wk {maxWeek}</text>
      <path d={path} fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {pts.map((p) => <circle key={p.week + "-" + p.value} cx={x(p.week)} cy={y(p.value)} r="3" fill="var(--ink)" />)}
    </svg>
  );
}

function MeasureForm({ d, onDone }: { d: ProgressData; onDone: () => void }) {
  const nav = useNav();
  const lm = d.lastMeasurement;
  const [w, setW] = useState(lm ? String(lm.weightKg) : "");
  const [bf, setBf] = useState(lm?.bodyFatPct != null ? String(lm.bodyFatPct) : "");
  const [arms, setArms] = useState(lm?.armsCm != null ? String(lm.armsCm) : "");
  const [h, setH] = useState("");
  const n = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));
  const field = (label: string, v: string, set: (s: string) => void) => (
    <label class="field">{label}<input inputMode="decimal" value={v} onInput={(e) => set((e.target as HTMLInputElement).value)} /></label>
  );
  return (
    <div class="note col">
      <div class="steppers">
        {field("Weight kg", w, setW)}
        {field("Body fat %", bf, setBf)}
        {field("Arms cm", arms, setArms)}
        {d.needsHeight && field("Height cm", h, setH)}
      </div>
      <div class="row">
        <Btn kind="small" busyKey="log_measurement" disabled={!n(w)} onClick={async () => {
          const r = await nav.run("log_measurement", { weight_kg: n(w), body_fat_pct: n(bf), arms_cm: n(arms), height_cm: n(h) });
          if (r) onDone();
        }}>Save measurement</Btn>
        <button class="link" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

const PACE: Record<string, string> = { on_pace: "On pace", ahead: "Ahead of pace", behind: "Behind pace", not_enough_data: "Log a few more weeks to see your pace" };

export function Progress({ d }: { d: ProgressData }) {
  const nav = useNav();
  const [form, setForm] = useState(false);
  return (
    <div class="card">
      <BackLink />
      <div class="between"><span class="h2">{d.label} trend</span>{d.saved && <span class="m">Saved {d.saved}</span>}</div>
      <div class="chips">
        {d.metrics.map((m) => <Chip key={m.id} on={m.id === d.metric} onClick={() => m.id !== d.metric && nav.run("get_progress", { metric: m.id })}>{m.label}</Chip>)}
      </div>
      {d.points.length ? (
        <>
          <Chart d={d} />
          <div class="grid3">
            <div class="stat"><b>{d.latestLabel ?? "–"}</b><span class="m">latest</span></div>
            <div class="stat"><b>{d.targetLabel ?? "–"}</b><span class="m">goal</span></div>
            <div class="stat"><b>{d.reached ? "done" : d.pace.projectedWeek != null ? `wk ${d.pace.projectedWeek}` : "–"}</b><span class="m">projected</span></div>
          </div>
          <span class="m">{d.reached ? "Goal reached. Time to set the next one." : PACE[d.pace.status] ?? ""}</span>
        </>
      ) : (
        <span class="m">No {d.label} data yet.{d.needsHeight ? " FFMI needs your height and body-fat %." : ""}</span>
      )}
      {form ? <MeasureForm d={d} onDone={() => setForm(false)} /> : (
        <div class="row" style="flex-wrap:wrap;gap:6px">
          <button class="btn small" onClick={() => setForm(true)}>Log measurement</button>
          {d.reached && <Ask text="I reached my goal. Help me set a new target.">Set a new goal</Ask>}
        </div>
      )}
    </div>
  );
}
