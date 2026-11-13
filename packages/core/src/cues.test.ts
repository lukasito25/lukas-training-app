import { describe, expect, it } from "vitest";
import { LIBRARY } from "./library";
import { CUES } from "./cues";

describe("exercise cues", () => {
  it("every library exercise has 2–3 cues", () => {
    for (const e of LIBRARY) {
      expect(CUES[e.id], e.id).toBeDefined();
      expect(CUES[e.id].length, e.id).toBeGreaterThanOrEqual(2);
      expect(CUES[e.id].length, e.id).toBeLessThanOrEqual(3);
    }
  });
  it("has no cues for unknown exercises", () => {
    const ids = new Set(LIBRARY.map((e) => e.id));
    expect(Object.keys(CUES).filter((k) => !ids.has(k))).toEqual([]);
  });
});
