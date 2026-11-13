/**
 * Adjusts today's session from the morning check-in. Every adjustment carries a
 * plain-language reason, because the design shows it in place ("Trimmed from 30 sets for short sleep").
 */
import type { Checkin, Session } from "./types";

export interface Adjustment {
  kind: "none" | "trim" | "recover";
  originalSets: number;
  newSets: number;
  /** e.g. "Trimmed from 30 sets for short sleep". Empty when kind is "none". */
  reason: string;
  factors: string[];
}

export function readinessFactors(c: Checkin): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];
  if (c.sleepHours < 6) { score -= 2; factors.push("short sleep"); }
  else if (c.sleepHours < 7) { score -= 1; factors.push("short sleep"); }
  if (c.energy <= 1) { score -= 2; factors.push("low energy"); }
  else if (c.energy === 2) { score -= 1; factors.push("low energy"); }
  if (c.soreness === "max") { score -= 2; factors.push("soreness"); }
  else if (c.soreness === "high") { score -= 1; factors.push("soreness"); }
  return { score, factors };
}

const joinFactors = (f: string[]) => (f.length <= 1 ? f.join("") : `${f.slice(0, -1).join(", ")} and ${f[f.length - 1]}`);

/**
 * score 0      → no change
 * score -1/-2  → trim ~15% of sets from accessories (main lift untouched)
 * score ≤ -3   → recovery dose: ~35% fewer sets and +1 RIR everywhere
 * Deload weeks and rest days are never trimmed further.
 */
export function autoregulate(session: Session, checkin: Checkin | null): { session: Session; adjustment: Adjustment } {
  const original = session.workingSets;
  const none: Adjustment = { kind: "none", originalSets: original, newSets: original, reason: "", factors: [] };
  if (!checkin || !session.training || session.deload) return { session, adjustment: none };

  const { score, factors } = readinessFactors(checkin);
  if (score >= 0) return { session, adjustment: none };

  const kind: Adjustment["kind"] = score <= -3 ? "recover" : "trim";
  const pct = kind === "recover" ? 0.35 : 0.15;
  let toRemove = Math.max(1, Math.round(original * pct));

  const exercises = session.exercises.map((e) => ({ ...e }));
  // Remove one set at a time from the last exercise backwards, never touching the first (main) lift
  // and never going below 2 sets.
  let progressed = true;
  while (toRemove > 0 && progressed) {
    progressed = false;
    for (let i = exercises.length - 1; i >= 1 && toRemove > 0; i--) {
      if (exercises[i].sets > 2) {
        exercises[i].sets -= 1;
        toRemove -= 1;
        progressed = true;
      }
    }
  }
  if (kind === "recover") for (const e of exercises) e.rir += 1;

  const newSets = exercises.reduce((n, e) => n + e.sets, 0);
  if (newSets === original) return { session, adjustment: none };

  const reason =
    kind === "recover"
      ? `Recovery dose: ${original} → ${newSets} sets, 1 more rep in reserve, for ${joinFactors(factors)}`
      : `Trimmed from ${original} sets for ${joinFactors(factors)}`;

  return {
    session: { ...session, exercises, workingSets: newSets },
    adjustment: { kind, originalSets: original, newSets, reason, factors },
  };
}
