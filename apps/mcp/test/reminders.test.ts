import { describe, expect, it } from "vitest";
import { planFor, userDataFromRows, type ProfileRow, type ProgramRow } from "../../../packages/core/src/index";
import { dueReminders, type SubRow } from "../src/reminders";
import { demoRows } from "../src/demo";
import { createHandler } from "../src/http";

// Monday 9 Nov 2026. Bratislava is UTC+1 in November.
const MONDAY_1805_LOCAL = new Date("2026-11-09T17:05:00Z");
const rows = demoRows(new Date("2026-11-09T12:00:00Z"));
const profile: ProfileRow = { ...rows.profile!, user_id: "u1", timezone: "Europe/Bratislava" };
const program: ProgramRow = { ...rows.program!, user_id: "u1" } as ProgramRow;
const sub = (over: Partial<SubRow> = {}): SubRow => ({
  id: "s1", user_id: "u1", endpoint: "https://push.example/1", p256dh: "k", auth: "a", remind_at: "18:00:00", last_sent_on: null, ...over,
});

describe("workout reminders", () => {
  it("demo plan trains on Monday", () => {
    expect(planFor(userDataFromRows(rows))!.trainingWeekdays).toContain(0);
  });

  it("sends at the chosen local time on a training day", () => {
    const due = dueReminders([sub()], [profile], [program], [], MONDAY_1805_LOCAL);
    expect(due).toHaveLength(1);
    expect(due[0].date).toBe("2026-11-09");
    expect(due[0].body).toMatch(/exercises, about \d+ min/);
  });

  it("waits until the chosen time, and gives up 2 hours after it", () => {
    expect(dueReminders([sub({ remind_at: "19:00" })], [profile], [program], [], MONDAY_1805_LOCAL)).toHaveLength(0);
    expect(dueReminders([sub({ remind_at: "15:30" })], [profile], [program], [], MONDAY_1805_LOCAL)).toHaveLength(0);
  });

  it("sends once per day", () => {
    expect(dueReminders([sub({ last_sent_on: "2026-11-09" })], [profile], [program], [], MONDAY_1805_LOCAL)).toHaveLength(0);
  });

  it("skips if today's workout is already logged", () => {
    const done = [{ user_id: "u1", date: "2026-11-09", weekday: 0, sets: 20 }];
    expect(dueReminders([sub()], [profile], [program], done, MONDAY_1805_LOCAL)).toHaveLength(0);
  });

  it("skips rest days", () => {
    const plan = planFor(userDataFromRows(rows))!;
    const rest = [0, 1, 2, 3, 4, 5, 6].find((d) => !plan.trainingWeekdays.includes(d))!;
    const at = new Date(MONDAY_1805_LOCAL.getTime() + rest * 86_400_000);
    expect(dueReminders([sub()], [profile], [program], [], at)).toHaveLength(0);
  });

  it("skips users without a plan", () => {
    expect(dueReminders([sub()], [{ ...profile, program_source: null } as ProfileRow], [], [], MONDAY_1805_LOCAL)).toHaveLength(0);
  });

  it("the cron route rejects requests without the secret", async () => {
    const handle = createHandler({ SUPABASE_URL: "http://localhost:54321", SUPABASE_ANON_KEY: "x", PUBLIC_URL: "http://localhost:8787", CRON_SECRET: "s3cret" });
    const res = await handle(new Request("http://localhost:8787/cron/reminders", { method: "POST", headers: { Authorization: "Bearer nope" } }));
    expect(res.status).toBe(401);
    const unset = createHandler({ SUPABASE_URL: "http://localhost:54321", SUPABASE_ANON_KEY: "x", PUBLIC_URL: "http://localhost:8787" });
    expect((await unset(new Request("http://localhost:8787/cron/reminders", { method: "POST", headers: { Authorization: "Bearer " } }))).status).toBe(401);
  });
});
