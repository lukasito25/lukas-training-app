/**
 * Adapter that turns the legacy hard-coded 48-week program (lukas-source.ts) into
 * typed Sessions. This is template #1; generated programs will produce the same Session shape.
 */
import { exercises as legacyExercises, mesos as legacyMesos } from "./lukas-source";
import type { DayType, Plane, PrescribedExercise, Session } from "../types";
import { TRAINING_DAYS } from "../types";

export const LUKAS_TEMPLATE = {
  id: "lukas-48wk-hypertrophy",
  mesoCount: 6,
  weeksPerMeso: 8,
  /** Week 8 of every block is a deload, as in the legacy app. */
  deloadWeek: 8,
  mesoNames: legacyMesos as Record<number, string>,
} as const;

export const DAY_LABELS: Record<DayType, string> = {
  push: "Push", pull: "Pull", legs: "Legs", arms: "Arms+",
  active_recovery: "Active recovery", rest: "Rest", full_rest: "Full rest",
};

/** Weekly layout used by the legacy app (Mon → Sun). */
export const LUKAS_WEEK: DayType[] = ["push", "active_recovery", "pull", "rest", "legs", "arms", "full_rest"];

interface LegacyExercise {
  name: string;
  sets: number | string;
  reps: string;
  rest: string;
  notes: string;
  muscles: string[];
  demo: string;
  plane?: string;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "6-8" → [6, 8]; "12-15+8" → [12, 15]; "10" → [10, 10]; "40m" / "2+ hours" → null */
export function parseRepRange(reps: string): [number, number] | null {
  const m = reps.trim().match(/^(\d+)\s*(?:[-–]\s*(\d+))?(?:\+\d+)?$/);
  if (!m) return null;
  const lo = Number(m[1]);
  const hi = m[2] ? Number(m[2]) : lo;
  return [Math.min(lo, hi), Math.max(lo, hi)];
}

/** "3 min" → 180, "2.5 min" → 150, "90 sec" → 90, "-" → null */
export function parseRestSec(rest: string): number | null {
  const m = rest.trim().match(/^(\d+(?:\.\d+)?)\s*(min|sec|s)\b/i);
  if (!m) return null;
  const v = Number(m[1]);
  return m[2].toLowerCase() === "min" ? Math.round(v * 60) : Math.round(v);
}

/** RIR schedule inside an 8-week block: start conservative, get closer to failure, deload. */
export function rirForWeek(week: number, deloadWeek = 8): number {
  if (week >= deloadWeek) return 4;
  if (week <= 2) return 3;
  if (week <= 4) return 2;
  return 1;
}

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Chest", upper_chest: "Chest", back: "Back", lats: "Back", traps: "Traps",
  shoulders: "Shoulders", front_delts: "Shoulders", lateral_delts: "Shoulders", rear_delts: "Shoulders",
  biceps: "Biceps", triceps: "Triceps", forearms: "Forearms", quads: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", core: "Core", erectors: "Lower back",
};

/** Top three muscle groups by sets, using each exercise's primary (first) muscle. */
export function sessionTitle(exs: Pick<PrescribedExercise, "muscles" | "sets">[]): string {
  const score = new Map<string, number>();
  for (const e of exs) {
    const label = e.muscles[0] && MUSCLE_LABEL[e.muscles[0]];
    if (label) score.set(label, (score.get(label) ?? 0) + e.sets);
  }
  const top = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);
  if (top.length === 0) return "Recovery";
  if (top.length === 1) return top[0];
  const [first, ...rest] = [top[0], ...top.slice(1).map((l) => l.toLowerCase())];
  const last = rest.pop()!;
  return [first, ...rest].join(", ") + " & " + last;
}

/** Rough session length: per set ~40 s of work plus prescribed rest, plus 1 min setup per exercise. */
export function estimateMinutes(exs: PrescribedExercise[]): number {
  let sec = 0;
  for (const e of exs) sec += 60 + e.sets * (40 + (e.restSec ?? 60));
  return Math.round(sec / 60);
}

export function getLukasSession(meso: number, week: number, day: DayType): Session {
  if (meso < 1 || meso > LUKAS_TEMPLATE.mesoCount) throw new RangeError(`meso ${meso} out of range`);
  if (week < 1 || week > LUKAS_TEMPLATE.weeksPerMeso) throw new RangeError(`week ${week} out of range`);

  const training = TRAINING_DAYS.includes(day);
  const deload = week === LUKAS_TEMPLATE.deloadWeek;
  const byDay = legacyExercises[day as keyof typeof legacyExercises] as Record<number, LegacyExercise[]> | undefined;
  const raw = byDay?.[meso] ?? [];
  const rir = rirForWeek(week, LUKAS_TEMPLATE.deloadWeek);

  const exercises: PrescribedExercise[] = training
    ? raw.map((e) => {
        const baseSets = typeof e.sets === "number" ? e.sets : 3;
        const range = parseRepRange(e.reps);
        return {
          id: slugify(e.name),
          name: e.name,
          // Legacy deload rule: 50% of sets, rounded up.
          sets: deload ? Math.ceil(baseSets * 0.5) : baseSets,
          repRange: range,
          repsLabel: range ? (range[0] === range[1] ? `${range[0]}` : `${range[0]}–${range[1]}`) : e.reps,
          restSec: parseRestSec(e.rest),
          rir,
          notes: e.notes,
          muscles: e.muscles,
          plane: (e.plane as Plane) ?? "sagittal",
          demoUrl: e.demo || `https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " technique")}`,
        };
      })
    : [];

  return {
    meso,
    week,
    day,
    label: DAY_LABELS[day],
    training,
    deload,
    title: training ? sessionTitle(exercises) : "Recovery",
    exercises,
    workingSets: exercises.reduce((n, e) => n + e.sets, 0),
    estMinutes: estimateMinutes(exercises),
  };
}
