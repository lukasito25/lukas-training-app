/**
 * LiftWise tools for ChatGPT / Claude. Each tool loads the user's data, runs the shared coaching
 * logic from @fitness/core (the same code as the app), and returns both a short text answer for
 * the model and structured data for widgets.
 *
 * Program changes follow the app's rule: the AI proposes, the user approves. Tools that change
 * the plan return a before/after preview unless called with confirm: true after the user agreed.
 */
import { z } from "zod";
import {
  alternativesFor, buildToday, CheckinSchema, EQUIPMENT, EXPERIENCE, exerciseName, FOCUS_AREAS, fmtKg,
  formatMetric, generateProgram, GOAL_INFO, GOALS, LIBRARY, LIBRARY_BY_ID, localDate, logDate, MeasurementSchema,
  METRIC_LABEL, METRICS, mondayOf, planFor, programPosition, ProgramInputsSchema, series, setLogKey, setLogToRow,
  SORENESS_LEVELS, SPLIT_LABEL, suggestionFor, summarizeWeek, swapExercise, userDataFromRows, WEEKDAY_LONG, zonedNow,
  checkinToRow, measurementToRow, cuesFor, GROUP_LABEL, EQUIPMENT_LABEL,
  type Metric, type PlanSession, type Source, type TodayView, type UserData,
} from "../../../packages/core/src/index";
import type { Repo } from "./repo";

export interface Ctx { repo: Repo; source: Source; now?: Date }
export interface ToolResult { text: string; data: Record<string, unknown>; isError?: boolean }
/** Tools with a card render the LiftWise widget app; its `view` field picks the screen. */
export type WidgetId = "app";

export interface ToolDef<S extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: S;
  readOnly: boolean;
  destructive?: boolean;
  idempotent?: boolean;
  widget?: WidgetId;
  run: (args: z.infer<z.ZodObject<S>>, ctx: Ctx) => Promise<ToolResult>;
}

const tool = <S extends z.ZodRawShape>(d: ToolDef<S>) => d as unknown as ToolDef;

// ---------- helpers ----------

class UserError extends Error {}

async function loadUser(ctx: Ctx) {
  const { rows, timezone } = await ctx.repo.load();
  const data = userDataFromRows(rows);
  const now = ctx.now ? zonedNow(timezone, ctx.now) : zonedNow(timezone);
  return { data, rows, timezone, now, today: localDate(now) };
}

function requirePlan(data: UserData) {
  const plan = planFor(data);
  if (!plan) throw new UserError("This user has no training plan yet. Offer to build one with create_program (ask their goal, experience, days per week, session length and equipment first).");
  return plan;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const WEEKDAY = z
  .union([z.number().int().min(0).max(6), z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])])
  .optional()
  .describe("Day of the week (0 = Monday … 6 = Sunday, or its name). Omit for today.");
const toWeekday = (w: number | string | undefined): number | undefined =>
  w == null ? undefined : typeof w === "number" ? w : WEEKDAY_LONG.findIndex((d) => d.toLowerCase() === w);

/** Finds an exercise in a session by id or (fuzzy) name. */
function findExercise(session: PlanSession, query: string) {
  const q = norm(query);
  return (
    session.exercises.find((e) => e.id === query || norm(e.name) === q) ??
    session.exercises.find((e) => norm(e.name).includes(q) || q.includes(norm(e.name)))
  );
}

/** Previous sessions for one exercise with their dates, most recent first (today excluded). */
function historyWithDates(data: UserData, exerciseId: string, today: string, timezone: string, limit = 3) {
  const byDate = new Map<string, { weightKg: number; reps: number }[]>();
  for (const l of data.setLogs) {
    if (l.exerciseId !== exerciseId) continue;
    const d = logDate(l, timezone);
    if (d === today) continue;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push({ weightKg: l.weightKg, reps: l.reps });
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, limit).map(([date, sets]) => ({ date, sets }));
}

const firstNumber = (label: string) => {
  const m = /^(\d+)/.exec(label);
  return m ? Number(m[1]) : null;
};

function sessionView(data: UserData, session: PlanSession, today: string, timezone: string) {
  const doneToday = data.setLogs.filter((l) => logDate(l, timezone) === today);
  return session.exercises.map((e) => {
    const s = suggestionFor(data, e, today, timezone);
    const def = LIBRARY_BY_ID.get(e.id);
    const done = doneToday.filter((l) => l.exerciseId === e.id).sort((a, b) => a.setIndex - b.setIndex);
    const history = historyWithDates(data, e.id, today, timezone, 1);
    const lastKg = done[done.length - 1]?.weightKg ?? history[0]?.sets[0]?.weightKg ?? null;
    const bodyweight = !!def && def.equipment.length === 0;
    return {
      id: e.id, name: e.name, sets: e.sets, reps: e.repsLabel, rir: e.rir, restSec: e.restSec, notes: e.notes,
      suggestedKg: s?.weightKg ?? null, suggestion: s?.reason ?? null,
      startKg: s?.weightKg ?? lastKg ?? (bodyweight ? 0 : null),
      startReps: s?.targetReps ?? firstNumber(e.repsLabel) ?? 10,
      timed: e.repRange == null,
      bodyweight,
      primary: def ? GROUP_LABEL[def.primary] : null,
      muscles: e.muscles,
      equipment: def?.equipment ?? [],
      cues: cuesFor(e.id),
      demoUrl: e.demoUrl,
      lastTime: history[0] ?? null,
      setsDone: done.map((l) => ({ set: l.setIndex + 1, weightKg: l.weightKg, reps: l.reps, rir: l.rir })),
    };
  });
}

type ExerciseView = ReturnType<typeof sessionView>[number];

