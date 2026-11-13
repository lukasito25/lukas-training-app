import { useMemo, useState } from "react";
import { summarizeWeek, type Measurement } from "@fitness/core";
import { Card, Icon } from "../ui";
import { actions, localDate, parseLocal, useAppState } from "../store";
import { exerciseName, fmtKg } from "../today";
import { formatMetric, METRIC_LABEL, series, type Metric, type Series } from "../goal";

export default function Progress() {
  const s = useAppState();
  const defaultMetric: Metric = s.goalMetric === "none" ? "weight" : s.goalMetric;
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const [logging, setLogging] = useState(false);
  const sr = useMemo(() => series(s, metric), [s, metric]);
  const metrics: Metric[] = ["ffmi", "weight", "arms"];
  if (s.goalMetric === "bodyfat") metrics.splice(2, 0, "bodyfat");

  return (
    <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
      <div className="flex justify-between items-center gap-2">
        <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish">Progress</h1>
        <div role="tablist" aria-label="Metric" className="flex p-[3px] gap-[3px] bg-line rounded-xl">
          {metrics.map((m) => (
            <button key={m} role="tab" aria-selected={metric === m} onClick={() => setMetric(m)}
              className={`h-9 px-3 rounded-[9px] text-[13px] font-semibold ${metric === m ? "bg-surface text-ink" : "text-muted"}`}>
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      <TrendCard sr={sr} onLog={() => setLogging(true)} needsHeight={metric === "ffmi" && !s.heightCm} />
      <WeeklyReviewCard />
      <MeasurementsCard logging={logging} setLogging={setLogging} />
    </div>
  );
}

function TrendCard({ sr, onLog, needsHeight }: { sr: Series; onLog: () => void; needsHeight: boolean }) {
  const f = formatMetric(sr.metric);
  const latest = sr.points[sr.points.length - 1];
  const W = 350, H = 160, PAD = 12;

  if (sr.points.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-[18px] bg-graphite text-on-dark rounded-3xl">
        <span className="text-xs font-semibold tracking-label text-volt">{METRIC_LABEL[sr.metric].toUpperCase()}</span>
        <span className="text-sm text-muted-dark">
          {needsHeight
            ? "FFMI needs your height and a body-fat estimate. Log a measurement to start your trend."
            : "No measurements yet. Weekly check-ins on the same day and time give the cleanest trend."}
        </span>
        <button onClick={onLog} className="h-11 rounded-xl bg-volt text-ink font-semibold text-sm">Log a measurement</button>
      </div>
    );
  }

  const values = sr.points.map((p) => p.value).concat(sr.target != null ? [sr.target] : []);
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  const maxWeek = Math.max(sr.goalWeek, ...sr.points.map((p) => p.week));
  const x = (w: number) => PAD + (Math.max(0, w) / maxWeek) * (W - 2 * PAD);
  const y = (v: number) => 130 - ((v - lo) / span) * 100;
  const start = sr.points[0];
  const paceText = sr.reached ? "Goal reached" : {
    on_pace: "On pace", ahead: "Ahead", behind: "Behind", not_enough_data: sr.target != null ? "Need 2+ entries" : "No target",
  }[sr.pace.status];

  return (
    <div className="flex flex-col gap-3 p-[18px] bg-graphite text-on-dark rounded-3xl">
      <div className="flex justify-between items-start">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[34px] font-semibold tracking-tightish">{f(latest.value)}</span>
          {sr.target != null && <span className="text-sm text-muted-dark">goal {f(sr.target)}</span>}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${sr.pace.status === "behind" ? "bg-graphite-2 text-on-dark" : "bg-volt text-ink"}`}>{paceText}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`${METRIC_LABEL[sr.metric]} from ${f(start.value)} to ${f(latest.value)} over ${sr.points.length} measurements${sr.target != null ? `, goal ${f(sr.target)} by week ${sr.goalWeek}` : ""}`}>
        {[30, 80, 130].map((gy) => <line key={gy} x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="#2C2D33" strokeWidth="1" />)}
        {sr.target != null && !sr.reached && (
          <line x1={x(start.week)} y1={y(start.value)} x2={x(sr.goalWeek)} y2={y(sr.target)} stroke="#6A6B72" strokeWidth="1.5" strokeDasharray="4 5" />
        )}
        <polyline points={sr.points.map((p) => `${x(p.week)},${y(p.value)}`).join(" ")} fill="none" stroke="#D4F55A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(latest.week)} cy={y(latest.value)} r="5" fill="#D4F55A" stroke="#141518" strokeWidth="2" />
        {sr.target != null && <text x={W - PAD} y="22" textAnchor="end" fontSize="11" fill="#A9A9B0">{f(sr.target)} · wk {sr.goalWeek}</text>}
        <text x={PAD} y="148" fontSize="11" fill="#A9A9B0">{f(start.value)} · start</text>
        <text x={Math.min(W - 40, x(latest.week) + 10)} y={y(latest.value) - 4} fontSize="11" fill="#F4F4F0" fontWeight="600">wk {Math.round(latest.week)}</text>
      </svg>
      <span className="text-[13px] text-muted-dark">
        {sr.reached
          ? `You're at or past your goal of ${f(sr.target!)}. Set a new target in You › Goals & schedule.`
          : sr.pace.projectedWeek != null
          ? `At this pace you reach ${f(sr.target!)} around week ${sr.pace.projectedWeek}`
          : sr.target != null ? "Keep logging weekly to see your projected pace." : "Set a target in You › Goals & schedule to see your pace."}
      </span>
    </div>
  );
}

function WeeklyReviewCard() {
  const s = useAppState();
  const w = useMemo(() => summarizeWeek(s), [s]);
  if (!w) return null;
  const { review } = w;
  const rows = w.muscles.slice(0, 6);
  const from = parseLocal(w.from), last = parseLocal(w.to);
  last.setDate(last.getDate() - 1);
  const label = `${from.toLocaleDateString(undefined, { day: "numeric" })}–${last.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  const pct = review.setsPlanned ? Math.round((review.setsDone / review.setsPlanned) * 100) : 0;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold">Week {w.overallWeek} review{w.finished ? "" : " · so far"}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          [`${review.sessionsDone}/${review.sessionsPlanned}`, "sessions"],
          [String(review.newBests.length), "new bests"],
          [`${pct}%`, "sets done"],
        ].map(([v, l]) => (
          <div key={l} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-chalk">
            <span className="font-display text-xl font-semibold">{v}</span>
            <span className="text-[11px] text-muted">{l}</span>
          </div>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="grid grid-cols-[76px_minmax(0,1fr)_44px] gap-x-2 gap-y-2 items-center">
          {rows.map(({ group: g, label: name, done, planned: p }) => {
            return (
              <div key={g} className="contents">
                <span className="text-[13px]">{name}</span>
                <div className="h-1.5 rounded-[3px] bg-hairline overflow-hidden" role="img" aria-label={`${name}: ${done} of ${p} sets`}>
                  <div className="h-1.5 bg-ink" style={{ width: `${Math.min(100, (done / Math.max(1, p)) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted text-right">{done}/{p}</span>
              </div>
            );
          })}
        </div>
      )}
      {review.newBests.length > 0 ? (
        <div className="flex flex-col gap-1">
          {review.newBests.slice(0, 3).map((b) => (
            <span key={b.exerciseId} className="text-[13px]">
              <b className="font-semibold">{exerciseName(b.exerciseId)}</b> {fmtKg(b.weightKg)} kg × {b.reps}
              {b.previousWeightKg === b.weightKg ? `, up from × ${b.previousReps}` : `, up from ${fmtKg(b.previousWeightKg!)} kg × ${b.previousReps}`}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[13px] text-muted">New bests show up here once you beat a previous set.</span>
      )}
    </Card>
  );
}

function num(v: string): number | null {
  const n = Number(v.replace(",", "."));
  return v.trim() && Number.isFinite(n) ? n : null;
}

function MeasurementsCard({ logging, setLogging }: { logging: boolean; setLogging: (b: boolean) => void }) {
  const s = useAppState();
  const last = s.measurements[s.measurements.length - 1];
  const [f, setF] = useState({ weight: last ? String(last.weightKg) : "", bf: last?.bodyFatPct != null ? String(last.bodyFatPct) : "", arms: "", chest: "", waist: "", height: s.heightCm ? String(s.heightCm) : "" });
  const [error, setError] = useState("");

  const save = () => {
    const m: Measurement = {
      date: localDate(), weightKg: num(f.weight) ?? NaN, bodyFatPct: num(f.bf), armsCm: num(f.arms), chestCm: num(f.chest), waistCm: num(f.waist),
    };
    try {
      if (num(f.height) != null) actions.setProfile({ heightCm: num(f.height) });
      actions.saveMeasurement(m);
      setError("");
      setLogging(false);
    } catch {
      setError("Check the values: weight is required and numbers must be realistic.");
    }
  };

  const daysSince = last ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86_400_000) : null;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Measurements</span>
          <span className="text-xs text-muted">
            {last ? `Last: ${fmtKg(last.weightKg)} kg${last.bodyFatPct != null ? ` · ${last.bodyFatPct}% BF` : ""} · ${daysSince === 0 ? "today" : `${daysSince} d ago`}` : "Weight, body fat, arms · once a week"}
          </span>
        </div>
        <button onClick={() => setLogging(!logging)} className="h-10 px-3.5 rounded-xl bg-ink text-on-dark text-[13px] font-semibold">{logging ? "Close" : "Log"}</button>
      </div>
      {logging && (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            {([
              ["weight", "Weight (kg) *"], ["bf", "Body fat (%)"], ["arms", "Arms (cm)"], ["chest", "Chest (cm)"], ["waist", "Waist (cm)"],
              ...(!s.heightCm ? [["height", "Height (cm)"] as const] : []),
            ] as const).map(([k, label]) => (
              <label key={k} className="flex flex-col gap-1 text-xs text-muted">{label}
                <input inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.slice(0, 6) })}
                  className="h-11 px-3 rounded-xl border border-hairline-strong bg-surface text-sm text-ink" />
              </label>
            ))}
          </div>
          {error && <span className="text-xs text-danger" role="alert">{error}</span>}
          <span className="text-[11px] text-muted">FFMI uses weight, body fat and height. A bathroom-scale or caliper estimate is fine if you use the same method each time.</span>
          <button type="submit" className="h-11 rounded-xl bg-volt text-ink text-sm font-semibold">Save today's measurement</button>
        </form>
      )}
      {s.measurements.length > 0 && !logging && (
        <div className="flex flex-col">
          {[...s.measurements].reverse().slice(0, 4).map((m) => (
            <div key={m.date} className="flex justify-between items-center py-1.5 text-[13px] border-t border-hairline first:border-t-0">
              <span className="text-muted">{m.date}</span>
              <span className="flex items-center gap-2">
                {fmtKg(m.weightKg)} kg{m.bodyFatPct != null ? ` · ${m.bodyFatPct}%` : ""}{m.armsCm != null ? ` · arms ${m.armsCm}` : ""}
                <button aria-label={`Delete measurement from ${m.date}`} onClick={() => actions.removeMeasurement(m.date)} className="w-8 h-8 flex items-center justify-center text-muted">
                  <Icon name="x" size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
