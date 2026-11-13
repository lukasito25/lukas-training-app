import { useEffect, useState } from "preact/hooks";
import { host, onHostChange } from "./host";
import { Ask, Btn, Chip, fmt, Icon, mmss, Stepper, useNav } from "./ui";
import type { Alt, ChangeData, Ex, TodayData } from "./types";

const SLEEP = [{ v: 5, l: "≤5 h" }, { v: 6, l: "6 h" }, { v: 7, l: "7 h" }, { v: 8, l: "8+ h" }];
const ENERGY = [{ v: 1, l: "Drained" }, { v: 2, l: "Low" }, { v: 3, l: "OK" }, { v: 4, l: "Good" }, { v: 5, l: "Great" }];
const SORE = [{ v: "none", l: "None" }, { v: "low", l: "A bit" }, { v: "mid", l: "Sore" }, { v: "high", l: "Very" }, { v: "max", l: "Wrecked" }];

const target = (e: Ex) => `${e.sets} × ${e.reps}${e.timed ? "" : ` @ ${e.rir} RIR`}`;
const load = (e: Ex) => (e.bodyweight ? "Bodyweight" : e.suggestedKg != null ? `${fmt(e.suggestedKg)} kg` : null);

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function useDisplayMode() {
  const [mode, setMode] = useState(host.displayMode());
  useEffect(() => onHostChange(() => setMode(host.displayMode())), []);
  return mode;
}

function Hero({ d, live }: { d: TodayData; live: boolean }) {
  const mode = useDisplayMode();
  const nav = useNav();
  const pct = d.totalSets ? Math.round((d.setsLogged / d.totalSets) * 100) : 0;
  return (
    <div class="hero">
      <span class="kicker">{d.dayName} · Week {d.week} · {d.block}{d.deload ? " · Deload" : ""}</span>
      <p class="title">{d.training ? `${d.label}: ${d.title}` : d.title}</p>
      <span class="sub">{d.training ? `${d.workingSets} sets · ~${d.estMinutes} min` : "Recovery day"}{d.checkin ? ` · slept ${d.checkin.sleepHours} h` : ""}</span>
      {(live || d.status !== "not_started") && d.training && (
        <div class="col" style="gap:4px;margin-top:4px">
          <div class="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Sets logged"><i style={`width:${pct}%`} /></div>
          <span class="sub">{d.setsLogged} of {d.totalSets} sets logged</span>
        </div>
      )}
      <div class="dots" aria-label={`This week: ${d.sessionsThisWeek.done} of ${d.sessionsThisWeek.planned} sessions`} style="margin-top:4px">
        {d.weekDots.map((w) => <span key={w.weekday} class={`dot ${w.status}`} title={w.status}>{w.label}</span>)}
      </div>
      {host.can.fullscreen() && (
        <button class="icon-btn" aria-label={mode === "fullscreen" ? "Exit full screen" : "Full screen"}
          onClick={() => host.fullscreen(mode !== "fullscreen").catch(() => nav.error("Full screen isn't available here."))}>
          <Icon name={mode === "fullscreen" ? "back" : "expand"} />
        </button>
      )}
    </div>
  );
}

function Checkin({ onSkip }: { onSkip: () => void }) {
  const nav = useNav();
  const [sleep, setSleep] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sore, setSore] = useState<string | null>(null);
  return (
    <div class="note col" style="gap:10px">
      <div class="between"><b>Quick check-in</b><button class="link" onClick={onSkip}>Skip</button></div>
      <span class="m" style="margin-top:-6px">LiftWise trims the session if you're under-recovered.</span>
      <div class="col" style="gap:6px"><span class="label">Sleep</span>
        <div class="chips">{SLEEP.map((o) => <Chip key={o.v} on={sleep === o.v} onClick={() => setSleep(o.v)}>{o.l}</Chip>)}</div></div>
      <div class="col" style="gap:6px"><span class="label">Energy</span>
        <div class="chips">{ENERGY.map((o) => <Chip key={o.v} on={energy === o.v} onClick={() => setEnergy(o.v)}>{o.l}</Chip>)}</div></div>
      <div class="col" style="gap:6px"><span class="label">Soreness</span>
        <div class="chips">{SORE.map((o) => <Chip key={o.v} on={sore === o.v} onClick={() => setSore(o.v)}>{o.l}</Chip>)}</div></div>
      <Btn kind="small" busyKey="log_checkin" disabled={sleep == null || energy == null || sore == null}
        onClick={() => nav.run("log_checkin", { sleep_hours: sleep, energy, soreness: sore })}>Save check-in</Btn>
    </div>
  );
}

