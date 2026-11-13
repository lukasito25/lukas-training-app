/**
 * Deterministic program generator: goal + experience + schedule + equipment + limitations
 * → a periodised program. The host AI never writes program JSON; it calls this (or
 * swapExercise / regenerate) and the user approves the diff.
 */
import { z } from "zod";
import {
  EQUIPMENT, GROUP_LABEL, LIBRARY, LIBRARY_BY_ID, isAllowed, parseLimitations,
  type ExerciseDef, type ExerciseFilter, type MuscleGroup,
} from "./library";
import { rirForWeek, sessionTitle, slugify } from "./templates/lukas";
import type { PrescribedExercise, Session } from "./types";

// ---------- inputs ----------

export const GOALS = ["muscle", "strength", "fat", "general", "sport"] as const;
export type Goal = (typeof GOALS)[number];
export const EXPERIENCE = ["beginner", "intermediate", "advanced"] as const;
export type Experience = (typeof EXPERIENCE)[number];
export const FOCUS_AREAS = ["Chest", "Back", "Shoulders", "Arms", "Traps", "Glutes", "Legs", "Core"] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export const ProgramInputsSchema = z.object({
  goal: z.enum(GOALS),
  experience: z.enum(EXPERIENCE),
  focus: z.array(z.enum(FOCUS_AREAS)).max(3),
  daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  sessionMinutes: z.union([z.literal(45), z.literal(60), z.literal(75), z.literal(90)]),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length),
  limitations: z.string().max(300),
  target: z.string().max(120).optional(),
});
export type ProgramInputs = z.infer<typeof ProgramInputsSchema>;

export const GOAL_INFO: Record<Goal, { label: string; detail: string; tag: string }> = {
  muscle: { label: "Build muscle", detail: "Hypertrophy", tag: "HYPERTROPHY" },
  strength: { label: "Get stronger", detail: "Heavier top sets", tag: "STRENGTH" },
  fat: { label: "Lose fat", detail: "Keep muscle", tag: "FAT LOSS" },
  general: { label: "Stay fit", detail: "Consistency first", tag: "GENERAL FITNESS" },
  sport: { label: "Sport performance", detail: "Strength and power for your sport", tag: "PERFORMANCE" },
};

export const SPLIT_LABEL: Record<ProgramInputs["daysPerWeek"], string> = {
  3: "Full body ×3", 4: "Push · Pull · Legs · Arms", 5: "Push · Pull · Legs · Upper · Arms", 6: "Push · Pull · Legs ×2",
};

// ---------- volume landmarks (weekly sets, fractional counting) ----------
// Conservative values in line with common hypertrophy guidance (MEV → MRV).

export const LANDMARKS: Record<MuscleGroup, { mev: number; mav: number; mrv: number }> = {
  chest: { mev: 8, mav: 14, mrv: 22 },
  back: { mev: 10, mav: 16, mrv: 25 },
  shoulders: { mev: 8, mav: 14, mrv: 24 },
  traps: { mev: 4, mav: 8, mrv: 18 },
  biceps: { mev: 6, mav: 12, mrv: 22 },
  triceps: { mev: 6, mav: 10, mrv: 20 },
  quads: { mev: 8, mav: 14, mrv: 20 },
  hamstrings: { mev: 6, mav: 10, mrv: 18 },
  glutes: { mev: 4, mav: 8, mrv: 16 },
  calves: { mev: 6, mav: 10, mrv: 18 },
  core: { mev: 4, mav: 8, mrv: 16 },
};

const EXPERIENCE_FACTOR: Record<Experience, number> = { beginner: 0.25, intermediate: 0.75, advanced: 1 };
const GOAL_VOLUME: Record<Goal, number> = { muscle: 1, strength: 0.8, fat: 0.85, general: 0.7, sport: 0.75 };
const FOCUS_GROUPS: Record<FocusArea, MuscleGroup[]> = {
  Chest: ["chest"], Back: ["back"], Shoulders: ["shoulders"], Arms: ["biceps", "triceps"], Traps: ["traps"],
  Glutes: ["glutes"], Legs: ["quads", "hamstrings"], Core: ["core"],
};
const FOCUS_BONUS = 3;

// ---------- split templates ----------