/** Everything the Today card needs: session, progress through it, readiness, and the week. */
function todayPayload(data: UserData, t: TodayView, today: string, timezone: string) {
  const exercises = sessionView(data, t.session, today, timezone);
  const isToday = t.week.some((w) => w.weekday === t.weekday && w.status === "today") || t.week.find((w) => w.weekday === t.weekday)?.status === "done";
  const setsLogged = exercises.reduce((n, e) => n + Math.min(e.setsDone.length, e.sets), 0);
  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);
  const finished = data.completed.some((c) => c.date === today && c.weekday === t.weekday);
  const status: "not_started" | "in_progress" | "done" = finished ? "done" : setsLogged > 0 ? "in_progress" : "not_started";
  const ci = exercises.findIndex((e) => e.setsDone.length < e.sets);
  const todays = data.setLogs.filter((l) => logDate(l, timezone) === today);
  const bests = exercises.flatMap((e) => {
    const mine = todays.filter((l) => l.exerciseId === e.id);
    if (!mine.length) return [];
    const top = mine.reduce((a, b) => (b.weightKg > a.weightKg || (b.weightKg === a.weightKg && b.reps > a.reps) ? b : a));
    const prev = historyWithDates(data, e.id, today, timezone, 1000).flatMap((h) => h.sets);
    if (!prev.length || top.weightKg <= 0) return [];
    const beat = prev.every((p) => top.weightKg > p.weightKg || (top.weightKg === p.weightKg && top.reps > p.reps));
    return beat ? [{ name: e.name, weightKg: top.weightKg, reps: top.reps }] : [];
  });
  return {
    view: "today" as const,
    date: today, weekday: t.weekday, dayName: WEEKDAY_LONG[t.weekday], isToday,
    week: t.position.overallWeek, totalWeeks: t.position.totalWeeks, block: t.blockName,
    training: t.session.training, deload: t.session.deload, label: t.session.label, title: t.session.title,
    workingSets: t.session.workingSets, estMinutes: t.session.estMinutes,
    adjustment: t.adjustment.kind === "none" ? null : t.adjustment.reason,
    checkin: t.checkin ? { sleepHours: t.checkin.sleepHours, energy: t.checkin.energy, soreness: t.checkin.soreness } : null,
    checkinNeeded: !t.checkin && isToday && t.session.training && status === "not_started",
    status, setsLogged, totalSets,
    current: ci >= 0 ? { index: ci, set: exercises[ci].setsDone.length + 1 } : null,
    summary: setsLogged ? {
      sets: setsLogged,
      volumeKg: Math.round(todays.reduce((v, l) => v + l.weightKg * l.reps, 0)),
      bests,
    } : null,
    weekDots: t.week,
    sessionsThisWeek: t.sessionsThisWeek,
    exercises,
  };
}

/** Reloads the user and builds the Today payload (after a write). */
async function freshToday(ctx: Ctx, weekday?: number) {
  const { data, now, today, timezone } = await loadUser(ctx);
  const plan = requirePlan(data);
  const t = buildToday(data, plan, now, weekday);
  return todayPayload(data, t, today, timezone);
}

/** Goal-trend card data for one metric. */
function progressPayload(data: UserData, metric: Metric) {
  const sr = series(data, metric);
  const f = formatMetric(metric);
  const latest = sr.points[sr.points.length - 1]?.value ?? null;
  const lastM = [...data.measurements].sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null;
  return {
    view: "progress" as const,
    metric, label: METRIC_LABEL[metric],
    metrics: METRICS.map((m) => ({ id: m, label: METRIC_LABEL[m] })),
    points: sr.points.map((pt) => ({ ...pt, label: f(pt.value) })),
    latest, latestLabel: latest != null ? f(latest) : null,
    target: sr.target, targetLabel: sr.target != null ? f(sr.target) : null,
    goalWeek: sr.goalWeek, pace: sr.pace, reached: sr.reached, wantsDown: sr.wantsDown,
    needsHeight: metric === "ffmi" && !data.heightCm,
    lastMeasurement: lastM ? { date: lastM.date, weightKg: lastM.weightKg, bodyFatPct: lastM.bodyFatPct, armsCm: lastM.armsCm, waistCm: lastM.waistCm } : null,
    format: f,
  };
}

const CARD_NOTE = "The LiftWise card above shows this; reply in one or two sentences (coaching and the next step) and don't relist it.";

const line = (e: ExerciseView) =>
  `- ${e.name}: ${e.sets} × ${e.reps} @ ${e.rir} RIR${e.suggestedKg != null ? `, ${fmtKg(e.suggestedKg)} kg` : ""}` +
  `${e.setsDone.length ? ` (${e.setsDone.length}/${e.sets} done)` : ""} [id: ${e.id}]`;

// ---------- tools ----------