/** Swap flow inside a card: alternatives → before/after preview → Apply. */
export function SwapFlow({ exerciseId, weekday, onClose }: { exerciseId: string; weekday: number; onClose: () => void }) {
  const nav = useNav();
  const [alts, setAlts] = useState<Alt[] | null>(null);
  const [preview, setPreview] = useState<ChangeData | null>(null);
  useEffect(() => {
    nav.run("swap_exercise", { exercise: exerciseId, weekday }, { keep: true }).then((r) => {
      if (r) setAlts(((r as unknown as ChangeData).alternatives) ?? []);
      else onClose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the exercise/set/view changes
  }, [exerciseId]);
  if (preview) {
    return (
      <div class="diff">
        <span class="label">Proposed change · {preview.dayLabel}</span>
        <span class="from">{preview.before}</span>
        <span class="to">→ {preview.after}</span>
        <span class="m">Sets, reps and progression carry over. Nothing changes until you apply.</span>
        <div class="row">
          <Btn kind="small" busyKey="swap_exercise" onClick={() => nav.run("swap_exercise", preview.confirmArgs)}>Apply change</Btn>
          <button class="link" onClick={onClose}>Not now</button>
        </div>
      </div>
    );
  }
  if (!alts) return <span class="m" role="status">Finding alternatives…</span>;
  if (!alts.length) return <span class="m">No suitable swaps with your equipment. <button class="link" onClick={onClose}>Close</button></span>;
  return (
    <div class="col" style="gap:6px">
      <div class="between"><span class="label">Swap for</span><button class="link" onClick={onClose}>Cancel</button></div>
      <div class="chips">
        {alts.map((a) => (
          <Chip key={a.id} tall onClick={async () => {
            const r = await nav.run("swap_exercise", { exercise: exerciseId, weekday, replacement: a.id }, { keep: true });
            if (r) setPreview(r as unknown as ChangeData);
          }}>{a.name}<small>{a.equipment.join(", ") || "Bodyweight"}</small></Chip>
        ))}
      </div>
    </div>
  );
}

export function ExerciseDetail({ e, weekday, onStart }: { e: Ex; weekday: number; onStart?: () => void }) {
  const [swapping, setSwapping] = useState(false);
  return (
    <div class="detail">
      {e.cues.length > 0 && <ul class="cues">{e.cues.map((c) => <li key={c}>{c}</li>)}</ul>}
      <dl class="kv">
        <dt>Works</dt><dd>{[e.primary, ...e.muscles.filter((m) => m.toLowerCase() !== e.primary?.toLowerCase())].filter(Boolean).slice(0, 4).join(", ").replace(/_/g, " ")}</dd>
        <dt>Target</dt><dd>{target(e)}{load(e) ? ` · ${load(e)}` : ""}</dd>
        {e.restSec ? <><dt>Rest</dt><dd>{mmss(e.restSec)} between sets</dd></> : null}
        {e.lastTime && <><dt>Last time</dt><dd>{e.lastTime.sets.map((s) => `${fmt(s.weightKg)}×${s.reps}`).join(", ")}</dd></>}
        {e.suggestion && <><dt>Why</dt><dd>{e.suggestion}</dd></>}
      </dl>
      {swapping ? <SwapFlow exerciseId={e.id} weekday={weekday} onClose={() => setSwapping(false)} /> : (
        <div class="row" style="flex-wrap:wrap;gap:6px">
          {onStart && <button class="btn small" onClick={onStart}>Start here</button>}
          <button class="btn ghost small" onClick={() => host.openLink(e.demoUrl)}>Demo <Icon name="ext" size={14} /></button>
          <button class="btn ghost small" onClick={() => setSwapping(true)}>Swap</button>
          <Ask text={`How do I do ${e.name} properly? Anything I should watch out for?`}>Ask coach</Ask>
        </div>
      )}
    </div>
  );
}

function Overview({ d, onStart }: { d: TodayData; onStart: (i?: number) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div class="list">
      {d.exercises.map((e, i) => {
        const n = e.setsDone.length, full = n >= e.sets, isOpen = open === e.id;
        return (
          <div key={e.id} class={`ex${isOpen ? " open" : ""}`}>
            <button class="ex-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : e.id)}>
              <div class="grow">
                <div class="name">{e.name}</div>
                <div class="m">{target(e)}{load(e) ? ` · ${load(e)}` : ""}</div>
              </div>
              <span class={`pill${full ? " done" : ""}`}>{n}/{e.sets}</span>
              <span class="chev"><Icon name="chev" /></span>
            </button>
            {isOpen && <ExerciseDetail e={e} weekday={d.weekday} onStart={full ? undefined : () => onStart(i)} />}
          </div>
        );
      })}
    </div>
  );
}

function Live({ d, focus, setFocus, onOverview }: { d: TodayData; focus: number | null; setFocus: (i: number | null) => void; onOverview: () => void }) {
  const nav = useNav();
  const idx = focus ?? d.current?.index ?? -1;
  const e = idx >= 0 ? d.exercises[idx] : null;
  const last = e?.setsDone[e.setsDone.length - 1];
  const setNo = e ? e.setsDone.length + 1 : 0;
  const [kg, setKg] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const now = useNow(restUntil != null);
  const restLeft = restUntil ? Math.ceil((restUntil - now) / 1000) : 0;
  useEffect(() => { if (restUntil && restLeft <= 0) setRestUntil(null); }, [restLeft, restUntil]);

  // New exercise or set: prefill from what they just did, else the suggestion.
  useEffect(() => {
    if (!e) return;
    setKg(last?.weightKg ?? e.startKg);
    setReps(last?.reps ?? e.startReps);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the exercise/set/view changes
  }, [e?.id, setNo]);

  useEffect(() => {
    if (!e) return;
    host.context(
      `LiftWise live session: ${d.setsLogged}/${d.totalSets} sets logged. Now on ${e.name}, set ${setNo} of ${e.sets} (target ${e.reps}${e.timed ? "" : ` @ ${e.rir} RIR`}${kg != null ? `, ${fmt(kg)} kg entered` : ""}).`,
      { mode: "live", exerciseId: e.id, set: setNo },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the exercise/set/view changes
  }, [e?.id, setNo, d.setsLogged]);

  if (!e) {
    return (
      <div class="col">
        <div class="note ok"><b>Every set is logged.</b> Finish the workout to count it for the week.</div>
        <Btn kind="volt block" busyKey="complete_workout" onClick={() => nav.run("complete_workout", { weekday: d.weekday })}>Finish workout</Btn>
        <button class="link" onClick={onOverview}>See all exercises</button>
      </div>
    );
  }

  const log = async () => {
    if (kg == null || reps == null) return nav.error("Enter the weight and reps first.");
    const r = await nav.run("log_set", { exercise: e.id, weight_kg: kg, reps, set_number: setNo, weekday: d.weekday });
    if (!r) return;
    const fresh = r as unknown as TodayData;
    const me = fresh.exercises.find((x) => x.id === e.id);
    if (me && me.setsDone.length >= me.sets) setFocus(null);
    if (fresh.current && e.restSec) setRestUntil(Date.now() + e.restSec * 1000);
  };

  const upcoming = d.exercises.map((x, i) => ({ x, i })).filter(({ x, i }) => i !== idx && x.setsDone.length < x.sets);
  const shown = showAll ? upcoming : upcoming.slice(0, 2);

  return (
    <div class="col" style="gap:12px">
      {restUntil && restLeft > 0 && (
        <div class="rest" role="status" aria-live="polite">
          <div class="grow"><span class="sub">Rest</span><br /><b>{mmss(restLeft)}</b></div>
          <button class="btn volt small" onClick={() => setRestUntil(null)}>Skip rest</button>
        </div>
      )}
      <div class="focus">
        <div class="col" style="gap:2px">
          <span class="kicker" style="color:var(--muted)">Now · set {setNo} of {e.sets}{setNo > e.sets ? " (extra)" : ""}</span>
          <span class="h2">{e.name}</span>
          <span class="m">{e.reps}{e.timed ? "" : ` reps @ ${e.rir} RIR`}{e.suggestedKg != null ? ` · suggested ${fmt(e.suggestedKg)} kg` : ""}</span>
          {e.suggestion && setNo === 1 && <span class="m">{e.suggestion}</span>}
        </div>
        <div class="steppers">
          <Stepper label={e.bodyweight ? "Added kg" : "Weight kg"} unit="kg" value={kg} step={2.5} max={1000} onChange={setKg} />
          <Stepper label={e.timed ? "Reps / m" : "Reps"} value={reps} step={1} max={200} onChange={setReps} />
        </div>
        {e.setsDone.length > 0 && (
          <div class="setchips" aria-label="Logged sets">
            {e.setsDone.map((s) => <span key={s.set} class="setchip">{s.set} · {fmt(s.weightKg)}×{s.reps}</span>)}
            <button class="link" aria-label="Undo last set" onClick={() => { setRestUntil(null); nav.run("delete_set", { exercise: e.id, set_number: last!.set, weekday: d.weekday }); }}>
              Undo
            </button>
          </div>
        )}
        <Btn kind="block" busyKey="log_set" disabled={kg == null || reps == null} onClick={log}>Log set {setNo}{kg != null && reps != null ? ` · ${fmt(kg)} × ${reps}` : ""}</Btn>
        <div class="row" style="gap:12px">
          <button class="link" onClick={() => host.openLink(e.demoUrl)}>How to do it</button>
          {e.cues[0] && <span class="m grow">{e.cues[0]}</span>}
        </div>
      </div>
      {upcoming.length > 0 && (
        <div class="col" style="gap:4px">
          <span class="label">Up next</span>
          <div class="list">
            {shown.map(({ x, i }) => (
              <button key={x.id} class="ex-head ex" onClick={() => setFocus(i)}>
                <div class="grow"><div class="name">{x.name}</div><div class="m">{target(x)}{load(x) ? ` · ${load(x)}` : ""}</div></div>
                <span class="pill">{x.setsDone.length}/{x.sets}</span>
              </button>
            ))}
          </div>
          {upcoming.length > 2 && <button class="link" style="align-self:flex-start" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : `+ ${upcoming.length - 2} more`}</button>}
        </div>
      )}
      <div class="between">
        <button class="link" onClick={onOverview}>All exercises</button>
        <Btn kind="ghost small" busyKey="complete_workout" onClick={() => nav.run("complete_workout", { weekday: d.weekday })}>Finish workout</Btn>
      </div>
    </div>
  );
}

function Done({ d }: { d: TodayData }) {
  const nav = useNav();
  const s = d.summary;
  return (
    <div class="col" style="gap:12px">
      <div class="note ok row"><Icon name="check" /><b>Session complete.</b></div>
      <div class="grid3">
        <div class="stat"><b>{s?.sets ?? 0}</b><span class="m">sets</span></div>
        <div class="stat"><b>{s ? `${Math.round(s.volumeKg / 100) / 10}t` : "–"}</b><span class="m">volume</span></div>
        <div class="stat"><b>{d.sessionsThisWeek.done}/{d.sessionsThisWeek.planned}</b><span class="m">this week</span></div>
      </div>
      {s && s.bests.length > 0 && (
        <div class="note"><b>New bests</b>{s.bests.map((b) => <div key={b.name}>{b.name} · {fmt(b.weightKg)} kg × {b.reps}</div>)}</div>
      )}
      {host.can.message() && (
        <div class="col" style="gap:6px">
          <span class="label">How did it feel?</span>
          <div class="chips">
            {["Easy", "Just right", "Hard", "Something hurt"].map((f) => (
              <Chip key={f} onClick={() => host.say(f === "Something hurt" ? "Something hurt during today's session." : `Today's session felt ${f.toLowerCase()}. Anything to adjust next time?`).catch(() => undefined)}>{f}</Chip>
            ))}
          </div>
        </div>
      )}
      <Btn kind="ghost small" busyKey="get_weekly_review" onClick={() => nav.run("get_weekly_review", { week: "this" })}>See this week</Btn>
    </div>
  );
}

export function Today({ d }: { d: TodayData }) {
  const saved = host.savedState();
  const [mode, setMode] = useState<"overview" | "live">(saved.mode === "live" || d.status === "in_progress" ? "live" : "overview");
  const [focus, setFocus] = useState<number | null>(null);
  const [skipCheckin, setSkipCheckin] = useState(false);
  const nav = useNav();

  // Back in the chat after a while (or sets logged by message): refresh the session.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && mode === "live") {
        host.call("get_today_workout", { weekday: d.weekday }).then((r) => r.view === "today" && nav.show(r as unknown as TodayData)).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the exercise/set/view changes
  }, [mode, d.weekday]);

  const start = (i?: number) => {
    setFocus(i ?? null);
    setMode("live");
  };

  return (
    <div class="card">
      <Hero d={d} live={mode === "live"} />
      {d.applied && <div class="note ok">Swapped: {d.applied.before} → {d.applied.after} (program v{d.applied.version}).</div>}
      {d.saved && <div class="note ok">Plan saved. {d.training ? "Here's today's session." : "Today is a rest day — your first session is up next."}</div>}
      {d.adjustment && d.status !== "done" && <div class="note">Adjusted for readiness: {d.adjustment}.</div>}
      {!d.training ? (
        <div class="col">
          <span class="m">No lifting today. Light movement helps recovery: a walk, mobility, easy cardio.</span>
          <div class="row" style="flex-wrap:wrap;gap:6px">
            <Ask text="Give me a 15-minute mobility routine for my rest day." kind="small">Mobility routine</Ask>
            <Ask text="What's my next training session?">Next session</Ask>
          </div>
        </div>
      ) : d.status === "done" ? (
        <Done d={d} />
      ) : mode === "live" ? (
        <Live d={d} focus={focus} setFocus={setFocus} onOverview={() => setMode("overview")} />
      ) : (
        <>
          {d.checkinNeeded && !skipCheckin && <Checkin onSkip={() => setSkipCheckin(true)} />}
          <Overview d={d} onStart={start} />
          <Btn kind="volt block" onClick={() => start()}>
            {d.status === "in_progress" ? `Resume session · ${d.setsLogged}/${d.totalSets} sets` : d.isToday ? "Start session" : `Start ${d.dayName}'s session`}
          </Btn>
        </>
      )}
    </div>
  );
}
