/**
 * Progress maths: FFMI, goal pace, and the weekly review shown on Progress and by the
 * get_weekly_review tool.
 */
import { z } from "zod";
import type { SetLog } from "./types";

export const MeasurementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().min(25).max(350),
  bodyFatPct: z.number().min(2).max(60).nullable(),
  armsCm: z.number().min(15).max(80).nullable(),
  chestCm: z.number().min(50).max(200).nullable(),
  waistCm: z.number().min(40).max(200).nullable(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

/** Normalised fat-free mass index (Kouri et al. 1995): FFM / h² + 6.1 × (1.8 − h). */
export function ffmi(weightKg: number, heightCm: number, bodyFatPct: number): number {
  const h = heightCm / 100;
  const ffm = weightKg * (1 - bodyFatPct / 100);
  return Math.round((ffm / (h * h) + 6.1 * (1.8 - h)) * 10) / 10;
}

export interface Point { week: number; value: number }

/** Least-squares slope per week; null with fewer than two distinct weeks. */
export function slopePerWeek(points: Point[]): number | null {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.week, 0) / n;
  const my = points.reduce((s, p) => s + p.value, 0) / n;
  const den = points.reduce((s, p) => s + (p.week - mx) ** 2, 0);
  if (den === 0) return null;
  return points.reduce((s, p) => s + (p.week - mx) * (p.value - my), 0) / den;
}

export interface Pace {
  status: "on_pace" | "behind" | "ahead" | "not_enough_data";
  /** Week (from program start) the goal is projected to be reached at the current rate. */
  projectedWeek: number | null;
}

export function goalPace(points: Point[], start: number, goal: number, goalWeek: number): Pace {
  const slope = slopePerWeek(points);
  if (slope === null || points.length < 2) return { status: "not_enough_data", projectedWeek: null };
  const latest = points[points.length - 1];
  const remaining = goal - latest.value;
  const towardsGoal = Math.sign(goal - start) || 1;
  if (slope * towardsGoal <= 0) return { status: "behind", projectedWeek: null };
  const projectedWeek = Math.round(latest.week + remaining / slope);
  const status = projectedWeek <= goalWeek - 2 ? "ahead" : projectedWeek <= goalWeek + 2 ? "on_pace" : "behind";
  return { status, projectedWeek };
}

// ---------- weekly review ----------

export interface Best { exerciseId: string; weightKg: number; reps: number; previousReps: number | null; previousWeightKg: number | null }

export interface WeeklyReview {
  sessionsDone: number;
  sessionsPlanned: number;
  setsDone: number;
  setsPlanned: number;
  newBests: Best[];
}

/** Estimated 1RM (Epley); used only to compare sets, never shown as a max. */
const e1rm = (kg: number, reps: number) => kg * (1 + reps / 30);

/**
 * @param logs all set logs; the week is [weekStart, weekEnd) in local ISO dates
 * @param planned sessions and sets the program prescribed for that week
 */
export function weeklyReview(
  logs: (SetLog & { date: string })[],
  completedDates: string[],
  weekStart: string,
  weekEnd: string,
  planned: { sessions: number; sets: number },
): WeeklyReview {
  const inWeek = (d: string) => d >= weekStart && d < weekEnd;
  const thisWeek = logs.filter((l) => inWeek(l.date) && l.reps > 0);
  const before = logs.filter((l) => l.date < weekStart && l.reps > 0);

  const bestOf = (ls: typeof logs) => {
    const m = new Map<string, SetLog>();
    for (const l of ls) {
      const cur = m.get(l.exerciseId);
      if (!cur || e1rm(l.weightKg, l.reps) > e1rm(cur.weightKg, cur.reps)) m.set(l.exerciseId, l);
    }
    return m;
  };
  const prev = bestOf(before);
  const now = bestOf(thisWeek);
  const newBests: Best[] = [];
  for (const [id, b] of now) {
    const p = prev.get(id);
    if (p && e1rm(b.weightKg, b.reps) > e1rm(p.weightKg, p.reps)) {
      newBests.push({ exerciseId: id, weightKg: b.weightKg, reps: b.reps, previousReps: p.reps, previousWeightKg: p.weightKg });
    }
  }
  newBests.sort((a, b) => e1rm(b.weightKg, b.reps) - e1rm(a.weightKg, a.reps));

  return {
    sessionsDone: new Set(completedDates.filter(inWeek)).size,
    sessionsPlanned: planned.sessions,
    setsDone: thisWeek.length,
    setsPlanned: planned.sets,
    newBests,
  };
}
