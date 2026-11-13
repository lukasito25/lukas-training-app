import { useEffect, useState } from "react";
import { alternativesFor, swapExercise, type PrescribedExercise, type ProgramDiff, type Program } from "@fitness/core";
import { Card, Icon, ScreenTitle, type Tab } from "../ui";
import { actions, localDate, useAppState } from "../store";
import { dayOfWeekIndex, exerciseHistory, fmtKg, planFor, suggestionFor, useToday, WEEKDAY_SHORT } from "../today";

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, "0")}`;

export default function Train({ go }: { go: (t: Tab) => void }) {
  const s = useAppState();
  const plan = planFor(s)!;
  const today = localDate();
  const active = s.active?.date === today ? s.active : null;
  const scheduled = dayOfWeekIndex();
  const [picked, setPicked] = useState<number | null>(null);
  const isTrainingDay = plan.trainingWeekdays.includes(scheduled);
  const weekday = active?.weekday ?? picked ?? (isTrainingDay ? scheduled : null);

  if (weekday === null) return <DayPicker onPick={setPicked} />;
  if (!active) return <Preview weekday={weekday} onChangeDay={() => setPicked(null)} canChange={!isTrainingDay || picked !== null} />;
  return <Live weekday={weekday} go={go} />;
}

function DayPicker({ onPick }: { onPick: (wd: number) => void }) {
  const s = useAppState();
  const plan = planFor(s)!;
  return (
    <div className="flex flex-col gap-3 px-5 pt-6">
      <ScreenTitle title="Train" sub="Today is a recovery day in your plan" />
      <Card className="p-4 flex flex-col gap-3">
        <span className="text-sm">Recovery is when you grow. If you still want to train, pick a session:</span>
        <div className="grid grid-cols-2 gap-2">
          {plan.trainingWeekdays.map((wd) => (
            <button key={wd} onClick={() => onPick(wd)} className="h-12 rounded-xl border border-hairline-strong bg-surface font-semibold">
              {plan.dayLabel(wd)} <span className="text-muted font-normal text-xs">· {WEEKDAY_SHORT[wd]}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Preview({ weekday, onChangeDay, canChange }: { weekday: number; onChangeDay: () => void; canChange: boolean }) {
  const s = useAppState();
  const { session, adjustment, position } = useToday(weekday)!;
  return (
    <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
      <ScreenTitle title={session.label} sub={`${session.title} · Week ${position.overallWeek} · ~${session.estMinutes} min`}
        right={canChange ? <button onClick={onChangeDay} className="h-10 px-3.5 rounded-xl border border-hairline-strong bg-surface text-[13px] font-semibold">Change</button> : undefined} />
      {adjustment.reason && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-volt-soft text-volt-deep text-[13px] font-medium">
          <Icon name="down" size={14} strokeWidth={2.2} /> {adjustment.reason}
        </div>
      )}
      {session.deload && (
        <div className="px-3 py-2.5 rounded-xl bg-surface border border-line text-[13px]">Deload week: half the sets and lighter effort so you recover and come back stronger.</div>
      )}
      <div className="flex flex-col gap-0.5">
        {session.exercises.map((e, i) => {
          const sug = suggestionFor(s, e);
          return (
            <div key={e.id} className={`flex justify-between items-center gap-3 px-3.5 py-3 bg-surface ${
              i === 0 ? "rounded-t-[14px] rounded-b" : i === session.exercises.length - 1 ? "rounded-b-[14px] rounded-t" : "rounded"}`}>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{e.name}</span>
                {e.notes && <span className="text-xs text-muted truncate">{e.notes}</span>}
              </div>
              <span className="text-[13px] text-muted flex-none text-right">
                {e.sets} × {e.repsLabel}{sug?.weightKg != null ? <><br />{fmtKg(sug.weightKg)} kg</> : null}
              </span>
            </div>
          );
        })}
      </div>
      <button onClick={() => actions.startSession(weekday)}
        className="flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-ink text-volt font-semibold text-base">
        <Icon name="play" size={18} /> Start session
      </button>
    </div>
  );
}

function Live({ weekday, go }: { weekday: number; go: (t: Tab) => void }) {
  const s = useAppState();
  const now = useNow();
  const { session, position } = useToday(weekday)!;
  const active = s.active!;
  const today = localDate();
  const idx = Math.min(active.exerciseIndex, session.exercises.length - 1);
  const ex = session.exercises[idx];

  const loggedToday = s.setLogs.filter((l) => localDate(new Date(l.completedAt)) === today);
  const isDone = (e: PrescribedExercise, i: number) => loggedToday.some((l) => l.exerciseId === e.id && l.setIndex === i);
  const doneCount = (e: PrescribedExercise) => Array.from({ length: e.sets }, (_, i) => isDone(e, i)).filter(Boolean).length;
  const setsDone = session.exercises.reduce((n, e) => n + doneCount(e), 0);
  const elapsed = Math.floor((now - new Date(active.startedAt).getTime()) / 1000);
  const restLeft = active.restUntil ? Math.ceil((active.restUntil - now) / 1000) : 0;
  const allDone = ex ? doneCount(ex) === ex.sets : false;

  const finish = () => {
    actions.finishSession(setsDone);
    go("today");
  };

  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button onClick={() => go("today")} aria-label="Back to Today"
          className="w-11 h-11 rounded-full bg-surface border border-line flex items-center justify-center">
          <Icon name="back" />
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-muted font-medium">{session.label} · Week {position.overallWeek}</span>
          <span className="font-display text-xl font-semibold tabular-nums">{mmss(elapsed)}</span>
        </div>
        <button onClick={finish} className="h-11 px-4 rounded-full bg-ink text-on-dark text-sm font-semibold">Finish</button>
      </div>

      <div className="px-4 pb-3 flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>{setsDone} of {session.workingSets} sets</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#5E8A12]" />Saved on this device</span>
        </div>
        <div className="h-1.5 rounded-[3px] bg-line overflow-hidden">
          <div className="h-1.5 bg-ink transition-[width]" style={{ width: `${Math.round((setsDone / Math.max(1, session.workingSets)) * 100)}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4">
        {ex && <ExerciseCard key={ex.id} ex={ex} index={idx} total={session.exercises.length} isDone={(i) => isDone(ex, i)} weekday={weekday} />}

        {restLeft > 0 && (
          <div className="flex items-center gap-3 px-3.5 py-3 bg-volt-soft rounded-2xl text-volt-deep" role="timer" aria-live="off">
            <Icon name="timer" />
            <span className="flex-1 text-sm font-medium">Rest {mmss(restLeft)} left</span>
            <button onClick={() => actions.patchActive({ restUntil: null })} className="h-9 px-3 rounded-[10px] bg-volt-deep text-volt-soft text-[13px] font-semibold">Skip</button>
          </div>
        )}

        {allDone && idx < session.exercises.length - 1 && (
          <button onClick={() => actions.patchActive({ exerciseIndex: idx + 1 })} className="h-12 rounded-2xl bg-ink text-on-dark font-semibold">
            Next: {session.exercises[idx + 1].name}
          </button>
        )}
        {allDone && idx === session.exercises.length - 1 && (
          <button onClick={finish} className="h-12 rounded-2xl bg-volt text-ink font-semibold">Finish session</button>
        )}

        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold tracking-[0.06em] text-muted px-0.5 pt-1 pb-1.5">SESSION</span>
          {session.exercises.map((e, i) => {
            const n = doneCount(e);
            const first = i === 0, last = i === session.exercises.length - 1;
            return (
              <button key={e.id} onClick={() => actions.patchActive({ exerciseIndex: i })} aria-current={i === idx ? "step" : undefined}
                className={`flex justify-between items-center px-3.5 py-3 text-left ${i === idx ? "bg-ink text-on-dark" : "bg-surface"} ${
                  first ? "rounded-t-[14px] rounded-b" : last ? "rounded-b-[14px] rounded-t" : "rounded"}`}>
                <span className="text-sm font-semibold flex items-center gap-2">
                  {n === e.sets && <Icon name="check" size={16} strokeWidth={2.6} className={i === idx ? "text-volt" : "text-volt-ink"} />}
                  {e.name}
                </span>
                <span className={`text-[13px] ${i === idx ? "text-muted-dark" : "text-muted"}`}>{n}/{e.sets} · {e.repsLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, index, total, isDone, weekday }: { ex: PrescribedExercise; index: number; total: number; isDone: (i: number) => boolean; weekday: number }) {
  const s = useAppState();
  const sug = suggestionFor(s, ex);
  const lastWeight = exerciseHistory(s, ex.id)[0]?.[0]?.weightKg;
  const suggested = sug?.weightKg ?? lastWeight ?? null;
  const chosen = s.active?.weights[ex.id];
  const weight = chosen ?? suggested ?? 20;
  const targetReps = sug?.targetReps ?? ex.repRange?.[0] ?? 0;
  const [reps, setReps] = useState<number[]>(() => Array.from({ length: ex.sets }, () => targetReps));
  const [rirs, setRirs] = useState<number[]>(() => Array.from({ length: ex.sets }, () => ex.rir));
  const [swapping, setSwapping] = useState(false);
  const today = localDate();

  const note =
    suggested === null ? (chosen === undefined ? "kg · pick a starting weight" : "kg · your starting weight")
      : weight === suggested ? `kg · ${sug?.reason ?? "same as last time"}`
        : `kg · your override (suggested ${fmtKg(suggested)})`;

  const setWeight = (w: number) => actions.patchActive({ weights: { ...s.active!.weights, [ex.id]: Math.max(0, w) } });
  const repOptions = ex.repRange ? Array.from({ length: ex.repRange[1] + 6 }, (_, i) => i + 1) : [];
  const canSwap = s.programSource === "generated" && !Array.from({ length: ex.sets }, (_, i) => isDone(i)).some(Boolean);

  return (
    <div className="flex flex-col gap-4 p-[18px] bg-surface rounded-[22px] border border-line">
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-display text-2xl font-semibold tracking-tightish">{ex.name}</h1>
          <span className="text-[13px] text-muted">
            Exercise {index + 1} of {total} · {ex.sets} × {ex.repsLabel} · leave {ex.rir} in reserve
          </span>
        </div>
        <div className="flex gap-2 flex-none">
          {canSwap && (
            <button onClick={() => setSwapping(!swapping)} aria-expanded={swapping}
              className="h-11 px-3 rounded-[14px] bg-chalk text-[13px] font-semibold">Swap</button>
          )}
          <a href={ex.demoUrl} target="_blank" rel="noreferrer" aria-label={`Watch ${ex.name} demo`}
            className="w-11 h-11 rounded-[14px] bg-chalk flex items-center justify-center text-ink">
            <Icon name="video" />
          </a>
        </div>
      </div>

      {swapping && <SwapPanel exerciseId={ex.id} weekday={weekday} onClose={() => setSwapping(false)} />}

      <div className="flex items-center justify-between p-2 bg-graphite rounded-[18px]">
        <button aria-label="Decrease weight by 2.5 kilograms" onClick={() => setWeight(weight - 2.5)}
          className="w-[52px] h-[52px] rounded-[14px] bg-graphite-2 text-on-dark flex items-center justify-center">
          <Icon name="minus" strokeWidth={2.2} />
        </button>
        <div className="flex flex-col items-center gap-0.5 px-2 text-center">
          <span className="font-display text-[34px] font-semibold text-on-dark tabular-nums tracking-tightish">{fmtKg(weight)}</span>
          <span className="text-xs text-muted-dark">{note}</span>
        </div>
        <button aria-label="Increase weight by 2.5 kilograms" onClick={() => setWeight(weight + 2.5)}
          className="w-[52px] h-[52px] rounded-[14px] bg-volt text-ink flex items-center justify-center">
          <Icon name="plus" strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_44px_48px] gap-2 px-1 text-[11px] font-semibold tracking-[0.06em] text-muted">
          <span>SET</span><span>REPS</span><span>LOAD</span><span>RIR</span><span className="text-right">DONE</span>
        </div>
        {Array.from({ length: ex.sets }, (_, i) => {
          const d = isDone(i);
          const logged = s.setLogs.find((l) => l.exerciseId === ex.id && l.setIndex === i && localDate(new Date(l.completedAt)) === today);
          return (
            <div key={i} className={`grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_44px_48px] gap-2 items-center p-1 rounded-xl ${d ? "bg-chalk" : ""}`}>
              <span className="font-display font-semibold text-[15px] pl-1.5">{i + 1}</span>
              {ex.repRange && !d ? (
                <select value={reps[i]} aria-label={`Reps for set ${i + 1}`}
                  onChange={(e) => setReps(reps.map((r, j) => (j === i ? Number(e.target.value) : r)))}
                  className="bg-transparent text-sm py-2 -ml-1 text-[#3A3A40]">
                  {repOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <span className="text-sm text-[#3A3A40]">{ex.repRange ? logged?.reps ?? reps[i] : ex.repsLabel}</span>
              )}
              <span className="text-sm font-semibold tabular-nums">{fmtKg(logged?.weightKg ?? weight)} kg</span>
              {!d ? (
                <select value={rirs[i]} aria-label={`Reps in reserve for set ${i + 1}`}
                  onChange={(e) => setRirs(rirs.map((r, j) => (j === i ? Number(e.target.value) : r)))}
                  className="bg-transparent text-sm py-2 -ml-1 text-[#3A3A40]">
                  {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <span className="text-sm text-[#3A3A40]">{logged?.rir ?? rirs[i]}</span>
              )}
              <button aria-label={d ? `Mark set ${i + 1} incomplete` : `Mark set ${i + 1} complete`}
                onClick={() => actions.toggleSet(
                  { exerciseId: ex.id, setIndex: i, weightKg: weight, reps: ex.repRange ? reps[i] : 0, rir: rirs[i] },
                  d ? null : ex.restSec,
                )}
                className={`justify-self-end w-11 h-11 rounded-xl flex items-center justify-center ${
                  d ? "bg-ink text-volt" : "border-[1.5px] border-hairline-dot bg-surface text-hairline-dot"}`}>
                <Icon name="check" strokeWidth={2.6} />
              </button>
            </div>
          );
        })}
      </div>
      {ex.notes && <span className="text-xs text-muted">Cue: {ex.notes}</span>}
    </div>
  );
}

/** Proposes a replacement and shows the change as before/after; nothing is saved without Apply. */
function SwapPanel({ exerciseId, weekday, onClose }: { exerciseId: string; weekday: number; onClose: () => void }) {
  const s = useAppState();
  const program = s.program as Program;
  const day = program.days.find((d) => d.weekday === weekday);
  const [pending, setPending] = useState<{ program: Program; diff: ProgramDiff } | null>(null);
  if (!day) return null;
  const alts = alternativesFor(program, day.key, exerciseId).slice(0, 5);

  if (pending) {
    return (
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-chalk">
        <span className="text-xs font-semibold tracking-[0.06em] text-muted">PROPOSED CHANGE · {pending.diff.dayLabel.toUpperCase()}</span>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span className="text-sm line-through text-muted">{pending.diff.before}</span>
          <span aria-hidden="true">→</span>
          <span className="text-sm font-semibold">{pending.diff.after}</span>
        </div>
        <span className="text-xs text-muted">Same sets and reps. Applies to this and future {pending.diff.dayLabel} sessions.</span>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPending(null)} className="h-11 rounded-xl border border-hairline-strong bg-surface text-sm font-semibold">Not now</button>
          <button onClick={() => { actions.saveProgram(pending.program, { restart: false }); onClose(); }}
            className="h-11 rounded-xl bg-ink text-volt text-sm font-semibold">Apply</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-chalk">
      <span className="text-xs font-semibold tracking-[0.06em] text-muted px-1">SWAP FOR · same muscles, your equipment</span>
      {alts.length === 0 && <span className="text-[13px] text-muted px-1">No other options fit your equipment and limitations.</span>}
      {alts.map((a) => (
        <button key={a.id} onClick={() => setPending(swapExercise(program, day.key, exerciseId, a.id))}
          className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-surface text-left">
          <span className="text-sm font-semibold">{a.name}</span>
          <span className="text-xs text-muted">{a.compound ? "compound" : "isolation"}</span>
        </button>
      ))}
    </div>
  );
}
