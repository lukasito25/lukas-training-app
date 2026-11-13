import { describe, expect, it } from "vitest";
import { TOOLS, runTool, type Ctx } from "../src/tools";
import { memoryRepo, emptyProfile } from "../src/repo";
import { demoRows } from "../src/demo";
import { createHandler } from "../src/http";

// Monday 9 Nov 2026, 18:00 UTC
const NOW = new Date("2026-11-09T18:00:00Z");
const tool = (name: string) => TOOLS.find((t) => t.name === name)!;
const setup = () => {
  const repo = memoryRepo(demoRows(NOW), "UTC");
  const ctx: Ctx = { repo, source: "claude", now: NOW };
  const call = (name: string, args: Record<string, unknown> = {}) => runTool(tool(name), args, ctx);
  return { repo, call };
};

describe("MCP tools", () => {
  it("every tool has a description, title and annotations-relevant flags", () => {
    for (const t of TOOLS) {
      expect(t.description.length).toBeGreaterThan(40);
      expect(t.name).toMatch(/^[a-z_]+$/);
    }
    expect(new Set(TOOLS.map((t) => t.name)).size).toBe(TOOLS.length);
  });

  it("get_today_workout returns Monday's session with exercises", async () => {
    const { call } = setup();
    const r = await call("get_today_workout");
    expect(r.isError).toBeFalsy();
    expect(r.data.training).toBe(true);
    expect((r.data.exercises as unknown[]).length).toBeGreaterThan(2);
    expect(r.text).toMatch(/Monday · Week 1/);
  });

  it("log_set matches by name, auto-numbers sets and is idempotent per set", async () => {
    const { call, repo } = setup();
    const a = await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 8 });
    const b = await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 7 });
    expect((a.data.justLogged as { set: number }).set).toBe(1);
    expect((b.data.justLogged as { set: number }).set).toBe(2);
    expect(b.data.view).toBe("today");
    expect(b.data.status).toBe("in_progress");
    await call("log_set", { exercise: "bench press", weight_kg: 82.5, reps: 8, set_number: 1 });
    expect(repo.rows.setLogs).toHaveLength(2);
    expect(repo.rows.setLogs.find((l) => l.set_index === 0)!.weight_kg).toBe(82.5);
    expect(repo.rows.setLogs.every((l) => l.source === "claude")).toBe(true);
  });

  it("log_set refuses exercises outside today's session", async () => {
    const { call } = setup();
    const r = await call("log_set", { exercise: "leg press machine xyz", weight_kg: 100, reps: 10 });
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/isn't in Monday's session/);
  });

  it("a poor check-in trims today's session and says why", async () => {
    const { call } = setup();
    const r = await call("log_checkin", { sleep_hours: 5, energy: 2, soreness: "high" });
    expect(r.data.adjustment).toMatch(/sets/);
    const t = await call("get_today_workout");
    expect(t.data.adjustment).toBeTruthy();
  });

  it("swap_exercise previews first and only saves with confirm", async () => {
    const { call, repo } = setup();
    const list = await call("swap_exercise", { exercise: "bench press", weekday: 0 });
    expect((list.data.alternatives as unknown[]).length).toBeGreaterThan(0);
    const preview = await call("swap_exercise", { exercise: "bench press", weekday: 0, replacement: "dumbbell bench press" });
    expect(list.data).toMatchObject({ view: "change", stage: "pick" });
    expect(preview.data).toMatchObject({ view: "change", stage: "preview", before: expect.stringMatching(/Bench/), after: expect.stringMatching(/Dumbbell Bench/) });
    expect(repo.rows.program!.version).toBe(1);
    const done = await call("swap_exercise", preview.data.confirmArgs as Record<string, unknown>);
    expect(done.data.view).toBe("today");
    expect((done.data.applied as { version: number }).version).toBe(2);
    expect(repo.rows.program!.version).toBe(2);
    expect(repo.rows.program!.data.history.at(-1)!.reason).toMatch(/Barbell Bench Press → Dumbbell Bench Press/);
  });

  it("create_program previews, then saves and restarts at week 1", async () => {
    const { call, repo } = setup();
    const args = { goal: "strength", experience: "beginner", days_per_week: 3, session_minutes: 45, equipment: ["dumbbell", "band"] };
    const p = await call("create_program", args);
    expect(p.data.view).toBe("plan_preview");
    expect((p.data.days as unknown[]).length).toBe(3);
    expect(repo.rows.program!.data.inputs.goal).toBe("muscle");
    const saved = await call("create_program", { ...args, confirm: true, limitations: "Left knee: no deep lunges" });
    expect(saved.data).toMatchObject({ view: "today", saved: { version: 2 } });
    expect(repo.rows.program!.data.inputs.goal).toBe("strength");
    expect(repo.rows.profile!.program_start).toBe("2026-11-09");
    expect(repo.rows.coachNotes.map((n) => n.text)).toContain("Left knee: no deep lunges");
  });

  it("weekly review counts logged sets and completed sessions", async () => {
    const { call } = setup();
    await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 8 });
    await call("complete_workout");
    const r = await call("get_weekly_review");
    const review = r.data.review as { sessionsDone: number; setsDone: number };
    expect(review.sessionsDone).toBe(1);
    expect(review.setsDone).toBe(1);
  });

  it("measurements feed goal progress (FFMI)", async () => {
    const { call } = setup();
    await call("log_measurement", { weight_kg: 80, body_fat_pct: 15 });
    const r = await call("get_progress");
    expect(r.data.metric).toBe("ffmi");
    expect((r.data.points as unknown[]).length).toBe(1);
  });

  it("coach memory: remember and forget", async () => {
    const { call, repo } = setup();
    await call("remember_preference", { text: "Hates lunges" });
    expect(repo.rows.coachNotes).toHaveLength(1);
    const f = await call("forget_preference", { text: "lunges" });
    expect(f.isError).toBeFalsy();
    expect(repo.rows.coachNotes).toHaveLength(0);
  });

  it("users without a plan are told to build one", async () => {
    const repo = memoryRepo({ profile: emptyProfile(), program: null, setLogs: [], workouts: [], checkins: [], habitLogs: [], measurements: [], coachNotes: [] });
    const r = await runTool(tool("get_today_workout"), {}, { repo, source: "mcp", now: NOW });
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/create_program/);
  });

  it("invalid input is rejected without throwing", async () => {
    const { call } = setup();
    const r = await call("log_set", { exercise: "bench", weight_kg: -1, reps: 8 });
    expect(r.isError).toBe(true);
  });

  it("uses the user's timezone for 'today'", async () => {
    // 23:30 UTC Sunday is already Monday in Bratislava.
    const repo = memoryRepo(demoRows(NOW), "Europe/Bratislava");
    const r = await runTool(tool("get_today_workout"), {}, { repo, source: "mcp", now: new Date("2026-11-08T23:30:00Z") });
    expect(r.data.dayName).toBe("Monday");
  });
});