type DayKind = "push" | "pull" | "legs" | "arms" | "upper" | "full";
const DAY_WEIGHTS: Record<DayKind, Partial<Record<MuscleGroup, number>>> = {
  push: { chest: 1, shoulders: 1, triceps: 0.6 },
  pull: { back: 1, traps: 1, biceps: 0.6, shoulders: 0.3 },
  legs: { quads: 1, hamstrings: 1, glutes: 1, calves: 1, core: 1 },
  arms: { biceps: 1, triceps: 1, shoulders: 0.4 },
  upper: { chest: 1, back: 1, shoulders: 0.5, biceps: 0.3, triceps: 0.3 },
  full: { chest: 1, back: 1, quads: 1, hamstrings: 1, shoulders: 1, glutes: 0.6, biceps: 0.6, triceps: 0.6, traps: 0.5, calves: 0.6, core: 0.6 },
};
const KIND_LABEL: Record<DayKind, string> = { push: "Push", pull: "Pull", legs: "Legs", arms: "Arms+", upper: "Upper", full: "Full body" };

const SPLITS: Record<ProgramInputs["daysPerWeek"], { kinds: DayKind[]; weekdays: number[] }> = {
  3: { kinds: ["full", "full", "full"], weekdays: [0, 2, 4] },
  4: { kinds: ["push", "pull", "legs", "arms"], weekdays: [0, 1, 3, 5] },
  5: { kinds: ["push", "pull", "legs", "upper", "arms"], weekdays: [0, 1, 2, 4, 5] },
  6: { kinds: ["push", "pull", "legs", "push", "pull", "legs"], weekdays: [0, 1, 2, 3, 4, 5] },
};

// ---------- periodisation ----------

export type Phase = "base" | "volume" | "intensity" | "peak";
const BLOCKS: Record<Goal, Phase[]> = {
  muscle: ["base", "volume", "intensity", "volume", "intensity", "peak"],
  strength: ["base", "intensity", "volume", "intensity", "intensity", "peak"],
  fat: ["base", "volume", "volume"],
  general: ["base", "volume"],
  sport: ["base", "intensity", "peak"],
};
const PHASE_VOLUME: Record<Phase, number> = { base: 0.85, volume: 1.1, intensity: 0.9, peak: 0.8 };
const PHASE_SHORT: Record<Phase, string> = { base: "Base", volume: "Vol", intensity: "Int", peak: "Peak" };

export function blockName(blocks: Phase[], i: number): string {
  const p = blocks[i];
  const names: Record<Phase, string> = { base: "Foundation", volume: "Volume", intensity: "Intensity", peak: "Peak" };
  if (p === "base" || p === "peak") return names[p];
  const nth = blocks.slice(0, i + 1).filter((b) => b === p).length;
  const total = blocks.filter((b) => b === p).length;
  return total > 1 ? `${names[p]} ${"I".repeat(nth)}` : names[p];
}
export const phaseShort = (p: Phase) => PHASE_SHORT[p];

function repRange(goal: Goal, phase: Phase, compound: boolean): [number, number] {
  if (!compound) return phase === "intensity" || phase === "peak" ? [8, 12] : [10, 15];
  if (goal === "strength") return { base: [6, 8], volume: [6, 10], intensity: [3, 6], peak: [2, 4] }[phase] as [number, number];
  return { base: [8, 10], volume: [8, 12], intensity: [5, 8], peak: [4, 6] }[phase] as [number, number];
}

// ---------- program ----------

export interface Slot { exerciseId: string; group: MuscleGroup; sets: number; compound: boolean }
export interface DayPlan { key: string; kind: DayKind; label: string; weekday: number; slots: Slot[] }
export interface VolumeRow { group: MuscleGroup; sets: number; target: number; mev: number; mrv: number; focus: boolean }
export interface ProgramChange { version: number; at: string; reason: string }

export interface Program {
  id: string;
  version: number;
  createdAt: string;
  inputs: ProgramInputs;
  blocks: Phase[];
  weeksPerBlock: number;
  deloadWeek: number;
  days: DayPlan[];
  volume: VolumeRow[];
  /** "Built around you" explanations. */
  notes: string[];
  history: ProgramChange[];
}

const REST: Record<"compound" | "isolation", number> = { compound: 150, isolation: 75 };
const slotMinutes = (sets: number, compound: boolean) => (60 + sets * (40 + (compound ? REST.compound : REST.isolation))) / 60;
const dayMinutes = (slots: Slot[]) => slots.reduce((m, s) => m + slotMinutes(s.sets, s.compound), 0);

