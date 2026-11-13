import { z } from "zod";

export const MUSCLES = [
  "chest", "upper_chest", "back", "lats", "traps", "shoulders", "front_delts",
  "lateral_delts", "rear_delts", "biceps", "triceps", "forearms", "quads",
  "hamstrings", "glutes", "calves", "core", "erectors",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export type Plane = "sagittal" | "frontal" | "transverse" | "multi";

export const DAY_TYPES = ["push", "pull", "legs", "arms", "active_recovery", "rest", "full_rest"] as const;
export type DayType = (typeof DAY_TYPES)[number];
export const TRAINING_DAYS: readonly DayType[] = ["push", "pull", "legs", "arms"];

/** One exercise as prescribed for a specific session. */
export interface PrescribedExercise {
  id: string;
  name: string;
  sets: number;
  /** Numeric rep range, or null for time/distance work ("40m", "30s"). */
  repRange: [number, number] | null;
  /** Human label, e.g. "6–10" or "40m". */
  repsLabel: string;
  restSec: number | null;
  /** Target reps in reserve for working sets. */
  rir: number;
  notes: string;
  muscles: string[];
  plane: Plane;
  demoUrl: string;
}

export interface Session {
  meso: number;
  week: number;
  /** Day kind: a DayType for the classic template, or push/pull/legs/arms/upper/full for generated programs. */
  day: string;
  /** Display label, e.g. "Push" or "Full body". */
  label: string;
  training: boolean;
  deload: boolean;
  /** e.g. "Chest, shoulders & traps" */
  title: string;
  exercises: PrescribedExercise[];
  workingSets: number;
  estMinutes: number;
}

// ---------- user-entered data (validated at every boundary: UI, MCP tools, DB) ----------

export const SetLogSchema = z.object({
  exerciseId: z.string().min(1).max(120),
  setIndex: z.number().int().min(0).max(20),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(200),
  rir: z.number().int().min(0).max(10).nullable(),
  completedAt: z.string().datetime(),
});
export type SetLog = z.infer<typeof SetLogSchema>;

export const SLEEP_OPTIONS = [5, 6, 7, 8, 9] as const;
export const SORENESS_LEVELS = ["none", "low", "mid", "high", "max"] as const;
export type Soreness = (typeof SORENESS_LEVELS)[number];

export const CheckinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Hours slept; 9 means "9h+". */
  sleepHours: z.number().min(0).max(24),
  /** 1 (drained) – 5 (great) */
  energy: z.number().int().min(1).max(5),
  soreness: z.enum(SORENESS_LEVELS),
});
export type Checkin = z.infer<typeof CheckinSchema>;
