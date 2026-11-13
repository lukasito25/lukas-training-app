/**
 * Derived coaching views over a user's data: the active plan (generated or classic), where the
 * user is in it, today's session after autoregulation, load suggestions, the weekly review and
 * goal-metric series. Pure functions shared by the web app and the MCP server, so ChatGPT,
 * Claude and the app always agree on "what's today".
 *
 * Dates are the user's local calendar days. On a server, pass `zonedNow(timezone)` as `now`.
 */
import { autoregulate, type Adjustment } from "./autoregulate";
import { blockName, getProgramSession, phaseShort, totalWeeks, type Program } from "./generate";
import { GROUP_LABEL, LIBRARY_BY_ID, type MuscleGroup } from "./library";
import { nextPrescription, type LoggedSet, type Suggestion } from "./progression";
import { ffmi, goalPace, weeklyReview, type Measurement, type Pace, type Point, type WeeklyReview } from "./review";
import { DAY_LABELS, getLukasSession, LUKAS_TEMPLATE, LUKAS_WEEK } from "./templates/lukas";
import { TRAINING_DAYS, type Checkin, type PrescribedExercise, type Session, type SetLog } from "./types";

// ---------- the user's data (the web store's AppState is a superset) ----------

export type HabitGroup = "FOOD" | "WATER" | "SUPPS" | "OTHER";
export interface Habit { id: string; name: string; detail: string; group: HabitGroup }
export interface CompletedSession { date: string; weekday: number; sets: number }
export interface CoachNote { id: string; text: string; source: "you" | "onboarding" | "chat"; createdAt: string }
export type GoalMetric = "ffmi" | "weight" | "bodyfat" | "none";

export interface UserData {
  name: string;
  heightCm: number | null;
  goalMetric: GoalMetric;
  goalValue: number | null;
  programSource: "classic" | "generated" | null;
  program: Program | null;
  /** ISO date of the Monday the program started (week 1). */
  programStart: string;
  checkins: Record<string, Checkin>;
  setLogs: SetLog[];
  habits: Habit[];
  habitDone: Record<string, string[]>;
  completed: CompletedSession[];
  measurements: Measurement[];
  coachNotes: CoachNote[];
}

// ---------- dates (local calendar days) ----------

export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function mondayOf(d = new Date()): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export const parseLocal = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** A Date whose local fields show the wall-clock time in `timeZone` (for servers running in UTC). */
export function zonedNow(timeZone: string, at = new Date()): Date {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
      }).formatToParts(at).map((p) => [p.type, p.value]),
    );
    return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  } catch {
    return at;
  }
}

/** Calendar day of a set log, in the same local frame as `now`. */
export const logDate = (l: SetLog, timeZone?: string) =>
  localDate(timeZone ? zonedNow(timeZone, new Date(l.completedAt)) : new Date(l.completedAt));

export const dayOfWeekIndex = (d = new Date()) => (d.getDay() + 6) % 7; // Mon = 0
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ---------- plan ----------

export type PlanSession = Session & { weekday: number };

export interface Plan {
  source: "classic" | "generated";
  totalWeeks: number;
  weeksPerBlock: number;
  blockCount: number;
  blockName: (i: number) => string;
  blockShort: (i: number) => string;
  trainingWeekdays: number[];
  dayLabel: (weekday: number) => string;
  session: (weekIndex: number, weekday: number) => PlanSession;
}

export function planFor(s: Pick<UserData, "programSource" | "program">): Plan | null {
  if (s.programSource === "generated" && s.program) {
    const p = s.program;
    return {
      source: "generated",
      totalWeeks: totalWeeks(p),
      weeksPerBlock: p.weeksPerBlock,
      blockCount: p.blocks.length,
      blockName: (i) => blockName(p.blocks, i),
      blockShort: (i) => phaseShort(p.blocks[i]),
      trainingWeekdays: p.days.map((d) => d.weekday).sort(),
      dayLabel: (wd) => p.days.find((d) => d.weekday === wd)?.label ?? "Rest",
      session: (wi, wd) => ({ ...getProgramSession(p, wi, wd), weekday: wd }),
    };
  }
  if (s.programSource === "classic") {
    const per = LUKAS_TEMPLATE.weeksPerMeso;
    return {
      source: "classic",
      totalWeeks: LUKAS_TEMPLATE.mesoCount * per,
      weeksPerBlock: per,
      blockCount: LUKAS_TEMPLATE.mesoCount,
      blockName: (i) => LUKAS_TEMPLATE.mesoNames[i + 1],
      blockShort: (i) => ["Base", "Vol", "Int", "Vol", "Int", "Peak"][i] ?? "",
      trainingWeekdays: LUKAS_WEEK.map((d, i) => (TRAINING_DAYS.includes(d) ? i : -1)).filter((i) => i >= 0),
      dayLabel: (wd) => DAY_LABELS[LUKAS_WEEK[wd]],
      session: (wi, wd) => ({ ...getLukasSession(Math.floor(wi / per) + 1, (wi % per) + 1, LUKAS_WEEK[wd]), weekday: wd }),
    };
  }
  return null;
}

