/**
 * Pure sync helpers: turn a local state change into cloud write operations, and merge a device's
 * offline data with the server copy on first sign-in. No network here (see cloud.ts).
 */
import {
  checkinToRow, measurementToRow, profileToRow, setLogKey, setLogToRow, localDate,
  type CheckinRow, type HabitLogRow, type MeasurementRow, type Program, type SetLog, type SetLogRow,
  type UserData, type WorkoutRow,
} from "@fitness/core";

export type Op =
  | { t: "profile"; row: ReturnType<typeof profileToRow> }
  | { t: "program"; data: Program; version: number; reason: string }
  | { t: "set_upsert"; row: SetLogRow }
  | { t: "set_delete"; key: string }
  | { t: "workout_upsert"; row: WorkoutRow }
  | { t: "checkin_upsert"; row: CheckinRow }
  | { t: "habit_insert"; row: HabitLogRow }
  | { t: "habit_delete"; row: HabitLogRow }
  | { t: "measure_upsert"; row: MeasurementRow }
  | { t: "measure_delete"; date: string }
  | { t: "note_insert"; id: string; text: string; source: UserData["coachNotes"][number]["source"] }
  | { t: "note_delete"; text: string };

const keyOf = (l: SetLog) => setLogKey(l, localDate(new Date(l.completedAt)));
const PROFILE_FIELDS = ["name", "heightCm", "goalMetric", "goalValue", "programSource", "programStart", "habits"] as const;

export function diffState(prev: UserData, next: UserData): Op[] {
  const ops: Op[] = [];

  if (PROFILE_FIELDS.some((f) => prev[f] !== next[f])) ops.push({ t: "profile", row: profileToRow(next) });

  if (next.program && next.program !== prev.program) {
    const last = next.program.history[next.program.history.length - 1];
    ops.push({ t: "program", data: next.program, version: next.program.version, reason: last?.reason ?? "" });
  }

  if (prev.setLogs !== next.setLogs) {
    const before = new Map(prev.setLogs.map((l) => [keyOf(l), l]));
    const after = new Map(next.setLogs.map((l) => [keyOf(l), l]));
    for (const [k, l] of after) if (before.get(k) !== l) ops.push({ t: "set_upsert", row: setLogToRow(l) });
    for (const k of before.keys()) if (!after.has(k)) ops.push({ t: "set_delete", key: k });
  }

  if (prev.completed !== next.completed) {
    const before = new Map(prev.completed.map((c) => [`${c.date}|${c.weekday}`, c]));
    for (const c of next.completed) {
      const b = before.get(`${c.date}|${c.weekday}`);
      if (!b || b.sets !== c.sets) ops.push({ t: "workout_upsert", row: { date: c.date, weekday: c.weekday, sets: c.sets } });
    }
  }

  if (prev.checkins !== next.checkins) {
    for (const [d, c] of Object.entries(next.checkins)) if (prev.checkins[d] !== c) ops.push({ t: "checkin_upsert", row: checkinToRow(c) });
  }

  if (prev.habitDone !== next.habitDone) {
    const dates = new Set([...Object.keys(prev.habitDone), ...Object.keys(next.habitDone)]);
    for (const date of dates) {
      const a = new Set(prev.habitDone[date] ?? []);
      const b = new Set(next.habitDone[date] ?? []);
      for (const h of b) if (!a.has(h)) ops.push({ t: "habit_insert", row: { date, habit_id: h } });
      for (const h of a) if (!b.has(h)) ops.push({ t: "habit_delete", row: { date, habit_id: h } });
    }
  }

  if (prev.measurements !== next.measurements) {
    const before = new Map(prev.measurements.map((m) => [m.date, m]));
    const after = new Set(next.measurements.map((m) => m.date));
    for (const m of next.measurements) if (before.get(m.date) !== m) ops.push({ t: "measure_upsert", row: measurementToRow(m) });
    for (const d of before.keys()) if (!after.has(d)) ops.push({ t: "measure_delete", date: d });
  }

  if (prev.coachNotes !== next.coachNotes) {
    const before = new Set(prev.coachNotes.map((n) => n.text));
    const after = new Set(next.coachNotes.map((n) => n.text));
    for (const n of next.coachNotes) if (!before.has(n.text)) ops.push({ t: "note_insert", id: n.id, text: n.text, source: n.source });
    for (const t of before) if (!after.has(t)) ops.push({ t: "note_delete", text: t });
  }

  return ops;
}

/**
 * First sign-in on a device that already has data: keep everything from both sides.
 * Logs are unioned; for settings and the program, the server copy wins when it has one.
 */
export function mergeData(local: UserData, server: UserData): UserData {
  const serverHasPlan = server.programSource != null;
  const sets = new Map(local.setLogs.map((l) => [keyOf(l), l]));
  for (const l of server.setLogs) sets.set(keyOf(l), l);
  const completed = new Map(local.completed.map((c) => [`${c.date}|${c.weekday}`, c]));
  for (const c of server.completed) completed.set(`${c.date}|${c.weekday}`, c);
  const measurements = new Map(local.measurements.map((m) => [m.date, m]));
  for (const m of server.measurements) measurements.set(m.date, m);
  const habitDone: Record<string, string[]> = { ...local.habitDone };
  for (const [d, ids] of Object.entries(server.habitDone)) habitDone[d] = [...new Set([...(habitDone[d] ?? []), ...ids])];
  const notes = new Map(local.coachNotes.map((n) => [n.text, n]));
  for (const n of server.coachNotes) notes.set(n.text, n);

  return {
    name: server.name || local.name,
    heightCm: server.heightCm ?? local.heightCm,
    goalMetric: server.goalMetric !== "none" ? server.goalMetric : local.goalMetric,
    goalValue: server.goalMetric !== "none" ? server.goalValue : local.goalValue,
    programSource: serverHasPlan ? server.programSource : local.programSource,
    program: serverHasPlan ? server.program : local.program,
    programStart: serverHasPlan ? server.programStart : local.programStart,
    habits: server.habits.length ? server.habits : local.habits,
    checkins: { ...local.checkins, ...server.checkins },
    setLogs: [...sets.values()].sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1)),
    completed: [...completed.values()],
    measurements: [...measurements.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
    habitDone,
    coachNotes: [...notes.values()],
  };
}

/** Later profile/program writes supersede earlier queued ones; everything else keeps order. */
export function compact(ops: Op[]): Op[] {
  const lastProfile = ops.map((o) => o.t).lastIndexOf("profile");
  const lastProgram = ops.map((o) => o.t).lastIndexOf("program");
  return ops.filter((o, i) => (o.t !== "profile" || i === lastProfile) && (o.t !== "program" || i === lastProgram));
}
