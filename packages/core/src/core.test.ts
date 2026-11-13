import { describe, expect, it } from "vitest";
import {
  autoregulate,
  CheckinSchema,
  getLukasSession,
  LUKAS_WEEK,
  nextPrescription,
  parseRepRange,
  parseRestSec,
  sessionTitle,
  SetLogSchema,
  type Checkin,
} from "./index";

const checkin = (over: Partial<Checkin> = {}): Checkin => ({
  date: "2026-11-12", sleepHours: 8, energy: 4, soreness: "low", ...over,
});

describe("parsing legacy prescriptions", () => {
  it("parses rep ranges", () => {
    expect(parseRepRange("6-8")).toEqual([6, 8]);
    expect(parseRepRange("12-15+8")).toEqual([12, 15]);
    expect(parseRepRange("10")).toEqual([10, 10]);
    expect(parseRepRange("40m")).toBeNull();
    expect(parseRepRange("2+ hours")).toBeNull();
  });
  it("parses rest", () => {
    expect(parseRestSec("3 min")).toBe(180);
    expect(parseRestSec("2.5 min")).toBe(150);
    expect(parseRestSec("90 sec")).toBe(90);
    expect(parseRestSec("-")).toBeNull();
  });
  it("builds readable titles", () => {
    expect(sessionTitle([{ muscles: ["chest"], sets: 4 }, { muscles: ["front_delts"], sets: 3 }, { muscles: ["traps"], sets: 2 }]))
      .toBe("Chest, shoulders & traps");
    expect(sessionTitle([{ muscles: ["lats"], sets: 4 }, { muscles: ["biceps"], sets: 3 }])).toBe("Back & biceps");
  });
});

describe("Lukas template", () => {
  it("covers every block, week and day without throwing", () => {
    for (let m = 1; m <= 6; m++)
      for (let w = 1; w <= 8; w++)
        for (const d of LUKAS_WEEK) {
          const s = getLukasSession(m, w, d);
          if (s.training) {
            expect(s.exercises.length).toBeGreaterThan(0);
            expect(s.workingSets).toBeGreaterThan(0);
            for (const e of s.exercises) expect(e.id).toMatch(/^[a-z0-9-]+$/);
          } else {
            expect(s.exercises).toEqual([]);
          }
        }
  });
  it("halves sets in the deload week", () => {
    const normal = getLukasSession(2, 7, "push");
    const deload = getLukasSession(2, 8, "push");
    expect(deload.deload).toBe(true);
    expect(deload.exercises[0].sets).toBe(Math.ceil(normal.exercises[0].sets / 2));
    expect(deload.exercises[0].rir).toBe(4);
  });
  it("rejects out-of-range positions", () => {
    expect(() => getLukasSession(7, 1, "push")).toThrow(RangeError);
  });
});

describe("nextPrescription", () => {
  const base = { repRange: [6, 10] as [number, number], targetRir: 2 };

  it("asks for a starting weight without history", () => {
    const s = nextPrescription({ ...base, history: [] });
    expect(s.kind).toBe("start");
    expect(s.weightKg).toBeNull();
  });
  it("adds 2.5 kg when every set hit the top of the range at target RIR", () => {
    const s = nextPrescription({ ...base, history: [[{ weightKg: 80, reps: 10, rir: 2 }, { weightKg: 80, reps: 10, rir: 2 }]] });
    expect(s).toMatchObject({ kind: "increase", weightKg: 82.5, targetReps: 6 });
    expect(s.reason).toContain("80 × 10 at 2 RIR");
  });
  it("does not increase when the top reps came too close to failure", () => {
    const s = nextPrescription({ ...base, history: [[{ weightKg: 80, reps: 10, rir: 0 }]] });
    expect(s.kind).toBe("hold");
  });
  it("holds and asks for one more rep mid-range", () => {
    const s = nextPrescription({ ...base, history: [[{ weightKg: 80, reps: 8, rir: 2 }, { weightKg: 80, reps: 7, rir: 2 }]] });
    expect(s).toMatchObject({ kind: "hold", weightKg: 80, targetReps: 8 });
  });
  it("backs off ~5% after two sessions below the range", () => {
    const short = [{ weightKg: 100, reps: 4, rir: 0 }];
    const s = nextPrescription({ ...base, history: [short, short] });
    expect(s).toMatchObject({ kind: "decrease", weightKg: 95 });
  });
});

describe("autoregulate", () => {
  const session = getLukasSession(2, 3, "push");

  it("leaves the session alone on a good day", () => {
    const r = autoregulate(session, checkin());
    expect(r.adjustment.kind).toBe("none");
    expect(r.session).toBe(session);
  });
  it("trims accessories for short sleep and explains why", () => {
    const r = autoregulate(session, checkin({ sleepHours: 6 }));
    expect(r.adjustment.kind).toBe("trim");
    expect(r.session.workingSets).toBeLessThan(session.workingSets);
    expect(r.session.exercises[0].sets).toBe(session.exercises[0].sets); // main lift untouched
    expect(r.adjustment.reason).toBe(`Trimmed from ${session.workingSets} sets for short sleep`);
  });
  it("prescribes a recovery dose when several signals are bad", () => {
    const r = autoregulate(session, checkin({ sleepHours: 5, energy: 1 }));
    expect(r.adjustment.kind).toBe("recover");
    expect(r.session.exercises.every((e, i) => e.rir === session.exercises[i].rir + 1)).toBe(true);
    expect(r.adjustment.reason).toContain("short sleep and low energy");
  });
  it("never trims deload weeks or rest days", () => {
    expect(autoregulate(getLukasSession(2, 8, "push"), checkin({ sleepHours: 5 })).adjustment.kind).toBe("none");
    expect(autoregulate(getLukasSession(2, 3, "rest"), checkin({ sleepHours: 5 })).adjustment.kind).toBe("none");
  });
});

describe("input validation", () => {
  it("rejects absurd set logs", () => {
    expect(SetLogSchema.safeParse({ exerciseId: "bench", setIndex: 0, weightKg: 5000, reps: 5, rir: 2, completedAt: new Date().toISOString() }).success).toBe(false);
  });
  it("accepts a valid check-in", () => {
    expect(CheckinSchema.safeParse(checkin()).success).toBe(true);
  });
});