export function programPosition(programStart: string, total: number, perBlock: number, now = new Date()) {
  const days = Math.floor((mondayOf(now).getTime() - parseLocal(programStart).getTime()) / 86_400_000);
  const weekIndex = Math.min(total - 1, Math.max(0, Math.round(days / 7)));
  return {
    weekIndex,
    block: Math.floor(weekIndex / perBlock) + 1,
    week: (weekIndex % perBlock) + 1,
    overallWeek: weekIndex + 1,
    totalWeeks: total,
  };
}

/** Program start (a Monday) that puts `now` in the given week. */
export function startForWeek(weekIndex: number, now = new Date()): string {
  const start = mondayOf(now);
  start.setDate(start.getDate() - weekIndex * 7);
  return localDate(start);
}

// ---------- loads ----------

/** Previous sessions' sets for one exercise, most recent session first (today excluded). */
export function exerciseHistory(s: Pick<UserData, "setLogs">, exerciseId: string, today: string, timeZone?: string): LoggedSet[][] {
  const byDate = new Map<string, LoggedSet[]>();
  for (const l of s.setLogs) {
    if (l.exerciseId !== exerciseId) continue;
    const d = logDate(l, timeZone);
    if (d === today) continue;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push({ weightKg: l.weightKg, reps: l.reps, rir: l.rir });
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([, v]) => v);
}

export function suggestionFor(s: Pick<UserData, "setLogs">, e: PrescribedExercise, today: string, timeZone?: string): Suggestion | null {
  if (!e.repRange) return null;
  return nextPrescription({ repRange: e.repRange, targetRir: e.rir, history: exerciseHistory(s, e.id, today, timeZone) });
}

// ---------- today ----------

export interface TodayView {
  plan: Plan;
  date: string;
  position: ReturnType<typeof programPosition>;
  blockName: string;
  weekday: number;
  session: PlanSession;
  adjustment: Adjustment;
  checkin: Checkin | null;
  week: { label: string; weekday: number; status: "done" | "today" | "rest" | "upcoming" | "missed" }[];
  sessionsThisWeek: { done: number; planned: number };
}

export function buildToday(s: UserData, plan: Plan, now = new Date(), weekdayOverride?: number): TodayView {
  const date = localDate(now);
  const position = programPosition(s.programStart, plan.totalWeeks, plan.weeksPerBlock, now);
  const todayIdx = dayOfWeekIndex(now);
  const weekday = weekdayOverride ?? todayIdx;
  const checkin = s.checkins[date] ?? null;
  const base = plan.session(position.weekIndex, weekday);
  const { session, adjustment } = autoregulate(base, checkin);

  const monday = mondayOf(now);
  const week = WEEKDAY_SHORT.map((_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const iso = localDate(dt);
    const training = plan.trainingWeekdays.includes(i);
    const done = s.completed.some((c) => c.date === iso);
    const status: TodayView["week"][number]["status"] = done ? "done"
      : i === todayIdx ? "today"
        : !training ? "rest"
          : i < todayIdx ? "missed" : "upcoming";
    return { label: "MTWTFSS"[i], weekday: i, status };
  });

  return {
    plan,
    date,
    position,
    blockName: plan.blockName(position.block - 1),
    weekday,
    session: { ...session, weekday },
    adjustment,
    checkin,
    week,
    sessionsThisWeek: { done: week.filter((w) => w.status === "done").length, planned: plan.trainingWeekdays.length },
  };
}

/** Weekly working sets per muscle group with fractional counting (secondary = 0.5). */
export function setsPerGroup(exercises: { id: string; sets: number }[]): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {};
  for (const e of exercises) {
    const def = LIBRARY_BY_ID.get(e.id);
    if (!def) continue;
    out[def.primary] = (out[def.primary] ?? 0) + e.sets;
    for (const g of def.secondary) out[g] = (out[g] ?? 0) + e.sets * 0.5;
  }
  return out;
}

export const fmtKg = (kg: number) => (Number.isInteger(kg) ? `${kg}` : kg.toFixed(1));
export const exerciseName = (id: string) =>
  LIBRARY_BY_ID.get(id)?.name ?? id.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// ---------- weekly review ----------

export interface WeekSummary {
  /** 1-based program week the review covers. */
  overallWeek: number;
  /** Monday (inclusive) and next Monday (exclusive), ISO dates. */
  from: string;
  to: string;
  /** True when this is last (finished) week; false = this week so far. */
  finished: boolean;
  review: WeeklyReview;
  muscles: { group: MuscleGroup; label: string; done: number; planned: number }[];
}

