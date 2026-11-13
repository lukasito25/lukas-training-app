import { useState } from "preact/hooks";
import { Btn, Chip, Icon, useNav } from "./ui";
import type { BuilderData, PlanPreviewData } from "./types";

type Pick = { goal?: string; experience?: string; days_per_week?: number; session_minutes?: number; equipment: string[]; focus: string[]; limitations: string };

export function PlanBuilder({ d }: { d: BuilderData }) {
  const nav = useNav();
  const c = (d.current ?? {}) as Partial<Pick>;
  const [p, setP] = useState<Pick>({
    goal: c.goal, experience: c.experience, days_per_week: c.days_per_week, session_minutes: c.session_minutes,
    equipment: c.equipment ?? [], focus: c.focus ?? [], limitations: c.limitations ?? "",
  });
  const set = (patch: Partial<Pick>) => setP((x) => ({ ...x, ...patch }));
  const toggle = (k: "equipment" | "focus", v: string, max = 99) =>
    setP((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : x[k].length >= max ? x[k] : [...x[k], v] }));
  const ready = p.goal && p.experience && p.days_per_week && p.session_minutes;
  const allGym = d.equipment.every((q) => p.equipment.includes(q.id));
  const group = (label: string, body: preact.ComponentChildren) => <div class="col" style="gap:6px"><span class="label">{label}</span>{body}</div>;
  return (
    <div class="card">
      <div class="hero">
        <span class="kicker">LiftWise plan builder</span>
        <p class="title">{d.hasPlan ? "Build a new plan" : "Let's build your plan"}</p>
        <span class="sub">A few taps. You'll see the full plan before anything is saved.</span>
      </div>
      {group("Goal", <div class="chips">{d.goals.map((g) => <Chip key={g.id} tall on={p.goal === g.id} onClick={() => set({ goal: g.id })}>{g.label}<small>{g.detail}</small></Chip>)}</div>)}
      {group("Experience", <div class="chips">{d.experience.map((g) => <Chip key={g.id} on={p.experience === g.id} onClick={() => set({ experience: g.id })}>{g.label}</Chip>)}</div>)}
      {group("Days per week", <div class="chips">{d.days.map((g) => <Chip key={g.id} tall on={p.days_per_week === g.id} onClick={() => set({ days_per_week: g.id })}>{g.label}<small>{g.detail}</small></Chip>)}</div>)}
      {group("Session length", <div class="chips">{d.minutes.map((m) => <Chip key={m} on={p.session_minutes === m} onClick={() => set({ session_minutes: m })}>{m} min</Chip>)}</div>)}
      {group("Equipment", <div class="chips">
        <Chip on={allGym} onClick={() => set({ equipment: allGym ? [] : d.equipment.map((q) => q.id) })}>Full gym</Chip>
        {d.equipment.map((q) => <Chip key={q.id} on={p.equipment.includes(q.id)} onClick={() => toggle("equipment", q.id)}>{q.label}</Chip>)}
      </div>)}
      {group("Focus (up to 3, optional)", <div class="chips">{d.focus.map((f) => <Chip key={f} on={p.focus.includes(f)} onClick={() => toggle("focus", f, 3)}>{f}</Chip>)}</div>)}
      <label class="field">Injuries or movements to avoid (optional)
        <textarea rows={2} maxLength={300} value={p.limitations} placeholder="e.g. left shoulder, no overhead pressing"
          onInput={(e) => set({ limitations: (e.target as HTMLTextAreaElement).value })} />
      </label>
      <Btn kind="volt block" busyKey="create_program" disabled={!ready || p.equipment.length === 0}
        onClick={() => nav.run("create_program", { ...p })}>
        {!ready ? "Pick goal, experience, days and length" : p.equipment.length === 0 ? "Pick your equipment" : "Preview my plan"}
      </Btn>
    </div>
  );
}

export function PlanPreview({ d }: { d: PlanPreviewData }) {
  const nav = useNav();
  const [open, setOpen] = useState<number | null>(d.days[0]?.weekday ?? null);
  const maxSets = Math.max(...d.volume.map((v) => v.sets), 1);
  return (
    <div class="card">
      <div class="hero">
        <span class="kicker">Plan preview · not saved yet</span>
        <p class="title">{d.summary}</p>
        <span class="sub">{d.days.length} days a week · {d.weeks} weeks</span>
      </div>
      {d.replaces && <div class="note">Saving replaces your current plan and restarts at week 1. Your logged sets are kept.</div>}
      <div class="list">
        {d.days.map((day) => {
          const isOpen = open === day.weekday;
          return (
            <div key={day.weekday} class={`ex${isOpen ? " open" : ""}`}>
              <button class="ex-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : day.weekday)}>
                <div class="grow"><div class="name">{day.day} · {day.label}</div><div class="m">{day.exercises.length} exercises · {day.exercises.reduce((n, e) => n + e.sets, 0)} sets</div></div>
                <span class="chev"><Icon name="chev" /></span>
              </button>
              {isOpen && <div class="detail m">{day.exercises.map((e) => <div key={e.name} class="between"><span>{e.name}</span><span>{e.sets} sets</span></div>)}</div>}
            </div>
          );
        })}
      </div>
      <div class="col" style="gap:4px">
        <span class="label">Weekly sets per muscle</span>
        {d.volume.map((v) => (
          <div key={v.group} class="row" style="gap:8px">
            <span class="m" style="width:84px">{v.label}</span>
            <div class="grow bar"><i style={`width:${(v.sets / maxSets) * 100}%`} /></div>
            <span class="m" style="width:24px;text-align:right">{v.sets}</span>
          </div>
        ))}
      </div>
      {d.notes.length > 0 && <div class="note">{d.notes.join(" ")}</div>}
      <div class="row">
        <Btn kind="volt" busyKey="create_program" onClick={() => nav.run("create_program", d.confirmArgs)}>Save plan</Btn>
        {nav.back ? <button class="link" onClick={nav.back}>Adjust</button>
          : <button class="link" onClick={() => nav.run("plan_builder", {})}>Adjust</button>}
      </div>
    </div>
  );
}
