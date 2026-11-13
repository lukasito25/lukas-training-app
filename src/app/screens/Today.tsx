import { Bar, Card, Icon, type Tab } from "../ui";
import { fmtKg, suggestionFor, useToday } from "../today";
import { localDate, useAppState } from "../store";
import { useGoal } from "../goal";

const greeting = (h: number) => (h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening");

export default function Today({ go }: { go: (t: Tab) => void }) {
  const s = useAppState();
  // If a session is in progress today (e.g. an extra session on a rest day), Today shows that one.
  const t = useToday(s.active?.date === localDate() ? s.active.weekday : undefined)!;
  const goal = useGoal();
  const now = new Date();
  const { session, adjustment, checkin, position } = t;
  const done = s.completed.some((c) => c.date === t.date && c.weekday === t.weekday);

  const doneHabits = new Set(s.habitDone[t.date] ?? []);
  const groups = (["FOOD", "WATER", "SUPPS", "OTHER"] as const).map((g) => {
    const items = s.habits.filter((h) => h.group === g);
    return { g, done: items.filter((h) => doneHabits.has(h.id)).length, total: items.length };
  }).filter((x) => x.total > 0).slice(0, 3);
  const groupLabel = { FOOD: "Protein meals", WATER: "Water", SUPPS: "Supplements", OTHER: "Other" } as const;

  return (
    <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-muted font-medium">
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish">
            {greeting(now.getHours())}{s.name ? `, ${s.name}` : ""}
          </h1>
        </div>
        <button aria-label="Profile" onClick={() => go("you")}
          className="w-11 h-11 rounded-full bg-ink text-volt font-display font-semibold text-base">
          {(s.name || "?").slice(0, 1).toUpperCase()}
        </button>
      </div>

      {/* Check-in */}
      <div className="flex items-center gap-3 py-2.5 pr-2.5 pl-3.5 bg-surface rounded-2xl border border-line">
        <Icon name="moon" />
        <div className="flex-1 flex flex-col gap-px">
          {checkin ? (
            <>
              <span className="text-[13px] font-semibold">
                Check-in · slept {checkin.sleepHours >= 9 ? "9+" : checkin.sleepHours} h, energy {checkin.energy}/5
              </span>
              <span className="text-xs text-muted">Soreness: {checkin.soreness}</span>
            </>
          ) : (
            <>
              <span className="text-[13px] font-semibold">How did you sleep?</span>
              <span className="text-xs text-muted">A 10-second check-in shapes today's volume</span>
            </>
          )}
        </div>
        <button onClick={() => go("habits")} className="flex items-center h-9 px-3 rounded-[10px] bg-chalk text-[13px] font-medium">
          {checkin ? "Edit" : "Check in"}
        </button>
      </div>

      {/* Block progress */}
      <Card className="flex flex-col gap-2 px-4 py-3.5 !rounded-2xl">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[13px] font-semibold">Block {position.block} · {t.blockName}</span>
          <span className="text-xs text-muted">Week {position.week} of {t.plan.weeksPerBlock} · {position.overallWeek} / {position.totalWeeks} overall</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${t.plan.weeksPerBlock}, minmax(0, 1fr))` }}>
          {Array.from({ length: t.plan.weeksPerBlock }, (_, i) => (
            <div key={i} className={`h-1.5 rounded-[3px] ${i + 1 < position.week ? "bg-ink" : i + 1 === position.week ? "bg-volt-ink-bar" : "bg-line"}`} />
          ))}
        </div>
      </Card>

      {/* Today's session */}
      <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-5 bg-graphite text-on-dark rounded-3xl">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold tracking-label text-volt">TODAY · {session.label.toUpperCase()}</span>
          {session.training && <span className="text-xs text-muted-dark">~{session.estMinutes} min</span>}
        </div>
        {session.training ? (
          <>
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 font-display text-[26px] font-semibold tracking-tightish leading-[1.1]">{session.title}</h2>
              <span className="text-sm text-muted-dark">
                {session.exercises.length} exercises · {session.workingSets} working sets{session.deload ? " · deload week" : ""}
              </span>
            </div>
            {adjustment.reason && (
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-[10px] bg-graphite-2 text-xs text-[#E1E1E4]">
                <Icon name="down" size={14} strokeWidth={2.2} className="text-volt flex-none" />
                {adjustment.reason}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {session.exercises.slice(0, 2).map((e) => {
                const sug = suggestionFor(s, e);
                return (
                  <span key={e.id} className="text-xs px-2.5 py-[5px] rounded-full bg-graphite-2 text-[#E1E1E4]">
                    {e.name} {e.sets}×{e.repsLabel}{sug?.weightKg != null ? ` · ${fmtKg(sug.weightKg)} kg` : ""}
                  </span>
                );
              })}
              {session.exercises.length > 2 && (
                <span className="text-xs px-2.5 py-[5px] rounded-full bg-graphite-2 text-[#E1E1E4]">+{session.exercises.length - 2} more</span>
              )}
            </div>
            <button onClick={() => go("train")}
              className="flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-volt text-ink font-semibold text-base">
              <Icon name={done ? "check" : "play"} size={18} />
              {done ? "Done · review session" : s.active?.date === t.date ? "Resume session" : "Start session"}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 font-display text-[26px] font-semibold tracking-tightish leading-[1.1]">Recovery day</h2>
            <span className="text-sm text-muted-dark">
              Growth happens between sessions. Walk, sleep 8 h+, and hit your protein. Want to train anyway? Pick a session in Train.
            </span>
          </div>
        )}
      </div>

      {/* Goal + week */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2.5 p-4">
          <span className="text-xs text-muted font-medium">Goal · {goal.label}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[30px] font-semibold tracking-tightish">{goal.current != null ? goal.format(goal.current) : "—"}</span>
            {goal.target != null && <span className="text-xs text-muted">→ {goal.format(goal.target)}</span>}
          </div>
          <Bar pct={goal.progressPct ?? 0} />
          {goal.delta != null ? (
            <span className={`text-xs font-semibold ${goal.deltaGood ? "text-volt-ink" : "text-muted"}`}>
              {goal.delta > 0 ? "+" : ""}{goal.format(goal.delta)} since start
            </span>
          ) : (
            <button onClick={() => go("progress")} className="text-left text-xs text-volt-ink font-semibold">{goal.cta}</button>
          )}
        </Card>
        <Card className="flex flex-col gap-2.5 p-4">
          <span className="text-xs text-muted font-medium">This week</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[30px] font-semibold tracking-tightish">{t.sessionsThisWeek.done}/{t.sessionsThisWeek.planned}</span>
            <span className="text-xs text-muted">sessions</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {t.week.map((w) => (
              <div key={w.weekday} className="flex flex-col items-center gap-1" title={`${t.plan.dayLabel(w.weekday)} · ${w.status}`}>
                <div className={`w-2.5 h-2.5 rounded-full box-border ${
                  w.status === "done" ? "bg-ink" : w.status === "today" ? "border-2 border-ink" : w.status === "rest" ? "bg-hairline-dot" : "bg-line"}`} />
                <span className={`text-[10px] ${w.status === "today" ? "text-ink font-bold" : "text-muted"}`}>{w.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Habits */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">Habits today</span>
          <button onClick={() => go("habits")} className="text-[13px] font-medium text-muted">{doneHabits.size} of {s.habits.length} ›</button>
        </div>
        {groups.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {groups.map(({ g, done, total }) => (
              <div key={g} className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">{groupLabel[g]}</span>
                <span className="font-display text-lg font-semibold">{done} / {total}</span>
                <Bar pct={(done / total) * 100} height={4} />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-muted">Add the habits you want to track in Habits.</span>
        )}
      </Card>
    </div>
  );
}