describe("HTTP auth", () => {
  const handle = createHandler({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon", PUBLIC_URL: "https://mcp.example.com" });

  it("serves protected-resource metadata pointing at Supabase auth", async () => {
    const res = await handle(new Request("https://mcp.example.com/.well-known/oauth-protected-resource"));
    const body = await res.json();
    expect(body.resource).toBe("https://mcp.example.com/mcp");
    expect(body.authorization_servers).toEqual(["https://example.supabase.co/auth/v1"]);
  });

  it("rejects /mcp without a token with a discoverable 401", async () => {
    const res = await handle(new Request("https://mcp.example.com/mcp", { method: "POST", body: "{}", headers: { "content-type": "application/json" } }));
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain('resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"');
  });
  it("today card: rich exercises, status and current set; text tells the model not to relist", async () => {
    const { call } = setup();
    const r = await call("get_today_workout");
    expect(r.data).toMatchObject({ view: "today", status: "not_started", checkinNeeded: true, current: { index: 0, set: 1 } });
    const e = (r.data.exercises as { cues: string[]; startReps: number; demoUrl: string; primary: string | null }[])[0];
    expect(e.cues.length).toBeGreaterThanOrEqual(2);
    expect(e.startReps).toBeGreaterThan(0);
    expect(e.demoUrl).toMatch(/^https:/);
    expect(r.text).toMatch(/don't relist/);
  });

  it("delete_set undoes the last set and the card follows", async () => {
    const { call, repo } = setup();
    await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 8 });
    await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 7 });
    const r = await call("delete_set", { exercise: "bench press" });
    expect(r.isError).toBeFalsy();
    expect(repo.rows.setLogs).toHaveLength(1);
    expect(r.data).toMatchObject({ view: "today", setsLogged: 1 });
    expect((await call("delete_set", { exercise: "squat" })).isError).toBe(true);
  });

  it("complete_workout returns the done card with a summary", async () => {
    const { call } = setup();
    await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 8 });
    const r = await call("complete_workout");
    expect(r.data).toMatchObject({ view: "today", status: "done", summary: { sets: 1, volumeKg: 640 } });
  });

  it("check-in returns the adapted today card", async () => {
    const { call } = setup();
    const r = await call("log_checkin", { sleep_hours: 5, energy: 2, soreness: "high" });
    expect(r.data).toMatchObject({ view: "today", checkinNeeded: false });
    expect(r.data.adjustment).toBeTruthy();
  });

  it("get_exercise shows cues, history and swaps", async () => {
    const { call } = setup();
    const r = await call("get_exercise", { exercise: "bench press" });
    expect(r.data).toMatchObject({ view: "exercise", canSwap: true });
    expect(((r.data.exercise as { cues: string[] }).cues).length).toBeGreaterThan(0);
  });

  it("plan_builder offers every option the generator accepts", async () => {
    const { call } = setup();
    const r = await call("plan_builder");
    expect(r.data).toMatchObject({ view: "plan_builder", hasPlan: true, minutes: [45, 60, 75, 90] });
    expect((r.data.equipment as unknown[]).length).toBe(6);
    expect((r.data.current as { days_per_week: number }).days_per_week).toBe(4);
  });

  it("review and progress cards carry their views", async () => {
    const { call } = setup();
    await call("log_set", { exercise: "bench press", weight_kg: 80, reps: 8 });
    const rv = await call("get_weekly_review", { week: "this" });
    expect(rv.data.view).toBe("review");
    const chest = (rv.data.muscles as { label: string; exercises: { name: string; sets: number }[] }[]).find((m) => m.label === "Chest")!;
    expect(chest.exercises[0]).toMatchObject({ sets: 1 });
    const pg = await call("get_progress", { metric: "weight" });
    expect(pg.data).toMatchObject({ view: "progress", metric: "weight" });
    expect(pg.data.format).toBeUndefined();
    const lm = await call("log_measurement", { weight_kg: 80 });
    expect(lm.data).toMatchObject({ view: "progress", saved: "2026-11-09" });
  });

});