export const TOOLS: ToolDef[] = [
  tool({
    name: "get_today_workout",
    title: "Today's workout",
    description:
      "Use when the user asks what to train today (or on a given day), what their workout is, or wants to start a session. " +
      "Shows an interactive LiftWise card: readiness check-in, exercise details, and a guided live session where they log each set. " +
      "Returns the session after readiness adjustments, with suggested weights and sets already logged today.",
    input: { weekday: WEEKDAY },
    readOnly: true,
    widget: "app",
    async run(args, ctx) {
      const { data, now, today, timezone } = await loadUser(ctx);
      const plan = requirePlan(data);
      const t = buildToday(data, plan, now, toWeekday(args.weekday));
      const p = todayPayload(data, t, today, timezone);
      const head = `${p.dayName} · Week ${p.week} of ${p.totalWeeks} · ${p.block}${p.deload ? " · deload week" : ""}`;
      const text = !p.training
        ? `${head}\n${p.title}: rest day, no lifting planned. Light movement and recovery.`
        : `${head}\n${p.label}: ${p.title} · ${p.workingSets} sets · ~${p.estMinutes} min · ${p.setsLogged}/${p.totalSets} sets logged (${p.status.replace("_", " ")}).` +
          (p.adjustment ? `\nAdjusted for readiness: ${p.adjustment}.` : "") +
          (p.checkinNeeded ? "\nNo check-in yet; the card offers a quick one (sleep, energy, soreness)." : "") +
          `\n${p.exercises.map(line).join("\n")}\n${CARD_NOTE}`;
      return { text, data: p };
    },
  }),

  tool({
    name: "log_set",
    title: "Log a set",
    description:
      "Use when the user reports a set they did, e.g. 'bench 80 kg for 8' or 'did 3 sets of squats at 100 × 5'. Logs one set (call once per set). " +
      "Matches the exercise in today's session by name. Logging the same set number again overwrites it.",
    input: {
      exercise: z.string().min(2).max(120).describe("Exercise name or id from get_today_workout"),
      weight_kg: z.number().min(0).max(1000).describe("Load in kg (0 for bodyweight)"),
      reps: z.number().int().min(0).max(200),
      rir: z.number().int().min(0).max(10).optional().describe("Reps in reserve, if the user said (e.g. 'could do 2 more' = 2)"),
      set_number: z.number().int().min(1).max(20).optional().describe("Which set (1-based). Omit for the next set."),
      weekday: WEEKDAY,
    },
    readOnly: false,
    idempotent: true,
    async run(args, ctx) {
      const { data, now, today, timezone } = await loadUser(ctx);
      const plan = requirePlan(data);
      const wd = toWeekday(args.weekday);
      const t = buildToday(data, plan, now, wd);
      const ex = findExercise(t.session, args.exercise);
      const libEx = ex ? null : LIBRARY.find((e) => norm(e.name) === norm(args.exercise) || e.id === args.exercise);
      if (!ex && !libEx) {
        return {
          isError: true,
          text: `"${args.exercise}" isn't in ${WEEKDAY_LONG[t.weekday]}'s session. Exercises today: ${t.session.exercises.map((e) => e.name).join(", ") || "none"}. Ask which one they meant.`,
          data: {},
        };
      }
      const id = ex?.id ?? libEx!.id;
      const name = ex?.name ?? libEx!.name;
      const doneIdx = new Set(data.setLogs.filter((l) => l.exerciseId === id && logDate(l, timezone) === today).map((l) => l.setIndex));
      let setIndex = args.set_number != null ? args.set_number - 1 : 0;
      if (args.set_number == null) while (doneIdx.has(setIndex)) setIndex++;
      const log = { exerciseId: id, setIndex, weightKg: args.weight_kg, reps: args.reps, rir: args.rir ?? null, completedAt: (ctx.now ?? new Date()).toISOString() };
      const row = setLogToRow(log, ctx.source, timezone);
      row.client_key = setLogKey(log, today);
      await ctx.repo.upsertSetLog(row);
      const p = await freshToday(ctx, wd);
      const me = p.exercises.find((e) => e.id === id);
      const total = me?.sets ?? setIndex + 1;
      const doneCount = me?.setsDone.length ?? setIndex + 1;
      const next = p.current ? p.exercises[p.current.index] : null;
      return {
        text:
          `Logged ${name} set ${setIndex + 1}: ${fmtKg(args.weight_kg)} kg × ${args.reps}${args.rir != null ? ` @ ${args.rir} RIR` : ""}. ${doneCount}/${total} sets done.` +
          (doneCount >= total && next ? ` Next up: ${next.name}.` : "") +
          (!next ? " That's every set; offer complete_workout." : ""),
        data: { ...p, justLogged: { exerciseId: id, exercise: name, set: setIndex + 1, weightKg: args.weight_kg, reps: args.reps } },
      };
    },
  }),

  tool({
    name: "delete_set",
    title: "Undo a set",
    description: "Use when the user wants to remove a set they logged today by mistake (e.g. 'undo that', 'delete my last bench set'). Defaults to the last logged set of that exercise.",
    input: {
      exercise: z.string().min(2).max(120).describe("Exercise name or id"),
      set_number: z.number().int().min(1).max(20).optional().describe("Which set (1-based). Omit for the last one logged today."),
      weekday: WEEKDAY,
    },
    readOnly: false,
    destructive: true,
    idempotent: true,
    async run(args, ctx) {
      const { data, now, today, timezone } = await loadUser(ctx);
      const plan = requirePlan(data);
      const wd = toWeekday(args.weekday);
      const t = buildToday(data, plan, now, wd);
      const ex = findExercise(t.session, args.exercise);
      const id = ex?.id ?? LIBRARY.find((e) => norm(e.name) === norm(args.exercise) || e.id === args.exercise)?.id;
      const mine = data.setLogs.filter((l) => l.exerciseId === id && logDate(l, timezone) === today).sort((a, b) => a.setIndex - b.setIndex);
      const target = args.set_number != null ? mine.find((l) => l.setIndex === args.set_number! - 1) : mine[mine.length - 1];
      if (!id || !target) return { isError: true, text: `No ${args.set_number ? `set ${args.set_number} of ` : ""}${ex?.name ?? args.exercise} logged today.`, data: {} };
      await ctx.repo.deleteSetLog(setLogKey(target, today));
      const p = await freshToday(ctx, wd);
      return {
        text: `Removed ${ex?.name ?? id} set ${target.setIndex + 1} (${fmtKg(target.weightKg)} kg × ${target.reps}).`,
        data: p,
      };
    },
  }),

  tool({
    name: "get_exercise",
    title: "Exercise details",
    description:
      "Use when the user asks how to do an exercise in their session, what it works, what they lifted last time, or for alternatives. " +
      "Returns technique cues, muscles, rest, the last sessions, a demo link and suitable swaps.",
    input: { exercise: z.string().min(2).max(120).describe("Exercise name or id"), weekday: WEEKDAY },
    readOnly: true,
    widget: "app",
    async run(args, ctx) {
      const { data, now, today, timezone } = await loadUser(ctx);
      const plan = requirePlan(data);
      const t = buildToday(data, plan, now, toWeekday(args.weekday));
      const ex = findExercise(t.session, args.exercise);
      if (!ex) return { isError: true, text: `"${args.exercise}" isn't in ${WEEKDAY_LONG[t.weekday]}'s session (${t.session.exercises.map((e) => e.name).join(", ")}).`, data: {} };
      const v = sessionView(data, { ...t.session, exercises: [ex] }, today, timezone)[0];
      const history = historyWithDates(data, ex.id, today, timezone, 3);
      const p = data.program;
      const day = p?.days.find((d) => d.weekday === t.weekday);
      const alternatives = p && day && plan.source === "generated"
        ? alternativesFor(p, day.key, ex.id).slice(0, 6).map((a) => ({ id: a.id, name: a.name, equipment: a.equipment.map((q) => EQUIPMENT_LABEL[q]) }))
        : [];
      return {
        text: `${v.name}: ${v.sets} × ${v.reps} @ ${v.rir} RIR${v.restSec ? `, rest ${Math.round(v.restSec / 60 * 10) / 10} min` : ""}. Works ${v.muscles.join(", ")}.` +
          `\nCues: ${v.cues.join("; ")}.` +
          (history.length ? `\nLast time (${history[0].date}): ${history[0].sets.map((s) => `${fmtKg(s.weightKg)}×${s.reps}`).join(", ")}.` : "\nNo history yet.") +
          (alternatives.length ? `\nSwaps: ${alternatives.map((a) => a.name).join(", ")}.` : "") + `\n${CARD_NOTE}`,
        data: { view: "exercise", weekday: t.weekday, dayName: WEEKDAY_LONG[t.weekday], exercise: v, history, alternatives, canSwap: alternatives.length > 0 },
      };
    },
  }),

  tool({
    name: "complete_workout",
    title: "Finish workout",
    description: "Use when the user says they finished today's session. Marks it done so streaks, the week view and the weekly review count it, and shows a session summary card.",
    input: { weekday: WEEKDAY },
    readOnly: false,
    idempotent: true,
    widget: "app",
    async run(args, ctx) {
      const { data, now, today, timezone } = await loadUser(ctx);
      const plan = requirePlan(data);
      const wd = toWeekday(args.weekday);
      const t = buildToday(data, plan, now, wd);
      const sets = data.setLogs.filter((l) => logDate(l, timezone) === today).length;
      await ctx.repo.upsertWorkout({ date: today, weekday: t.weekday, sets, source: ctx.source });
      const p = await freshToday(ctx, wd);
      const bests = p.summary?.bests ?? [];
      return {
        text: `Session done: ${sets} sets, ${p.summary?.volumeKg ?? 0} kg total volume. ${p.sessionsThisWeek.done}/${p.sessionsThisWeek.planned} sessions this week.` +
          (bests.length ? ` New bests: ${bests.map((b) => `${b.name} ${fmtKg(b.weightKg)} × ${b.reps}`).join(", ")}.` : "") + `\n${CARD_NOTE}`,
        data: p,
      };
    },
  }),

  tool({
    name: "log_checkin",
    title: "Daily check-in",
    description:
      "Use when the user tells you how they slept or feel (sleep hours, energy, soreness), ideally before training. " +
      "LiftWise then trims or lightens today's session if recovery is poor; the card shows the adjusted session.",
    input: {
      sleep_hours: z.number().min(0).max(24),
      energy: z.number().int().min(1).max(5).describe("1 = drained … 5 = great"),
      soreness: z.enum(SORENESS_LEVELS).describe("none, low, mid, high or max"),
    },
    readOnly: false,
    idempotent: true,
    widget: "app",
    async run(args, ctx) {
      const { data, today } = await loadUser(ctx);
      const c = CheckinSchema.parse({ date: today, sleepHours: args.sleep_hours, energy: args.energy, soreness: args.soreness });
      await ctx.repo.upsertCheckin(checkinToRow(c));
      if (!planFor(data)) return { text: "Check-in saved.", data: { date: today } };
      const p = await freshToday(ctx);
      return {
        text: `Check-in saved. ${p.adjustment ? `${p.adjustment}. Today is now ${p.workingSets} sets.` : "Today's session stays as planned."}\n${CARD_NOTE}`,
        data: p,
      };
    },
  }),

  tool({
    name: "log_measurement",
    title: "Log a measurement",
    description: "Use when the user shares body weight, body-fat %, or arm/chest/waist measurements. One entry per day; logging again the same day replaces it. Shows the goal trend card.",
    input: {
      weight_kg: z.number().min(25).max(350),
      body_fat_pct: z.number().min(2).max(60).optional(),
      arms_cm: z.number().min(15).max(80).optional(),
      chest_cm: z.number().min(50).max(200).optional(),
      waist_cm: z.number().min(40).max(200).optional(),
      height_cm: z.number().min(100).max(250).optional().describe("Only if the user gives it; needed once for FFMI"),
    },
    readOnly: false,
    idempotent: true,
    widget: "app",
    async run(args, ctx) {
      const { data, today } = await loadUser(ctx);
      const m = MeasurementSchema.parse({
        date: today, weightKg: args.weight_kg, bodyFatPct: args.body_fat_pct ?? null, armsCm: args.arms_cm ?? null, chestCm: args.chest_cm ?? null, waistCm: args.waist_cm ?? null,
      });
      await ctx.repo.upsertMeasurement(measurementToRow(m));
      if (args.height_cm) await ctx.repo.updateProfile({ height_cm: args.height_cm });
      const next: UserData = { ...data, heightCm: args.height_cm ?? data.heightCm, measurements: [...data.measurements.filter((x) => x.date !== today), m] };
      const metric: Metric = data.goalMetric === "none" ? "weight" : data.goalMetric;
      const p = progressPayload(next, metric);
      return {
        text: `Saved for ${today}.` + (p.latest != null ? ` ${p.label} ${p.latestLabel}` : "") +
          (p.reached ? ` (goal ${p.targetLabel} reached)` : p.target != null ? ` · goal ${p.targetLabel}` : "") +
          (p.pace.projectedWeek != null ? ` · on this pace around week ${p.pace.projectedWeek}` : "") + `\n${CARD_NOTE}`,
        data: { ...p, saved: today },
      };
    },
  }),

  tool({
    name: "log_habit",
    title: "Tick a habit",
    description: "Use when the user says they did (or didn't do) one of their daily habits, e.g. protein meals, water, creatine.",
    input: { habit: z.string().min(2).max(80).describe("Habit name or id"), done: z.boolean().default(true) },
    readOnly: false,
    idempotent: true,
    async run(args, ctx) {
      const { data, today } = await loadUser(ctx);
      const q = norm(args.habit);
      const h = data.habits.find((x) => x.id === args.habit || norm(x.name) === q) ?? data.habits.find((x) => norm(x.name).includes(q));
      if (!h) return { isError: true, text: `No habit matches "${args.habit}". Their habits: ${data.habits.map((x) => x.name).join(", ") || "none yet"}.`, data: {} };
      await ctx.repo.setHabit({ date: today, habit_id: h.id }, args.done);
      const doneSet = new Set(data.habitDone[today] ?? []);
      if (args.done) doneSet.add(h.id); else doneSet.delete(h.id);
      return { text: `${args.done ? "Ticked" : "Unticked"} "${h.name}". ${doneSet.size}/${data.habits.length} habits today.`, data: { habit: h.name, done: args.done } };
    },
  }),

  tool({
    name: "get_weekly_review",
    title: "Weekly review",
    description: "Use when the user asks how their week went, for a recap, or about consistency. Sessions done vs planned, sets per muscle (with the exercises that counted), and new personal bests.",
    input: { week: z.enum(["auto", "this", "last"]).default("auto").describe("auto = last week if it had sessions, else this week so far") },
    readOnly: true,
    widget: "app",
    async run(args, ctx) {
      const { data, now, timezone } = await loadUser(ctx);
      requirePlan(data);
      const w = summarizeWeek(data, now, timezone, args.week)!;
      const r = w.review;
      const bests = r.newBests.slice(0, 5).map((b) => `${exerciseName(b.exerciseId)} ${fmtKg(b.weightKg)} kg × ${b.reps}`);
      // Which exercises fed each muscle's sets this week.
      const byGroup: Record<string, Record<string, number>> = {};
      for (const l of data.setLogs) {
        const d = logDate(l, timezone);
        if (d < w.from || d > w.to) continue;
        const def = LIBRARY_BY_ID.get(l.exerciseId);
        if (!def) continue;
        const g = GROUP_LABEL[def.primary];
        (byGroup[g] ??= {})[def.name] = (byGroup[g][def.name] ?? 0) + 1;
      }
      const muscles = w.muscles.map((m) => ({
        ...m,
        exercises: Object.entries(byGroup[m.label] ?? {}).map(([name, sets]) => ({ name, sets })).sort((a, b) => b.sets - a.sets),
      }));
      return {
        text:
          `Week ${w.overallWeek}${w.finished ? "" : " (so far)"}: ${r.sessionsDone}/${r.sessionsPlanned} sessions, ${r.setsDone}/${r.setsPlanned} sets.` +
          `\nPer muscle: ${w.muscles.map((m) => `${m.label} ${m.done}/${m.planned}`).join(", ")}.` +
          (bests.length ? `\nNew bests: ${bests.join("; ")}.` : "\nNo new bests yet this week.") + `\n${CARD_NOTE}`,
        data: { view: "review", ...w, muscles, newBests: r.newBests.map((b) => ({ ...b, name: exerciseName(b.exerciseId) })) },
      };
    },
  }),

  tool({
    name: "get_progress",
    title: "Goal progress",
    description: "Use when the user asks about progress toward their goal (FFMI, weight, body fat, arms) or their trend over time. Shows a trend chart card with the goal line.",
    input: { metric: z.enum(METRICS as [Metric, ...Metric[]]).optional().describe("Defaults to the user's goal metric") },
    readOnly: true,
    widget: "app",
    async run(args, ctx) {
      const { data } = await loadUser(ctx);
      const metric: Metric = args.metric ?? (data.goalMetric === "none" ? "weight" : data.goalMetric);
      const p = progressPayload(data, metric);
      if (!p.points.length) {
        return { text: `No ${p.label} data yet.${p.needsHeight ? " FFMI needs height and body-fat %." : ""} The card lets them log a measurement.`, data: { ...p, format: undefined } };
      }
      const first = p.points[0], last = p.points[p.points.length - 1];
      return {
        text: `${p.label}: ${p.format(first.value)} → ${p.format(last.value)} over ${p.points.length} entries` +
          (p.target != null ? `; goal ${p.targetLabel}${p.reached ? " (reached)" : ""}` : "") +
          (p.pace.status !== "not_enough_data" ? `; ${p.pace.status.replace("_", " ")}` : "") +
          (p.pace.projectedWeek != null ? `, projected week ${p.pace.projectedWeek}` : "") + `.\n${CARD_NOTE}`,
        data: { ...p, format: undefined },
      };
    },
  }),

  tool({
    name: "get_program_overview",
    title: "Program overview",
    description: "Use when the user asks about their plan: split, training days, blocks/phases, where they are in it, or recent changes.",
    input: {},
    readOnly: true,
    async run(_args, ctx) {
      const { data, now } = await loadUser(ctx);
      const plan = requirePlan(data);
      const pos = programPosition(data.programStart, plan.totalWeeks, plan.weeksPerBlock, now);
      const days = plan.trainingWeekdays.map((wd) => {
        const s = plan.session(pos.weekIndex, wd);
        return { weekday: wd, day: WEEKDAY_LONG[wd], label: s.label, exercises: s.exercises.map((e) => `${e.name} ${e.sets}×${e.repsLabel}`) };
      });
      const p = data.program;
      const summary = p ? `${GOAL_INFO[p.inputs.goal].label} · ${SPLIT_LABEL[p.inputs.daysPerWeek]} · ~${p.inputs.sessionMinutes} min` : "Classic 48-week hypertrophy plan";
      return {
        text: `${summary}. Week ${pos.overallWeek} of ${pos.totalWeeks}, block ${pos.block} (${plan.blockName(pos.block - 1)}).\n` +
          days.map((d) => `${d.day} – ${d.label}: ${d.exercises.join(", ")}`).join("\n") +
          (p && p.history.length > 1 ? `\nRecent changes: ${p.history.slice(-3).map((h) => h.reason).join("; ")}` : ""),
        data: { summary, position: pos, days, blocks: Array.from({ length: plan.blockCount }, (_, i) => plan.blockName(i)), history: p?.history ?? [], notes: p?.notes ?? [] },
      };
    },
  }),

  tool({
    name: "swap_exercise",
    title: "Swap an exercise",
    description:
      "Use when the user wants to replace an exercise (pain, no equipment, preference). Without a replacement it lists suitable alternatives. " +
      "With a replacement it returns a before/after preview card with Apply / Not now; only call again with confirm: true after the user agrees in chat.",
    input: {
      exercise: z.string().min(2).max(120).describe("Exercise to replace (name or id)"),
      weekday: WEEKDAY,
      replacement: z.string().min(2).max(120).optional().describe("Replacement exercise name or id from the alternatives"),
      reason: z.string().max(120).optional().describe("Why, in the user's words, e.g. 'shoulder pain'"),
      confirm: z.boolean().default(false).describe("true only after the user approved the previewed change"),
    },
    readOnly: false,
    widget: "app",
    async run(args, ctx) {
      const { data, now } = await loadUser(ctx);
      const plan = requirePlan(data);
      const p = data.program;
      if (plan.source !== "generated" || !p) {
        return { isError: true, text: "Swaps work on personalised programs. This user is on the classic plan; offer create_program to build a personalised one.", data: {} };
      }
      const wd = toWeekday(args.weekday) ?? buildToday(data, plan, now).weekday;
      const day = p.days.find((d) => d.weekday === wd) ?? p.days.find((d) => d.slots.some((s) => norm(LIBRARY_BY_ID.get(s.exerciseId)?.name ?? "") === norm(args.exercise)));
      if (!day) return { isError: true, text: `No training on ${WEEKDAY_LONG[wd]}. Training days: ${p.days.map((d) => WEEKDAY_LONG[d.weekday]).join(", ")}.`, data: {} };
      const q = norm(args.exercise);
      const slot = day.slots.find((s) => s.exerciseId === args.exercise || norm(LIBRARY_BY_ID.get(s.exerciseId)?.name ?? "") === q)
        ?? day.slots.find((s) => norm(LIBRARY_BY_ID.get(s.exerciseId)?.name ?? "").includes(q));
      if (!slot) return { isError: true, text: `"${args.exercise}" isn't on ${day.label} (${WEEKDAY_LONG[day.weekday]}).`, data: {} };
      const alts = alternativesFor(p, day.key, slot.exerciseId);
      const current = exerciseName(slot.exerciseId);
      if (!args.replacement) {
        return {
          text: `Alternatives for ${current} on ${day.label}: ${alts.slice(0, 8).map((a) => a.name).join(", ")}. The card lets them pick one; otherwise ask which, then preview the swap.`,
          data: {
            view: "change", stage: "pick", exercise: current, exerciseId: slot.exerciseId, weekday: day.weekday, dayLabel: day.label, reason: args.reason ?? null,
            alternatives: alts.slice(0, 8).map((a) => ({ id: a.id, name: a.name, equipment: a.equipment.map((q) => EQUIPMENT_LABEL[q]) })),
          },
        };
      }
      const rq = norm(args.replacement);
      const to = alts.find((a) => a.id === args.replacement || norm(a.name) === rq) ?? alts.find((a) => norm(a.name).includes(rq));
      if (!to) return { isError: true, text: `${args.replacement} isn't a suitable swap for ${current} with their equipment/limitations. Options: ${alts.slice(0, 8).map((a) => a.name).join(", ")}.`, data: {} };
      const reason = args.reason ? `Swapped for ${args.reason}` : "Swapped at your request";
      const { program, diff } = swapExercise(p, day.key, slot.exerciseId, to.id, reason);
      if (!args.confirm) {
        return {
          text: `Proposed change (not saved yet) on ${diff.dayLabel}: ${diff.before} → ${diff.after}. Sets, reps and progression carry over. Ask the user to confirm, then call swap_exercise again with confirm: true.`,
          data: {
            view: "change", stage: "preview", ...diff, weekday: day.weekday, fromVersion: p.version, toVersion: program.version,
            confirmArgs: { exercise: slot.exerciseId, replacement: to.id, weekday: day.weekday, reason: args.reason, confirm: true },
          },
        };
      }
      await ctx.repo.saveProgram(program, `${reason}: ${diff.before} → ${diff.after}`);
      const today = await freshToday(ctx, day.weekday);
      return {
        text: `Done: ${diff.before} → ${diff.after} on ${diff.dayLabel}. Program is now v${program.version}; the app shows it in the change history.`,
        data: { ...today, applied: { ...diff, version: program.version } },
      };
    },
  }),

  tool({
    name: "plan_builder",
    title: "Plan builder",
    description:
      "Use when the user wants a training plan but hasn't given all the details (goal, experience, days per week, session length, equipment), or has no plan yet. " +
      "Shows a tap-to-choose card; the user's choices come back as a create_program preview. If they already told you everything, call create_program directly.",
    input: {},
    readOnly: true,
    widget: "app",
    async run(_args, ctx) {
      const { data } = await loadUser(ctx);
      const cur = data.program?.inputs;
      return {
        text: `${data.programSource ? "They have a plan; a new one replaces it and restarts at week 1." : "No plan yet."} The card asks goal, experience, days, minutes, equipment, focus and limitations. ${CARD_NOTE}`,
        data: {
          view: "plan_builder",
          hasPlan: !!data.programSource,
          goals: GOALS.map((g) => ({ id: g, label: GOAL_INFO[g].label, detail: GOAL_INFO[g].detail })),
          experience: EXPERIENCE.map((e) => ({ id: e, label: e[0].toUpperCase() + e.slice(1) })),
          days: [3, 4, 5, 6].map((d) => ({ id: d, label: `${d} days`, detail: SPLIT_LABEL[d as 3 | 4 | 5 | 6] })),
          minutes: [45, 60, 75, 90],
          equipment: EQUIPMENT.map((q) => ({ id: q, label: EQUIPMENT_LABEL[q] })),
          focus: [...FOCUS_AREAS],
          current: cur
            ? { goal: cur.goal, experience: cur.experience, days_per_week: cur.daysPerWeek, session_minutes: cur.sessionMinutes, equipment: cur.equipment, focus: cur.focus, limitations: cur.limitations }
            : null,
        },
      };
    },
  }),

  tool({
    name: "create_program",
    title: "Build a program",
    description:
      "Use when the user wants a new training plan or to change goal, days per week, session length or equipment. Ask for anything missing first. " +
      "Returns a preview card (days, exercises, weekly sets per muscle, notes) with Save; call again with confirm: true only after the user approves in chat. Confirming restarts at week 1 (logs are kept).",
    input: {
      goal: z.enum(GOALS).describe("muscle, strength, fat (fat loss), general or sport"),
      experience: z.enum(EXPERIENCE),
      days_per_week: z.number().int().min(3).max(6),
      session_minutes: z.union([z.literal(45), z.literal(60), z.literal(75), z.literal(90)]),
      equipment: z.array(z.enum(EQUIPMENT)).min(1).describe("Available equipment; a full gym is all of them"),
      focus: z.array(z.enum(FOCUS_AREAS)).max(3).default([]).describe("Up to 3 priority areas"),
      limitations: z.string().max(300).default("").describe("Injuries or movements to avoid, in the user's words"),
      confirm: z.boolean().default(false),
    },
    readOnly: false,
    widget: "app",
    async run(args, ctx) {
      const inputs = ProgramInputsSchema.parse({
        goal: args.goal, experience: args.experience, daysPerWeek: args.days_per_week, sessionMinutes: args.session_minutes,
        equipment: args.equipment, focus: args.focus, limitations: args.limitations,
      });
      const { data, now } = await loadUser(ctx);
      const program = generateProgram(inputs, { now: ctx.now ?? new Date() });
      if (data.program) {
        program.version = data.program.version + 1;
        program.history = [...data.program.history, { version: program.version, at: program.createdAt, reason: "New program built in chat" }];
      }
      const days = program.days.map((d) => `${WEEKDAY_LONG[d.weekday]} – ${d.label}: ${d.slots.map((s) => `${exerciseName(s.exerciseId)} ×${s.sets}`).join(", ")}`);
      const volume = program.volume.map((v) => `${v.group} ${v.sets}`).join(", ");
      if (!args.confirm) {
        return {
          text: `Preview (not saved): ${GOAL_INFO[inputs.goal].label} · ${SPLIT_LABEL[inputs.daysPerWeek]} · ~${inputs.sessionMinutes} min.\n${days.join("\n")}\nWeekly sets: ${volume}.` +
            (program.notes.length ? `\nBuilt around you: ${program.notes.join(" ")}` : "") +
            `${data.programSource ? "\nThis replaces their current plan and restarts at week 1." : ""}\nAsk the user to confirm, then call again with confirm: true.`,
          data: {
            view: "plan_preview",
            summary: `${GOAL_INFO[inputs.goal].label} · ${SPLIT_LABEL[inputs.daysPerWeek]} · ~${inputs.sessionMinutes} min`,
            replaces: !!data.programSource,
            weeks: program.weeksPerBlock * program.blocks.length,
            days: program.days.map((d) => ({
              weekday: d.weekday, day: WEEKDAY_LONG[d.weekday], label: d.label,
              exercises: d.slots.map((sl) => ({ name: exerciseName(sl.exerciseId), sets: sl.sets })),
            })),
            volume: program.volume.map((v) => ({ group: v.group, label: GROUP_LABEL[v.group as keyof typeof GROUP_LABEL] ?? v.group, sets: v.sets })),
            notes: program.notes,
            confirmArgs: { ...args, confirm: true },
          },
        };
      }
      await ctx.repo.saveProgram(program, "New program built in chat");
      await ctx.repo.updateProfile({ program_source: "generated", program_start: localDate(mondayOf(now)) });
      if (inputs.limitations.trim()) await ctx.repo.addNote(inputs.limitations.trim().slice(0, 200));
      const today = await freshToday(ctx);
      return {
        text: `Saved. Week 1 starts this week: ${days[0] ?? ""}. The card shows today's session with a Start button.`,
        data: { ...today, saved: { version: program.version } },
      };
    },
  }),

  tool({
    name: "get_profile",
    title: "Profile & coach memory",
    description: "Use at the start of a coaching conversation, or when you need the user's goal, habits or what you've remembered about them (coach memory).",
    input: {},
    readOnly: true,
    async run(_args, ctx) {
      const { data } = await loadUser(ctx);
      const goal = data.goalMetric !== "none" && data.goalValue != null ? `${METRIC_LABEL[data.goalMetric]} ${data.goalValue}` : "none set";
      return {
        text: `${data.name || "User"} · goal ${goal} · ${data.program ? `${GOAL_INFO[data.program.inputs.goal].label}, ${data.program.inputs.experience}` : data.programSource ?? "no plan"}.` +
          `\nCoach memory: ${data.coachNotes.map((n) => n.text).join(" | ") || "nothing yet"}.` +
          `\nHabits: ${data.habits.map((h) => h.name).join(", ") || "none"}.`,
        data: {
          name: data.name, goal: { metric: data.goalMetric, value: data.goalValue }, heightCm: data.heightCm,
          program: data.program?.inputs ?? null, coachMemory: data.coachNotes.map((n) => n.text), habits: data.habits.map((h) => ({ id: h.id, name: h.name })),
        },
      };
    },
  }),

  tool({
    name: "remember_preference",
    title: "Remember a preference",
    description:
      "Use when the user shares a lasting preference or constraint worth remembering for future coaching (e.g. 'I train at 6am', 'hate lunges', 'knee feels off on deep squats'). " +
      "The user can see and delete these in the app.",
    input: { text: z.string().min(3).max(200) },
    readOnly: false,
    idempotent: true,
    async run(args, ctx) {
      await ctx.repo.addNote(args.text.trim());
      return { text: `Remembered: "${args.text.trim()}". It's visible in You › Coach memory.`, data: { text: args.text.trim() } };
    },
  }),

  tool({
    name: "forget_preference",
    title: "Forget a preference",
    description: "Use when the user asks you to forget something from coach memory.",
    input: { text: z.string().min(2).max(200).describe("The memory to remove (or a distinctive part of it)") },
    readOnly: false,
    destructive: true,
    idempotent: true,
    async run(args, ctx) {
      const { data } = await loadUser(ctx);
      const q = args.text.toLowerCase();
      const n = data.coachNotes.find((x) => x.text === args.text) ?? data.coachNotes.find((x) => x.text.toLowerCase().includes(q));
      if (!n) return { isError: true, text: `Nothing in coach memory matches "${args.text}".`, data: {} };
      await ctx.repo.deleteNote(n.text);
      return { text: `Forgot: "${n.text}".`, data: { removed: n.text } };
    },
  }),

  tool({
    name: "set_goal",
    title: "Set a goal target",
    description: "Use when the user sets or changes a measurable target: FFMI, body weight (kg) or body-fat %.",
    input: { metric: z.enum(["ffmi", "weight", "bodyfat"]), value: z.number().min(2).max(350) },
    readOnly: false,
    idempotent: true,
    async run(args, ctx) {
      await ctx.repo.updateProfile({ goal_metric: args.metric, goal_value: args.value });
      return { text: `Goal set: ${METRIC_LABEL[args.metric]} ${formatMetric(args.metric)(args.value)}. Progress tracks it from now on.`, data: { ...args } };
    },
  }),
];