export function weeklyTargets(inputs: ProgramInputs): Record<MuscleGroup, number> {
  const focus = new Set(inputs.focus.flatMap((f) => FOCUS_GROUPS[f]));
  const out = {} as Record<MuscleGroup, number>;
  for (const g of Object.keys(LANDMARKS) as MuscleGroup[]) {
    const { mev, mav, mrv } = LANDMARKS[g];
    let t = (mev + (mav - mev) * EXPERIENCE_FACTOR[inputs.experience]) * GOAL_VOLUME[inputs.goal];
    if (focus.has(g)) t += FOCUS_BONUS;
    out[g] = Math.round(Math.min(mrv, Math.max(inputs.goal === "general" ? mev * 0.7 : mev, t)));
  }
  return out;
}

function credit(e: ExerciseDef, sets: number, into: Partial<Record<MuscleGroup, number>>) {
  into[e.primary] = (into[e.primary] ?? 0) + sets;
  for (const s of e.secondary) into[s] = (into[s] ?? 0) + sets * 0.5;
}

export function generateProgram(raw: ProgramInputs, opts: { now?: Date; id?: string } = {}): Program {
  const inputs = ProgramInputsSchema.parse(raw);
  const lim = parseLimitations(inputs.limitations);
  const filter: ExerciseFilter = { equipment: inputs.equipment, ...lim };
  const targets = weeklyTargets(inputs);
  const split = SPLITS[inputs.daysPerWeek];
  const notes: string[] = [];

  // How the weekly target for each group is spread over the days that train it.
  const weightSum = {} as Record<MuscleGroup, number>;
  for (const k of split.kinds) for (const [g, w] of Object.entries(DAY_WEIGHTS[k])) weightSum[g as MuscleGroup] = (weightSum[g as MuscleGroup] ?? 0) + w!;

  const usedInWeek = new Map<string, number>();
  let trimmedForTime = false;

  const days: DayPlan[] = split.kinds.map((kind, di) => {
    const credited: Partial<Record<MuscleGroup, number>> = {};
    const chosen: Slot[] = [];
    const weights = DAY_WEIGHTS[kind];
    const alloc = (Object.entries(weights) as [MuscleGroup, number][])
      .map(([g, w]) => ({ g, sets: (targets[g] * w) / weightSum[g] }))
      .sort((a, b) => b.sets - a.sets);

    for (const { g, sets } of alloc) {
      let need = sets - (credited[g] ?? 0);
      if (need < 1.5) continue;
      const main = (weights[g] ?? 0) >= 1;
      const n = need >= 11 ? 3 : need >= 7 ? 2 : 1;
      for (let i = 0; i < n && need >= 1.5; i++) {
        // One compound per muscle per day, and only for the day's main muscles; the rest is
        // isolation work (e.g. rear delts on pull day, lateral raises on arms day).
        const hasCompound = chosen.some((c) => c.group === g && c.compound);
        const wantCompound = main && !hasCompound;
        // A second compound for the same muscle is only allowed when no isolation exists for it at all.
        const noIsolation = !LIBRARY.some((x) => x.primary === g && !x.compound && isAllowed(x, filter));
        const pool = LIBRARY.filter((e) => e.primary === g && isAllowed(e, filter) && !chosen.some((c) => c.exerciseId === e.id)
          && !(hasCompound && e.compound && (!noIsolation || chosen.filter((c) => c.group === g && c.compound).length >= 2)));
        if (pool.length === 0) {
          // Out of options: put the remaining sets on this muscle's existing exercises (max 5 each).
          for (const c of chosen.filter((c) => c.group === g)) {
            const add = Math.min(5 - c.sets, Math.round(need));
            if (add > 0) { c.sets += add; credit(LIBRARY_BY_ID.get(c.exerciseId)!, add, credited); need -= add; }
          }
          break;
        }
        // Prefer: requested movement type, exercises not yet used this week, then library order.
        const usedKit = new Set(chosen.filter((c) => c.group === g).flatMap((c) => LIBRARY_BY_ID.get(c.exerciseId)!.equipment));
        const freshKit = (e: ExerciseDef) => Number(!e.equipment.some((q) => usedKit.has(q)));
        const ranked = [...pool].sort((a, b) =>
          (Number(b.compound === wantCompound) - Number(a.compound === wantCompound)) ||
          (freshKit(b) - freshKit(a)) ||
          ((usedInWeek.get(a.id) ?? 0) - (usedInWeek.get(b.id) ?? 0)) ||
          (LIBRARY.indexOf(a) - LIBRARY.indexOf(b)));
        const pick = ranked[0];
        const s = Math.max(2, Math.min(5, Math.round(need / (n - i))));
        chosen.push({ exerciseId: pick.id, group: g, sets: s, compound: pick.compound });
        credit(pick, s, credited);
        usedInWeek.set(pick.id, (usedInWeek.get(pick.id) ?? 0) + 1);
        need -= s;
      }
    }

    // Never leave a day empty: fall back to any allowed exercise for the day's muscles.
    if (chosen.length === 0) {
      const fallback = LIBRARY.find((e) => weights[e.primary] !== undefined && isAllowed(e, filter));
      if (fallback) chosen.push({ exerciseId: fallback.id, group: fallback.primary, sets: 3, compound: fallback.compound });
    }

    // Compounds first, keeping the group priority order.
    chosen.sort((a, b) => Number(b.compound) - Number(a.compound));

    // Fit the session length: take sets from the muscle that is furthest over its share for
    // the day (so priority muscles keep their volume), then drop exercises if still too long.
    const share = Object.fromEntries(alloc.map((a) => [a.g, a.sets])) as Record<MuscleGroup, number>;
    while (dayMinutes(chosen) > inputs.sessionMinutes && chosen.length > 1) {
      trimmedForTime = true;
      const got: Partial<Record<MuscleGroup, number>> = {};
      for (const s of chosen) credit(LIBRARY_BY_ID.get(s.exerciseId)!, s.sets, got);
      const ratio = (s: Slot) => (got[s.group] ?? 0) / Math.max(1, share[s.group] ?? 1);
      const candidates = chosen.filter((s) => s.sets > 2);
      if (candidates.length) {
        candidates.sort((a, b) => ratio(b) - ratio(a) || Number(a.compound) - Number(b.compound));
        candidates[0].sets -= 1;
      } else {
        const drop = [...chosen].sort((a, b) => ratio(b) - ratio(a) || Number(a.compound) - Number(b.compound))[0];
        chosen.splice(chosen.indexOf(drop), 1);
      }
    }

    return { key: `${kind}-${di + 1}`, kind, label: KIND_LABEL[kind], weekday: split.weekdays[di], slots: chosen };
  });

  // What the week actually delivers (fractional counting), for the preview.
  const delivered: Partial<Record<MuscleGroup, number>> = {};
  for (const d of days) for (const s of d.slots) credit(LIBRARY_BY_ID.get(s.exerciseId)!, s.sets, delivered);
  const focus = new Set(inputs.focus.flatMap((f) => FOCUS_GROUPS[f]));
  const volume: VolumeRow[] = (Object.keys(LANDMARKS) as MuscleGroup[]).map((g) => ({
    group: g, sets: Math.round(delivered[g] ?? 0), target: targets[g], ...LANDMARKS[g], focus: focus.has(g),
  }));

  // ---- "Built around you"
  if (inputs.focus.length) {
    notes.push(`${inputs.focus.join(" & ")} get +${FOCUS_BONUS} weekly sets per muscle because you made ${inputs.focus.length > 1 ? "them" : "it"} a priority.`);
  }
  if (inputs.limitations.trim()) {
    const excluded = LIBRARY.filter((e) => e.equipment.every((q) => inputs.equipment.includes(q)) && !isAllowed(e, filter)).map((e) => e.name);
    notes.push(excluded.length
      ? `Because of "${inputs.limitations.trim()}": no ${excluded.slice(0, 4).join(", ")}${excluded.length > 4 ? ` and ${excluded.length - 4} more` : ""}.`
      : `Noted "${inputs.limitations.trim()}". None of your exercises conflict with it.`);
  }
  const missing = EQUIPMENT.filter((q) => !inputs.equipment.includes(q) && q !== "band");
  if (missing.length) {
    notes.push(`No ${missing.map((m) => ({ barbell: "barbell", dumbbell: "dumbbells", cable: "cables", machine: "machines", pullup_bar: "pull-up bar", band: "bands" })[m]).join(", ")} selected, so exercises use what you have.`);
  }
  for (const v of volume) {
    if (targets[v.group] >= LANDMARKS[v.group].mev && v.sets < LANDMARKS[v.group].mev * 0.75 && (weightSum[v.group] ?? 0) > 0) {
      notes.push(`${GROUP_LABEL[v.group]} volume is low (${v.sets} sets) with this equipment and time. Adding equipment or minutes will help.`);
    }
  }
  if (trimmedForTime) notes.push(`Sessions were trimmed to fit about ${inputs.sessionMinutes} minutes.`);

  const createdAt = (opts.now ?? new Date()).toISOString();
  return {
    id: opts.id ?? `prog-${slugify(createdAt)}`,
    version: 1,
    createdAt,
    inputs,
    blocks: BLOCKS[inputs.goal],
    weeksPerBlock: 8,
    deloadWeek: 8,
    days,
    volume,
    notes,
    history: [{ version: 1, at: createdAt, reason: "Program generated from your goals and schedule" }],
  };
}