/** Last week's review if it has any finished session, otherwise this week so far. */
export function summarizeWeek(s: UserData, now = new Date(), timeZone?: string, which: "auto" | "this" | "last" = "auto"): WeekSummary | null {
  const plan = planFor(s);
  if (!plan) return null;
  const thisMonday = mondayOf(now);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastHas = s.completed.some((c) => c.date >= localDate(lastMonday) && c.date < localDate(thisMonday));
  const finished = which === "last" || (which === "auto" && lastHas);
  const from = finished ? lastMonday : thisMonday;
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  const fromIso = localDate(from), toIso = localDate(to);

  const pos = programPosition(s.programStart, plan.totalWeeks, plan.weeksPerBlock, from);
  const plannedSessions = plan.trainingWeekdays.map((wd) => plan.session(pos.weekIndex, wd));
  const plannedSets = plannedSessions.reduce((n, x) => n + x.workingSets, 0);

  const logs = s.setLogs.map((l) => ({ ...l, date: logDate(l, timeZone) }));
  const review = weeklyReview(logs, s.completed.map((c) => c.date), fromIso, toIso, { sessions: plannedSessions.length, sets: plannedSets });

  const plannedByGroup = setsPerGroup(plannedSessions.flatMap((x) => x.exercises.map((e) => ({ id: e.id, sets: e.sets }))));
  const doneCounts = new Map<string, number>();
  for (const l of logs) if (l.date >= fromIso && l.date < toIso) doneCounts.set(l.exerciseId, (doneCounts.get(l.exerciseId) ?? 0) + 1);
  const doneByGroup = setsPerGroup([...doneCounts.entries()].map(([id, sets]) => ({ id, sets })));
  const muscles = (Object.entries(plannedByGroup) as [MuscleGroup, number][])
    .filter(([g, n]) => n >= 4 || (doneByGroup[g] ?? 0) > 0)
    // Muscles trained this week first, then the biggest planned volume.
    .sort((a, b) => (doneByGroup[b[0]] ?? 0) - (doneByGroup[a[0]] ?? 0) || b[1] - a[1])
    .map(([g, planned]) => ({ group: g, label: GROUP_LABEL[g], done: Math.round(doneByGroup[g] ?? 0), planned: Math.round(planned) }));

  return { overallWeek: pos.overallWeek, from: fromIso, to: toIso, finished, review, muscles };
}

// ---------- goal metric series ----------

export type Metric = "ffmi" | "weight" | "bodyfat" | "arms";
export const METRICS: Metric[] = ["ffmi", "weight", "bodyfat", "arms"];
export const METRIC_LABEL: Record<Metric, string> = { ffmi: "FFMI", weight: "Weight", bodyfat: "Body fat", arms: "Arms" };

export function metricValue(m: Measurement, metric: Metric, heightCm: number | null): number | null {
  switch (metric) {
    case "ffmi": return heightCm && m.bodyFatPct != null ? ffmi(m.weightKg, heightCm, m.bodyFatPct) : null;
    case "weight": return m.weightKg;
    case "bodyfat": return m.bodyFatPct;
    case "arms": return m.armsCm;
  }
}

export const formatMetric = (metric: Metric) => (v: number) =>
  metric === "ffmi" ? v.toFixed(1) : metric === "bodyfat" ? `${v.toFixed(1)}%` : metric === "weight" ? `${Number.isInteger(v) ? v : v.toFixed(1)} kg` : `${v.toFixed(1)} cm`;

export interface Series {
  metric: Metric;
  points: Point[];
  target: number | null;
  goalWeek: number;
  pace: Pace;
  /** Lower is better (body fat; weight when the goal is fat loss). */
  wantsDown: boolean;
  /** Latest value already meets or beats the target. */
  reached: boolean;
}

export function series(s: UserData, metric: Metric): Series {
  const plan = planFor(s);
  const start = parseLocal(s.programStart).getTime();
  const points = s.measurements
    .map((m) => ({ week: Math.round(((parseLocal(m.date).getTime() - start) / 86_400_000 / 7) * 10) / 10, value: metricValue(m, metric, s.heightCm) }))
    .filter((p): p is Point => p.value != null);
  const target = s.goalMetric === metric && s.goalValue != null ? s.goalValue : null;
  const goalWeek = plan?.totalWeeks ?? 48;
  const pace = target != null && points.length ? goalPace(points, points[0].value, target, goalWeek) : { status: "not_enough_data" as const, projectedWeek: null };
  const wantsDown = metric === "bodyfat" || (metric === "weight" && s.program?.inputs.goal === "fat");
  const latest = points[points.length - 1]?.value;
  const reached = target != null && latest != null && (wantsDown ? latest <= target : latest >= target);
  return { metric, points, target, goalWeek, pace, wantsDown, reached };
}

/** Set-log key used for idempotent writes: one row per exercise, set and calendar day. */
export const setLogKey = (l: Pick<SetLog, "exerciseId" | "setIndex">, date: string) => `${l.exerciseId}:${l.setIndex}:${date}`;
