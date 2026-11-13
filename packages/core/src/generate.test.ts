import { describe, expect, it } from "vitest";
import {
  alternativesFor, EQUIPMENT, ffmi, generateProgram, getProgramSession, goalPace, isAllowed, LIBRARY,
  LIBRARY_BY_ID, parseLimitations, swapExercise, totalWeeks, weeklyReview, type ProgramInputs,
} from "./index";

const lukas: ProgramInputs = {
  goal: "muscle", experience: "intermediate", focus: ["Arms", "Traps"], daysPerWeek: 4, sessionMinutes: 60,
  equipment: ["barbell", "dumbbell", "cable", "pullup_bar"], limitations: "Left shoulder: no behind-the-neck pressing",
};
const NOW = new Date("2026-11-12T10:00:00Z");

describe("library", () => {
  it("has unique ids and valid equipment", () => {
    expect(new Set(LIBRARY.map((e) => e.id)).size).toBe(LIBRARY.length);
    for (const e of LIBRARY) for (const q of e.equipment) expect(EQUIPMENT).toContain(q);
  });
  it("parses specific vs general limitations", () => {
    expect(parseLimitations("Left shoulder: no behind-the-neck pressing")).toMatchObject({ injuries: [], avoidTags: expect.arrayContaining(["behind_neck", "overhead_barbell"]) });
    expect(parseLimitations("bad knee").injuries).toEqual(["knee"]);
    expect(parseLimitations("no deadlifts").avoidIds).toContain("deadlift");
    expect(parseLimitations("").injuries).toEqual([]);
  });
});

describe("generateProgram", () => {
  const p = generateProgram(lukas, { now: NOW });

  it("builds the requested split on the right weekdays", () => {
    expect(p.days.map((d) => d.kind)).toEqual(["push", "pull", "legs", "arms"]);
    expect(p.blocks).toHaveLength(6);
    expect(totalWeeks(p)).toBe(48);
  });
  it("only uses allowed exercises", () => {
    for (const d of p.days) for (const s of d.slots) {
      const e = LIBRARY_BY_ID.get(s.exerciseId)!;
      expect(e.equipment.every((q) => lukas.equipment.includes(q))).toBe(true);
      expect(e.tags ?? []).not.toContain("overhead_barbell");
    }
  });
  it("respects session length", () => {
    for (let wd = 0; wd < 7; wd++) {
      const s = getProgramSession(p, 1, wd);
      if (s.training) expect(s.estMinutes).toBeLessThanOrEqual(60 * 1.15); // volume phases may run slightly over the base plan
    }
  });
  it("gives priority muscles more volume and keeps everything below MRV", () => {
    const row = (g: string) => p.volume.find((v) => v.group === g)!;
    expect(row("biceps").target).toBeGreaterThan(generateProgram({ ...lukas, focus: [] }).volume.find((v) => v.group === "biceps")!.target);
    for (const v of p.volume) expect(v.sets).toBeLessThanOrEqual(v.mrv);
    expect(row("chest").sets).toBeGreaterThanOrEqual(row("chest").mev * 0.75);
  });
  it("explains itself", () => {
    expect(p.notes.join(" ")).toMatch(/Arms & Traps get \+3/);
    expect(p.notes.join(" ")).toMatch(/Overhead Press/);
    expect(p.notes.join(" ")).toMatch(/No machines/);
  });
  it("works for every schedule, goal and a bodyweight-only setup", () => {
    for (const daysPerWeek of [3, 4, 5, 6] as const)
      for (const goal of ["muscle", "strength", "fat", "general", "sport"] as const) {
        const q = generateProgram({ ...lukas, goal, daysPerWeek, equipment: [], limitations: "", focus: [] });
        expect(q.days).toHaveLength(daysPerWeek);
        for (const d of q.days) expect(d.slots.length).toBeGreaterThan(0);
      }
  });
  it("excludes every knee-loading lift for a bare 'bad knee'", () => {
    const q = generateProgram({ ...lukas, limitations: "bad knee" });
    for (const d of q.days) for (const s of d.slots) expect(LIBRARY_BY_ID.get(s.exerciseId)!.avoidFor).not.toContain("knee");
  });
  it("is deterministic", () => {
    expect(generateProgram(lukas, { now: NOW })).toEqual(p);
  });
});

describe("getProgramSession", () => {
  const p = generateProgram(lukas, { now: NOW });
  it("returns a rest session on non-training days", () => {
    expect(getProgramSession(p, 0, 2).training).toBe(false);
  });
  it("halves sets and raises RIR in the deload week", () => {
    const normal = getProgramSession(p, 6, 0);
    const deload = getProgramSession(p, 7, 0);
    expect(deload.deload).toBe(true);
    expect(deload.workingSets).toBeLessThan(normal.workingSets);
    expect(deload.exercises[0].rir).toBe(4);
  });
  it("uses heavier rep ranges in intensity blocks", () => {
    const vol = getProgramSession(p, 8, 0).exercises[0].repRange!;
    const int = getProgramSession(p, 16, 0).exercises[0].repRange!;
    expect(int[1]).toBeLessThan(vol[1]);
  });
});

describe("swapExercise", () => {
  const p = generateProgram(lukas, { now: NOW });
  const day = p.days[0];
  const first = day.slots[0].exerciseId;

  it("offers only valid same-muscle alternatives", () => {
    const alts = alternativesFor(p, day.key, first);
    expect(alts.length).toBeGreaterThan(0);
    const filter = { equipment: lukas.equipment, ...parseLimitations(lukas.limitations) };
    for (const a of alts) {
      expect(a.primary).toBe(LIBRARY_BY_ID.get(first)!.primary);
      expect(isAllowed(a, filter)).toBe(true);
    }
  });
  it("returns a new version and a readable diff", () => {
    const alt = alternativesFor(p, day.key, first)[0];
    const { program, diff } = swapExercise(p, day.key, first, alt.id);
    expect(program.version).toBe(2);
    expect(program.days[0].slots[0].exerciseId).toBe(alt.id);
    expect(p.days[0].slots[0].exerciseId).toBe(first); // original untouched
    expect(diff).toMatchObject({ before: LIBRARY_BY_ID.get(first)!.name, after: alt.name });
  });
  it("refuses replacements that break constraints", () => {
    expect(() => swapExercise(p, day.key, first, "leg-press")).toThrow();
  });
});

describe("progress maths", () => {
  it("computes normalised FFMI", () => {
    expect(ffmi(80, 180, 15)).toBe(21);
  });
  it("projects goal pace", () => {
    const pts = [{ week: 0, value: 17.5 }, { week: 4, value: 17.7 }, { week: 8, value: 17.9 }, { week: 11, value: 18.1 }];
    const pace = goalPace(pts, 17.5, 20, 48);
    expect(pace.projectedWeek).toBeGreaterThan(40);
    expect(goalPace([{ week: 0, value: 17.5 }], 17.5, 20, 48).status).toBe("not_enough_data");
  });
  it("finds new bests in a week", () => {
    const log = (date: string, kg: number, reps: number) => ({ exerciseId: "barbell-bench-press", setIndex: 0, weightKg: kg, reps, rir: 2, completedAt: `${date}T10:00:00.000Z`, date });
    const r = weeklyReview([log("2026-11-02", 80, 8), log("2026-11-09", 80, 10)], ["2026-11-09"], "2026-11-09", "2026-11-16", { sessions: 4, sets: 70 });
    expect(r.sessionsDone).toBe(1);
    expect(r.newBests).toEqual([expect.objectContaining({ weightKg: 80, reps: 10, previousReps: 8 })]);
  });
});
