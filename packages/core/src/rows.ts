/**
 * Mapping between Postgres rows (supabase/migrations/*_liftwise_schema.sql) and domain objects.
 * Shared by the web sync layer and the MCP server; pure, no Supabase dependency.
 */
import type { Habit, CoachNote, CompletedSession, GoalMetric, UserData } from "./coach";
import { localDate, mondayOf, setLogKey, logDate } from "./coach";
import type { Program } from "./generate";
import type { Measurement } from "./review";
import type { Checkin, SetLog, Soreness } from "./types";

export type Source = "app" | "chatgpt" | "claude" | "mcp";

export interface ProfileRow {
  user_id: string;
  name: string;
  height_cm: number | null;
  goal_metric: GoalMetric;
  goal_value: number | null;
  program_source: "classic" | "generated" | null;
  program_start: string;
  units: "metric" | "imperial";
  timezone: string;
  habits: Habit[];
  health_consent_at: string | null;
  updated_at?: string;
}
export interface ProgramRow { id?: string; user_id?: string; version: number; data: Program; reason: string; is_active: boolean; created_at?: string }
export interface SetLogRow {
  user_id?: string; client_key: string; exercise_id: string; set_index: number; weight_kg: number; reps: number;
  rir: number | null; completed_at: string; source?: Source;
}
export interface WorkoutRow { user_id?: string; date: string; weekday: number; sets: number; source?: Source }
export interface CheckinRow { user_id?: string; date: string; sleep_hours: number; energy: number; soreness: Soreness }
export interface HabitLogRow { user_id?: string; date: string; habit_id: string }
export interface MeasurementRow {
  user_id?: string; date: string; weight_kg: number; body_fat_pct: number | null; arms_cm: number | null; chest_cm: number | null; waist_cm: number | null;
}
export interface CoachNoteRow { id?: string; user_id?: string; text: string; source: CoachNote["source"]; created_at?: string }

const num = (v: unknown): number => (typeof v === "string" ? Number(v) : (v as number));
const numOrNull = (v: unknown): number | null => (v == null ? null : num(v));

export const setLogToRow = (l: SetLog, source: Source = "app", timeZone?: string): SetLogRow => ({
  client_key: setLogKey(l, logDate(l, timeZone)),
  exercise_id: l.exerciseId, set_index: l.setIndex, weight_kg: l.weightKg, reps: l.reps, rir: l.rir, completed_at: l.completedAt, source,
});
export const setLogFromRow = (r: SetLogRow): SetLog => ({
  exerciseId: r.exercise_id, setIndex: r.set_index, weightKg: num(r.weight_kg), reps: r.reps, rir: r.rir, completedAt: new Date(r.completed_at).toISOString(),
});

export const checkinToRow = (c: Checkin): CheckinRow => ({ date: c.date, sleep_hours: c.sleepHours, energy: c.energy, soreness: c.soreness });
export const checkinFromRow = (r: CheckinRow): Checkin => ({ date: r.date, sleepHours: num(r.sleep_hours), energy: r.energy, soreness: r.soreness });

export const measurementToRow = (m: Measurement): MeasurementRow => ({
  date: m.date, weight_kg: m.weightKg, body_fat_pct: m.bodyFatPct, arms_cm: m.armsCm, chest_cm: m.chestCm, waist_cm: m.waistCm,
});
export const measurementFromRow = (r: MeasurementRow): Measurement => ({
  date: r.date, weightKg: num(r.weight_kg), bodyFatPct: numOrNull(r.body_fat_pct), armsCm: numOrNull(r.arms_cm), chestCm: numOrNull(r.chest_cm), waistCm: numOrNull(r.waist_cm),
});

export const workoutFromRow = (r: WorkoutRow): CompletedSession => ({ date: r.date, weekday: r.weekday, sets: r.sets });
export const noteFromRow = (r: CoachNoteRow): CoachNote => ({ id: r.id ?? r.text, text: r.text, source: r.source, createdAt: r.created_at ?? new Date().toISOString() });

export type ProfileFields = Pick<UserData, "name" | "heightCm" | "goalMetric" | "goalValue" | "programSource" | "programStart" | "habits">;

export const profileToRow = (p: ProfileFields): Omit<ProfileRow, "user_id" | "units" | "timezone" | "health_consent_at"> => ({
  name: p.name, height_cm: p.heightCm, goal_metric: p.goalMetric, goal_value: p.goalValue,
  program_source: p.programSource, program_start: p.programStart, habits: p.habits,
});

export interface UserRows {
  profile: ProfileRow | null;
  program: ProgramRow | null;
  setLogs: SetLogRow[];
  workouts: WorkoutRow[];
  checkins: CheckinRow[];
  habitLogs: HabitLogRow[];
  measurements: MeasurementRow[];
  coachNotes: CoachNoteRow[];
}

/** Builds the coach's view of a user from their rows. `defaultHabits` fills an empty habit list. */
export function userDataFromRows(rows: UserRows, defaultHabits: Habit[] = []): UserData {
  const p = rows.profile;
  const habitDone: Record<string, string[]> = {};
  for (const h of rows.habitLogs) (habitDone[h.date] ??= []).push(h.habit_id);
  const program = rows.program?.data ?? null;
  const source = p?.program_source ?? null;
  return {
    name: p?.name ?? "",
    heightCm: numOrNull(p?.height_cm),
    goalMetric: p?.goal_metric ?? "none",
    goalValue: numOrNull(p?.goal_value),
    programSource: source === "generated" && !program ? null : source,
    program,
    programStart: p?.program_start ?? localDate(mondayOf()),
    checkins: Object.fromEntries(rows.checkins.map((c) => [c.date, checkinFromRow(c)])),
    setLogs: rows.setLogs.map(setLogFromRow).sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1)),
    habits: p?.habits?.length ? p.habits : defaultHabits,
    habitDone,
    completed: rows.workouts.map(workoutFromRow),
    measurements: rows.measurements.map(measurementFromRow).sort((a, b) => (a.date < b.date ? -1 : 1)),
    coachNotes: rows.coachNotes.map(noteFromRow),
  };
}
