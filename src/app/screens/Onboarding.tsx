import { useMemo, useState } from "react";
import {
  EQUIPMENT, EQUIPMENT_LABEL, FOCUS_AREAS, GOAL_INFO, GROUP_LABEL, LIBRARY_BY_ID, SPLIT_LABEL, generateProgram,
  blockName, phaseShort,
  type Equipment, type Experience, type FocusArea, type Goal, type Program, type ProgramInputs,
} from "@fitness/core";
import { Icon } from "../ui";
import { actions, useAppState, type GoalMetric } from "../store";
import { WEEKDAY_SHORT } from "../today";
import { useCloud } from "../cloud";
import { SignInForm } from "./Account";

/** Returning users on a new device: sign in and the plan arrives from the cloud. */
function ReturningUser() {
  const cloud = useCloud();
  const [open, setOpen] = useState(false);
  if (cloud.phase === "off") return null;
  if (cloud.userId) {
    return <span className="text-xs text-muted text-center" role="status">Signed in as {cloud.email}. {cloud.phase === "syncing" ? "Loading your plan…" : "No plan saved yet: build one above."}</span>;
  }
  return open ? (
    <div className="flex flex-col gap-2 pt-1"><SignInForm compact /></div>
  ) : (
    <button onClick={() => setOpen(true)} className="text-xs text-muted text-center underline underline-offset-2">Already have an account? Sign in</button>
  );
}

const DEFAULTS: ProgramInputs = {
  goal: "muscle", experience: "intermediate", focus: [], daysPerWeek: 4, sessionMinutes: 60,
  equipment: ["barbell", "dumbbell", "cable", "pullup_bar"], limitations: "",
};

const LEVEL_NOTE: Record<Experience, string> = {
  beginner: "Under 1 year of regular lifting",
  intermediate: "1–3 years, comfortable with the main lifts",
  advanced: "3+ years, progress comes slowly",
};

const TARGET_FIELD: Record<Goal, { metric: GoalMetric; label: string; unit: string; placeholder: string } | null> = {
  muscle: { metric: "ffmi", label: "Target FFMI", unit: "", placeholder: "20.0" },
  fat: { metric: "bodyfat", label: "Target body fat", unit: "%", placeholder: "12" },
  strength: null, general: null, sport: null,
};

const sel = (on: boolean) => (on ? "bg-ink text-on-dark border-ink" : "bg-surface text-ink border-hairline-strong");

function Header({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-2">
      {onBack ? (
        <button onClick={onBack} aria-label="Back" className="w-11 h-11 rounded-full bg-surface border border-line flex items-center justify-center flex-none">
          <Icon name="back" />
        </button>
      ) : (
        <span className="w-11 h-11 rounded-xl bg-ink flex items-center justify-center flex-none text-volt"><Icon name="train" size={22} strokeWidth={2.4} /></span>
      )}
      <div className="flex-1 grid grid-cols-3 gap-1">
        {[1, 2, 3].map((i) => <div key={i} className={`h-1 rounded-sm ${i <= step ? "bg-ink" : "bg-hairline-strong"}`} />)}
      </div>
      <span className="text-xs text-muted font-medium">{step} of 3</span>
    </div>
  );
}

