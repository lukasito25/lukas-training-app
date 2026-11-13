import { useState } from "react";
import { SLEEP_OPTIONS, SORENESS_LEVELS, type Checkin } from "@fitness/core";
import { Icon, ScreenTitle } from "../ui";
import { actions, localDate, useAppState, type HabitGroup } from "../store";

function Segmented<T extends string | number>({ label, options, value, onChange, format }: {
  label: string; options: readonly T[]; value: T | undefined; onChange: (v: T) => void; format?: (v: T) => string;
}) {
  return (
    <>
      <span className="text-[13px]" id={`lbl-${label}`}>{label}</span>
      <div role="radiogroup" aria-labelledby={`lbl-${label}`} className="grid grid-cols-5 gap-1">
        {options.map((o) => {
          const on = o === value;
          return (
            <button key={String(o)} role="radio" aria-checked={on} onClick={() => onChange(o)}
              className={`h-9 rounded-lg text-xs ${on ? "bg-volt text-ink font-semibold" : "bg-graphite-2 text-muted-dark"}`}>
              {format ? format(o) : String(o)}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function Habits() {
  const s = useAppState();
  const date = localDate();
  const existing: Checkin | undefined = s.checkins[date];
  const [editing, setEditing] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [group, setGroup] = useState<HabitGroup>("OTHER");
  const done = new Set(s.habitDone[date] ?? []);

  const update = (patch: Partial<Checkin>) =>
    actions.saveCheckin({ ...(existing ?? { sleepHours: 7, energy: 3, soreness: "low" }), ...patch, date });

  const add = () => {
    actions.addHabit(newHabit, group);
    setNewHabit("");
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
      <ScreenTitle title="Habits" sub={`${done.size} of ${s.habits.length} today · you choose what to track`}
        right={<button onClick={() => setEditing(!editing)}
          className="h-10 px-3.5 rounded-xl border border-hairline-strong bg-surface text-[13px] font-semibold">{editing ? "Done" : "Edit"}</button>} />

      <div className="flex flex-col gap-3 p-4 bg-graphite text-on-dark rounded-[22px]">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-semibold tracking-label text-muted-dark">MORNING CHECK-IN</span>
          <span className="text-xs text-muted-dark">{existing ? "saved · shapes today's volume" : "shapes today's volume"}</span>
        </div>
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2.5 items-center">
          <Segmented label="Sleep" options={SLEEP_OPTIONS} value={existing?.sleepHours as (typeof SLEEP_OPTIONS)[number] | undefined}
            onChange={(v) => update({ sleepHours: v })} format={(v) => (v === 9 ? "9h+" : `${v}h`)} />
          <Segmented label="Energy" options={[1, 2, 3, 4, 5] as const} value={existing?.energy as 1 | 2 | 3 | 4 | 5 | undefined}
            onChange={(v) => update({ energy: v })} />
          <Segmented label="Soreness" options={SORENESS_LEVELS} value={existing?.soreness} onChange={(v) => update({ soreness: v })} />
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {s.habits.map((h, i) => {
          const on = done.has(h.id);
          const radius = s.habits.length === 1 ? "rounded-[14px]" : i === 0 ? "rounded-t-[14px] rounded-b" : i === s.habits.length - 1 ? "rounded-b-[14px] rounded-t" : "rounded";
          return (
            <div key={h.id} className={`flex items-center gap-3 min-h-[52px] px-3 py-2 bg-surface ${radius}`}>
              <button aria-pressed={on} onClick={() => actions.toggleHabit(date, h.id)} className="flex flex-1 items-center gap-3 text-left min-h-[44px]">
                {on ? (
                  <span className="flex-none w-7 h-7 rounded-[9px] bg-ink text-volt flex items-center justify-center"><Icon name="check" size={16} strokeWidth={2.6} /></span>
                ) : (
                  <span className="flex-none w-7 h-7 rounded-[9px] border-[1.5px] border-hairline-dot box-border" />
                )}
                <span className="flex-1 flex flex-col gap-px">
                  <span className="text-sm font-semibold">{h.name}</span>
                  {h.detail && <span className="text-xs text-muted">{h.detail}</span>}
                </span>
              </button>
              {editing ? (
                <button aria-label={`Remove ${h.name}`} onClick={() => actions.removeHabit(h.id)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-danger"><Icon name="x" /></button>
              ) : (
                <span className="text-[11px] font-semibold tracking-[0.04em] text-muted">{h.group}</span>
              )}
            </div>
          );
        })}
      </div>

      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex flex-col gap-2 p-3 rounded-[14px] border-[1.5px] border-dashed border-hairline-dot">
          <label className="text-[13px] font-semibold" htmlFor="new-habit">New habit</label>
          <input id="new-habit" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="e.g. 10 min walk after lunch"
            className="h-11 px-3 rounded-xl border border-hairline-strong bg-surface text-sm" maxLength={60} />
          <div className="flex gap-2">
            <select value={group} onChange={(e) => setGroup(e.target.value as HabitGroup)} aria-label="Group"
              className="h-11 px-3 rounded-xl border border-hairline-strong bg-surface text-sm">
              {(["FOOD", "WATER", "SUPPS", "OTHER"] as const).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button type="submit" disabled={!newHabit.trim()} className="flex-1 h-11 rounded-xl bg-ink text-on-dark text-sm font-semibold disabled:opacity-40">Add habit</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setEditing(true)} className="h-12 rounded-[14px] border-[1.5px] border-dashed border-hairline-dot text-sm font-semibold text-[#3A3A40]">
          + Add a habit
        </button>
      )}
    </div>
  );
}
