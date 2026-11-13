/** Demo user for local development (DEV_NO_AUTH=1) and tests: a generated 4-day muscle program. */
import { generateProgram, localDate, mondayOf, planFor, userDataFromRows, type UserRows } from "../../../packages/core/src/index";
import { emptyProfile } from "./repo";

export function demoRows(now = new Date()): UserRows {
  const program = generateProgram(
    { goal: "muscle", experience: "intermediate", focus: ["Arms"], daysPerWeek: 4, sessionMinutes: 60, equipment: ["barbell", "dumbbell", "cable", "machine", "pullup_bar"], limitations: "" },
    { now, id: "demo" },
  );
  return {
    profile: {
      ...emptyProfile(), name: "Demo", height_cm: 180, goal_metric: "ffmi", goal_value: 20, program_source: "generated",
      program_start: localDate(mondayOf(now)),
      habits: [{ id: "water", name: "Water 3.5 L", detail: "", group: "WATER" }, { id: "creatine", name: "Creatine 5 g", detail: "", group: "SUPPS" }],
    },
    program: { version: 1, data: program, reason: "", is_active: true },
    setLogs: [], workouts: [], checkins: [], habitLogs: [], measurements: [], coachNotes: [],
  };
}

/** Demo user with history (last week's sessions, a few weigh-ins) for the local card harness. */
export function richDemoRows(now = new Date()): UserRows {
  const rows = demoRows(now);
  const lastMonday = mondayOf(now);
  lastMonday.setDate(lastMonday.getDate() - 7);
  rows.profile!.program_start = localDate(lastMonday);
  const plan = planFor(userDataFromRows(rows))!;
  for (const wd of plan.trainingWeekdays) {
    const day = new Date(lastMonday);
    day.setDate(lastMonday.getDate() + wd);
    day.setHours(18, 0, 0, 0);
    const date = localDate(day);
    let n = 0;
    for (const e of plan.session(0, wd).exercises) {
      const kg = e.repRange ? (e.muscles.some((m) => /quad|glute|ham/.test(m)) ? 60 : 30) : 24;
      for (let i = 0; i < e.sets; i++, n++) {
        rows.setLogs.push({
          client_key: `${e.id}:${i}:${date}`, exercise_id: e.id, set_index: i, weight_kg: kg, reps: e.repRange ? e.repRange[1] : 1, rir: 2,
          completed_at: new Date(day.getTime() + n * 120_000).toISOString(), source: "app",
        });
      }
    }
    rows.workouts.push({ date, weekday: wd, sets: n, source: "app" });
  }
  for (let w = 0; w < 4; w++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (3 - w) * 7);
    rows.measurements.push({ date: localDate(d), weight_kg: 82 - w * 0.3, body_fat_pct: 16 - w * 0.2, arms_cm: 37 + w * 0.2, chest_cm: null, waist_cm: null });
  }
  return rows;
}
