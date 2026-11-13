/** Demo user for local development (DEV_NO_AUTH=1) and tests: a generated 4-day muscle program. */
import { generateProgram, localDate, mondayOf, type UserRows } from "../../../packages/core/src/index";
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
