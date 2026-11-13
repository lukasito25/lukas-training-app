/**
 * Load suggestions: double progression with an RIR check.
 * The engine only suggests; the UI always lets the user override (design rule).
 */

export interface LoggedSet {
  weightKg: number;
  reps: number;
  rir: number | null;
}

export interface PrescriptionInput {
  repRange: [number, number];
  targetRir: number;
  /** Working sets from previous sessions of this exercise, most recent session first. */
  history: LoggedSet[][];
  /** Smallest plate jump, default 2.5 kg. */
  incrementKg?: number;
}

export type SuggestionKind = "start" | "increase" | "hold" | "decrease";

export interface Suggestion {
  kind: SuggestionKind;
  weightKg: number | null;
  /** Rep target for the first working set. */
  targetReps: number;
  /** Short explanation, shown next to the load. */
  reason: string;
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step;
const fmt = (kg: number) => (Number.isInteger(kg) ? `${kg}` : kg.toFixed(1));

function topSet(sets: LoggedSet[]): LoggedSet {
  return sets.reduce((best, s) => (s.weightKg > best.weightKg || (s.weightKg === best.weightKg && s.reps > best.reps) ? s : best));
}

/** A session "fell short" when any set at the working weight missed the bottom of the range. */
function fellShort(sets: LoggedSet[], lo: number): boolean {
  const w = topSet(sets).weightKg;
  return sets.some((s) => s.weightKg >= w && s.reps < lo);
}

export function nextPrescription({ repRange, targetRir, history, incrementKg = 2.5 }: PrescriptionInput): Suggestion {
  const [lo, hi] = repRange;
  const last = history[0]?.filter((s) => s.reps > 0) ?? [];

  if (last.length === 0) {
    return {
      kind: "start",
      weightKg: null,
      targetReps: lo,
      reason: `No history yet · pick a weight you could lift about ${hi + targetRir} times`,
    };
  }

  const top = topSet(last);
  const working = last.filter((s) => s.weightKg >= top.weightKg);
  const rirText = top.rir === null ? "" : ` at ${top.rir} RIR`;
  const lastText = `last time ${fmt(top.weightKg)} × ${top.reps}${rirText}`;

  // Every working set reached the top of the range without going closer to failure than planned.
  const allTop = working.every((s) => s.reps >= hi && (s.rir === null || s.rir >= targetRir));
  if (allTop) {
    const w = roundTo(top.weightKg + incrementKg, incrementKg);
    return { kind: "increase", weightKg: w, targetReps: lo, reason: `suggested: ${lastText}` };
  }

  // Two sessions in a row below the range: back off ~5% to rebuild reps.
  const prev = history[1]?.filter((s) => s.reps > 0) ?? [];
  if (fellShort(last, lo) && prev.length > 0 && fellShort(prev, lo)) {
    const w = Math.max(0, roundTo(top.weightKg * 0.95, incrementKg));
    return { kind: "decrease", weightKg: w, targetReps: lo, reason: `eased off: missed ${lo} reps twice` };
  }

  const minReps = Math.min(...working.map((s) => s.reps));
  return {
    kind: "hold",
    weightKg: top.weightKg,
    targetReps: Math.min(hi, Math.max(lo, minReps + 1)),
    reason: `same load, add a rep · ${lastText}`,
  };
}