export default function Onboarding({ mode, onDone }: { mode: "new" | "edit"; onDone: () => void }) {
  const s = useAppState();
  const [step, setStep] = useState(1);
  const [d, setD] = useState<ProgramInputs>(s.program?.inputs ?? DEFAULTS);
  const [targetValue, setTargetValue] = useState<string>(s.goalValue != null ? String(s.goalValue) : "");
  const [targetText, setTargetText] = useState(s.program?.inputs.target ?? "");
  const [editingTarget, setEditingTarget] = useState(false);
  const patch = (p: Partial<ProgramInputs>) => setD((cur) => ({ ...cur, ...p }));

  const field = TARGET_FIELD[d.goal];
  const targetSummary = field
    ? targetValue ? `${field.label} ${targetValue}${field.unit}` : `Add a ${field.label.replace(/^Target /, "target ")}`
    : targetText || "Add a target, e.g. bench 100 kg by summer";

  const finish = (program: Program, restart: boolean) => {
    actions.saveProgram(program, { restart });
    const value = Number(targetValue);
    actions.setProfile({ goalMetric: field?.metric ?? "none", goalValue: field && Number.isFinite(value) && targetValue ? value : null });
    if (d.limitations.trim()) actions.addCoachNote(d.limitations.trim(), "onboarding");
    onDone();
  };

  return (
    <div className="min-h-[100dvh] bg-chalk text-ink font-sans flex justify-center">
      <div className="w-full max-w-[440px] flex flex-col min-h-[100dvh]">
        {step === 1 && (
          <>
            <Header step={1} onBack={mode === "edit" ? onDone : undefined} />
            <div className="flex-1 flex flex-col gap-[18px] px-5 pt-3.5">
              <div className="flex flex-col gap-1.5">
                <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish leading-[1.1]">What are you training for?</h1>
                <p className="m-0 text-sm text-muted leading-normal">Your goal sets the volume, rep ranges and how each block progresses.</p>
              </div>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Goal">
                {(Object.keys(GOAL_INFO) as Goal[]).map((g, i) => {
                  const on = d.goal === g;
                  return (
                    <button key={g} role="radio" aria-checked={on} onClick={() => patch({ goal: g })}
                      className={`flex flex-col items-start gap-[3px] min-h-16 px-3.5 py-3 rounded-2xl border text-left ${sel(on)} ${i === 4 ? "col-span-2" : ""}`}>
                      <span className="text-[15px] font-semibold">{GOAL_INFO[g].label}</span>
                      <span className={`text-xs ${on ? "text-[#C9C9CE]" : "text-muted"}`}>{GOAL_INFO[g].detail}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold">Muscles to prioritise</span>
                  <span className="text-xs text-muted">up to 3 · {d.focus.length} picked</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_AREAS.map((m) => {
                    const on = d.focus.includes(m);
                    const disabled = !on && d.focus.length >= 3;
                    return (
                      <button key={m} aria-pressed={on} disabled={disabled}
                        onClick={() => patch({ focus: on ? d.focus.filter((f) => f !== m) : [...d.focus, m as FocusArea] })}
                        className={`h-[38px] px-[13px] rounded-full border text-[13px] font-semibold disabled:opacity-40 ${sel(on)}`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold" id="lvl">Training experience</span>
                <div role="radiogroup" aria-labelledby="lvl" className="grid grid-cols-3 p-[3px] gap-[3px] bg-line rounded-[13px]">
                  {(["beginner", "intermediate", "advanced"] as Experience[]).map((l) => (
                    <button key={l} role="radio" aria-checked={d.experience === l} onClick={() => patch({ experience: l })}
                      className={`h-10 rounded-[10px] text-[13px] font-semibold capitalize ${d.experience === l ? "bg-surface text-ink" : "text-muted"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted">{LEVEL_NOTE[d.experience]}</span>
              </div>

              <div className="flex flex-col gap-2 px-3.5 py-3 bg-surface rounded-2xl border border-line">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-xs text-muted">Target · optional</span>
                    <span className="text-sm font-semibold">{targetSummary}</span>
                  </div>
                  <button onClick={() => setEditingTarget(!editingTarget)} className="h-9 px-3 rounded-[10px] bg-chalk text-[13px] font-medium">
                    {editingTarget ? "Done" : "Edit"}
                  </button>
                </div>
                {editingTarget && (field ? (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="sr-only">{field.label}</span>
                    <input inputMode="decimal" value={targetValue} onChange={(e) => setTargetValue(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))}
                      placeholder={field.placeholder} className="h-11 w-28 px-3 rounded-xl border border-hairline-strong bg-surface" />
                    <span className="text-muted">{field.unit || "FFMI"}</span>
                  </label>
                ) : (
                  <input value={targetText} onChange={(e) => setTargetText(e.target.value.slice(0, 120))} aria-label="Target"
                    placeholder={d.goal === "sport" ? "e.g. Football · season starts in March" : "e.g. Bench 100 kg"}
                    className="h-11 px-3 rounded-xl border border-hairline-strong bg-surface text-sm" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 px-5 pt-3.5 pb-[26px]">
              <button onClick={() => { patch({ target: targetText || undefined }); setStep(2); }}
                className="h-[54px] rounded-2xl bg-ink text-on-dark font-semibold text-base">Continue</button>
              {mode === "new" && (
                <button onClick={() => { actions.useClassicProgram(); onDone(); }} className="text-xs text-muted text-center underline underline-offset-2">
                  Or use the classic 48-week hypertrophy plan
                </button>
              )}
              {mode === "new" && <ReturningUser />}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Header step={2} onBack={() => setStep(1)} />
            <div className="flex-1 flex flex-col gap-[18px] px-5 pt-3.5">
              <div className="flex flex-col gap-1.5">
                <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish leading-[1.1]">How does your week look?</h1>
                <p className="m-0 text-sm text-muted leading-normal">We build the split and exercise choice around this. You can change it any time, here or in chat.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Days per week</span>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Days per week">
                  {([3, 4, 5, 6] as const).map((n) => (
                    <button key={n} role="radio" aria-checked={d.daysPerWeek === n} onClick={() => patch({ daysPerWeek: n })}
                      className={`h-12 rounded-[14px] border font-display text-lg font-semibold ${sel(d.daysPerWeek === n)}`}>{n}</button>
                  ))}
                </div>
                <span className="text-xs text-muted">Suggested split: <b className="text-ink font-semibold">{SPLIT_LABEL[d.daysPerWeek]}</b></span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Session length</span>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Session length">
                  {([45, 60, 75, 90] as const).map((m) => (
                    <button key={m} role="radio" aria-checked={d.sessionMinutes === m} onClick={() => patch({ sessionMinutes: m })}
                      className={`h-11 rounded-xl border text-[13px] font-semibold ${sel(d.sessionMinutes === m)}`}>{m} min</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Equipment you can use</span>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT.map((q) => {
                    const on = d.equipment.includes(q);
                    return (
                      <button key={q} aria-pressed={on} onClick={() => patch({ equipment: on ? d.equipment.filter((x) => x !== q) : [...d.equipment, q as Equipment] })}
                        className={`h-[38px] px-[13px] rounded-full border text-[13px] font-semibold ${sel(on)}`}>{EQUIPMENT_LABEL[q]}</button>
                    );
                  })}
                </div>
                {d.equipment.length === 0 && <span className="text-xs text-muted">Nothing selected: you'll get a bodyweight program.</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="avoid" className="text-[13px] font-semibold">Injuries or movements to avoid</label>
                <input id="avoid" type="text" value={d.limitations} maxLength={300} onChange={(e) => patch({ limitations: e.target.value })}
                  placeholder="e.g. Left shoulder: no behind-the-neck pressing"
                  className="h-12 px-3.5 rounded-[14px] border border-hairline-strong bg-surface text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-2.5 px-5 pt-3.5 pb-[26px]">
              <button onClick={() => setStep(3)} className="h-[54px] rounded-2xl bg-ink text-on-dark font-semibold text-base">Build my program</button>
              <span className="text-xs text-muted text-center">Next: review the plan before anything is saved</span>
            </div>
          </>
        )}

        {step === 3 && <Preview inputs={d} mode={mode} targetLabel={targetSummary} onBack={() => setStep(2)} onSave={finish} hasTarget={!!(targetValue || targetText)} />}
      </div>
    </div>
  );
}

export function VolumeBars({ program, max = 26 }: { program: Program; max?: number }) {
  const rows = program.volume.filter((v) => v.sets > 0 || v.focus).sort((a, b) => b.sets - a.sets);
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)_28px] gap-x-2 gap-y-2.5 items-center">
      {rows.map((v) => (
        <div key={v.group} className="contents">
          <span className="text-[13px]">{GROUP_LABEL[v.group]}{v.focus ? " ★" : ""}</span>
          <div className="relative h-2.5 rounded-[5px] bg-[#F0F0EA]" role="img"
            aria-label={`${GROUP_LABEL[v.group]}: ${v.sets} weekly sets, effective range ${v.mev} to ${v.mrv}`}>
            <div className="absolute top-0 h-2.5 rounded-[5px] bg-[#DADAD2]" style={{ left: pct(v.mev), width: `calc(${pct(v.mrv)} - ${pct(v.mev)})` }} />
            <div className="absolute -top-[3px] w-1 h-4 rounded-sm bg-ink" style={{ left: `calc(${pct(v.sets)} - 2px)` }} />
          </div>
          <span className="text-[13px] font-semibold text-right">{v.sets}</span>
        </div>
      ))}
    </div>
  );
}

function Preview({ inputs, mode, targetLabel, hasTarget, onBack, onSave }: {
  inputs: ProgramInputs; mode: "new" | "edit"; targetLabel: string; hasTarget: boolean;
  onBack: () => void; onSave: (p: Program, restart: boolean) => void;
}) {
  const s = useAppState();
  const program = useMemo(() => {
    const p = generateProgram(inputs);
    // Keep version history when adjusting an existing program.
    if (mode === "edit" && s.program) {
      const version = s.program.version + 1;
      return { ...p, id: s.program.id, version, history: [...s.program.history, { version, at: p.createdAt, reason: "Goals or schedule changed" }] };
    }
    return p;
  }, [inputs, mode, s.program]);
  const g = GOAL_INFO[inputs.goal];
  const minutes = Math.round(inputs.sessionMinutes);

  return (
    <>
      <Header step={3} onBack={onBack} />
      <div className="flex-1 flex flex-col gap-3 px-5 pt-3.5 pb-2">
        <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish">{mode === "edit" ? "Your updated program" : "Your program is ready"}</h1>
        <div className="flex flex-col gap-3.5 p-[18px] bg-graphite text-on-dark rounded-3xl">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-label text-volt">
              {g.tag}{inputs.focus.length ? ` · ${inputs.focus.join(" & ").toUpperCase()} FOCUS` : ""}
            </span>
            {hasTarget && <span className="text-sm text-muted-dark">{targetLabel}</span>}
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${program.days.length}, minmax(0, 1fr))` }}>
            {program.days.map((day) => (
              <div key={day.key} className="flex flex-col gap-1 px-2 py-2.5 rounded-xl bg-graphite-2">
                <span className="text-[11px] text-muted-dark">{WEEKDAY_SHORT[day.weekday]}</span>
                <span className="text-sm font-semibold truncate">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${program.blocks.length}, minmax(0, 1fr))` }}>
            {program.blocks.map((b, i) => (
              <div key={i} className="flex flex-col gap-1" title={blockName(program.blocks, i)}>
                <div className={`h-1.5 rounded-[3px] ${b === "volume" ? "bg-volt" : b === "intensity" ? "bg-[#8E8F96]" : "bg-on-dark"}`} />
                <span className="text-[10px] text-muted-dark">{phaseShort(b)}</span>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-dark">
            {program.blocks.length} blocks of {program.weeksPerBlock} weeks · deload every {program.deloadWeek}th week · ~{minutes} min sessions
          </span>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-surface rounded-[18px] border border-line">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold">Weekly sets per muscle</span>
            <span className="text-[11px] text-muted">band = effective range</span>
          </div>
          <VolumeBars program={program} />
        </div>

        <details className="p-4 bg-surface rounded-[18px] border border-line">
          <summary className="text-sm font-semibold cursor-pointer">Exercises by day</summary>
          <div className="flex flex-col gap-3 mt-3">
            {program.days.map((day) => (
              <div key={day.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.06em] text-muted">{WEEKDAY_SHORT[day.weekday].toUpperCase()} · {day.label.toUpperCase()}</span>
                {day.slots.map((sl) => (
                  <span key={sl.exerciseId} className="text-[13px] flex justify-between"><span>{LIBRARY_BY_ID.get(sl.exerciseId)?.name}</span><span className="text-muted">{sl.sets} sets</span></span>
                ))}
              </div>
            ))}
          </div>
        </details>

        {program.notes.length > 0 && (
          <div className="flex flex-col gap-2 p-4 bg-surface rounded-[18px] border border-line">
            <span className="text-sm font-semibold">Built around you</span>
            {program.notes.map((n, i) => <span key={i} className="text-[13px] text-[#3A3A40] leading-snug">{n}</span>)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 px-5 pt-3 pb-[26px]">
        <div className="grid grid-cols-[1fr_2fr] gap-2.5">
          <button onClick={onBack} className="h-[54px] rounded-2xl border border-hairline-strong bg-surface font-semibold">Adjust</button>
          <button onClick={() => onSave(program, mode === "new")} className="h-[54px] rounded-2xl bg-ink text-volt font-semibold">
            {mode === "edit" ? "Save changes" : "Start week 1"}
          </button>
        </div>
        {mode === "edit" && (
          <button onClick={() => onSave(program, true)} className="text-xs text-muted underline underline-offset-2">Save and restart from week 1</button>
        )}
      </div>
    </>
  );
}