/** Runs a tool with validation and friendly errors (never leaks stack traces to the model). */
export async function runTool(def: ToolDef, rawArgs: unknown, ctx: Ctx): Promise<ToolResult> {
  const parsed = z.object(def.input).safeParse(rawArgs ?? {});
  if (!parsed.success) return { isError: true, text: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`, data: {} };
  try {
    return await def.run(parsed.data, ctx);
  } catch (e) {
    if (e instanceof UserError) return { isError: true, text: e.message, data: {} };
    // Duck-typed: @fitness/core may bundle its own zod copy.
    const issues = (e as { issues?: { message: string }[] })?.issues;
    if (Array.isArray(issues)) return { isError: true, text: `Invalid value: ${issues.map((i) => i.message).join("; ")}`, data: {} };
    console.error(JSON.stringify({ level: "error", tool: def.name, error: e instanceof Error ? e.message : String(e) }));
    return { isError: true, text: "LiftWise couldn't complete that right now. Please try again.", data: {} };
  }
}

export const SERVER_INSTRUCTIONS = `LiftWise is the user's AI strength & physique coach: a personalised training plan with progressive overload, readiness check-ins, habit tracking and progress toward a body-composition goal.
- Most tools show an interactive LiftWise card (session, live set logging, exercise details, swaps, plan builder, review, trend chart). When a card is shown, do NOT repeat its contents as a list: reply in one or two sentences with coaching and the next step.
- "What should I train?" → get_today_workout. The card offers a quick check-in and a Start button that guides the user set by set; encourage them to use it.
- No plan yet, or the user wants a new one without giving every detail → plan_builder. With all details → create_program.
- When the user reports sets in chat, log each with log_set (delete_set to undo), then complete_workout when they're done. Sleep/energy/soreness → log_checkin; body weight etc. → log_measurement.
- Questions about one exercise (how to, last time, alternatives) → get_exercise.
- Never change the program silently: swap_exercise and create_program return a preview card first; confirm only after the user agrees.
- Keep answers short and practical. Weights are kg. This is training guidance, not medical advice: for pain or injury suggest a professional.`;