export const totalWeeks = (p: Pick<Program, "blocks" | "weeksPerBlock">) => p.blocks.length * p.weeksPerBlock;

/** Session for a 0-based week index of the program and a weekday (Mon = 0). */
export function getProgramSession(p: Program, weekIndex: number, weekday: number): Session & { dayKey: string | null } {
  const w = Math.max(0, Math.min(totalWeeks(p) - 1, weekIndex));
  const blockIdx = Math.floor(w / p.weeksPerBlock);
  const week = (w % p.weeksPerBlock) + 1;
  const phase = p.blocks[blockIdx];
  const deload = week === p.deloadWeek;
  const day = p.days.find((d) => d.weekday === weekday);

  if (!day) {
    return { meso: blockIdx + 1, week, day: "rest", label: "Rest", training: false, deload, title: "Recovery", exercises: [], workingSets: 0, estMinutes: 0, dayKey: null };
  }

  const rir = rirForWeek(week, p.deloadWeek);
  const exercises: PrescribedExercise[] = day.slots.map((s) => {
    const e = LIBRARY_BY_ID.get(s.exerciseId)!;
    // Loaded carries are prescribed by distance, not reps.
    const carry = (e.tags ?? []).includes("carry");
    const range = carry ? null : repRange(p.inputs.goal, phase, s.compound);
    const base = Math.max(2, Math.round(s.sets * PHASE_VOLUME[phase]));
    return {
      id: e.id,
      name: e.name,
      sets: deload ? Math.ceil(base * 0.5) : base,
      repRange: range,
      repsLabel: range ? `${range[0]}–${range[1]}` : "30–40 m",
      restSec: s.compound ? REST.compound : REST.isolation,
      rir,
      notes: "",
      muscles: e.muscles,
      plane: e.plane,
      demoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " technique")}`,
    };
  });

  const title = sessionTitle(exercises);
  const workingSets = exercises.reduce((n, e) => n + e.sets, 0);
  return {
    meso: blockIdx + 1, week, day: day.kind, label: day.label, training: true, deload, title,
    exercises, workingSets, estMinutes: Math.round(day.slots.reduce((m, s, i) => m + slotMinutes(exercises[i].sets, s.compound), 0)), dayKey: day.key,
  };
}

// ---------- changes the AI (or the user) can propose; always returned as a diff to approve ----------

export interface ProgramDiff { reason: string; before: string; after: string; dayLabel: string }

export function alternativesFor(p: Program, dayKey: string, exerciseId: string): ExerciseDef[] {
  const day = p.days.find((d) => d.key === dayKey);
  const cur = LIBRARY_BY_ID.get(exerciseId);
  if (!day || !cur) return [];
  const lim = parseLimitations(p.inputs.limitations);
  const filter: ExerciseFilter = { equipment: p.inputs.equipment, ...lim };
  return LIBRARY.filter((e) => e.primary === cur.primary && e.id !== cur.id && isAllowed(e, filter) && !day.slots.some((s) => s.exerciseId === e.id))
    .sort((a, b) => Number(b.compound === cur.compound) - Number(a.compound === cur.compound));
}

export function swapExercise(p: Program, dayKey: string, exerciseId: string, replacementId: string, reason = "Swapped at your request"): { program: Program; diff: ProgramDiff } {
  const day = p.days.find((d) => d.key === dayKey);
  const from = LIBRARY_BY_ID.get(exerciseId);
  const to = LIBRARY_BY_ID.get(replacementId);
  if (!day || !from || !to) throw new Error("Unknown day or exercise");
  if (!alternativesFor(p, dayKey, exerciseId).some((e) => e.id === to.id)) {
    throw new Error(`${to.name} is not a valid replacement for ${from.name} with your equipment and limitations`);
  }
  const at = new Date().toISOString();
  const version = p.version + 1;
  const days = p.days.map((d) => d.key !== dayKey ? d : {
    ...d,
    slots: d.slots.map((s) => s.exerciseId === exerciseId ? { ...s, exerciseId: to.id, compound: to.compound } : s),
  });
  return {
    program: { ...p, version, days, history: [...p.history, { version, at, reason: `${reason}: ${from.name} → ${to.name}` }] },
    diff: { reason, before: from.name, after: to.name, dayLabel: day.label },
  };
}
