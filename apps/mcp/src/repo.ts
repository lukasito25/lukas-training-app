/**
 * Data access for one signed-in user. The Supabase implementation runs every query with the
 * user's own access token, so Postgres RLS (owner-only) applies — no service-role key here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  CheckinRow, CoachNoteRow, HabitLogRow, MeasurementRow, ProfileRow, Program, ProgramRow, SetLogRow, UserRows, WorkoutRow,
} from "../../../packages/core/src/index";

export interface Repo {
  load(): Promise<{ rows: UserRows; timezone: string }>;
  upsertSetLog(row: SetLogRow): Promise<void>;
  deleteSetLog(clientKey: string): Promise<void>;
  upsertWorkout(row: WorkoutRow): Promise<void>;
  upsertCheckin(row: CheckinRow): Promise<void>;
  upsertMeasurement(row: MeasurementRow): Promise<void>;
  setHabit(row: HabitLogRow, done: boolean): Promise<void>;
  addNote(text: string): Promise<void>;
  deleteNote(text: string): Promise<void>;
  saveProgram(program: Program, reason: string): Promise<void>;
  updateProfile(patch: Partial<Omit<ProfileRow, "user_id">>): Promise<void>;
}

const check = <T extends { error: { message: string } | null }>(r: T): T => {
  if (r.error) throw new Error(r.error.message);
  return r;
};

export function supabaseRepo(url: string, anonKey: string, accessToken: string, userId: string): Repo {
  const sb: SupabaseClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user_id = userId;
  return {
    async load() {
      const all = await Promise.all([
        sb.from("profiles").select("*").eq("user_id", userId),
        sb.from("programs").select("*").eq("user_id", userId).eq("is_active", true),
        sb.from("set_logs").select("*").eq("user_id", userId).order("completed_at").limit(20000),
        sb.from("workouts").select("*").eq("user_id", userId),
        sb.from("checkins").select("*").eq("user_id", userId),
        sb.from("habit_logs").select("*").eq("user_id", userId),
        sb.from("measurements").select("*").eq("user_id", userId),
        sb.from("coach_notes").select("*").eq("user_id", userId).order("created_at"),
      ]);
      all.forEach(check);
      const [p, prog, sets, workouts, checkins, habits, measurements, notes] = all.map((r) => r.data ?? []);
      const profile = (p[0] as ProfileRow | undefined) ?? null;
      return {
        timezone: profile?.timezone ?? "UTC",
        rows: {
          profile,
          program: (prog[0] as ProgramRow | undefined) ?? null,
          setLogs: sets as SetLogRow[],
          workouts: workouts as WorkoutRow[],
          checkins: checkins as CheckinRow[],
          habitLogs: habits as HabitLogRow[],
          measurements: measurements as MeasurementRow[],
          coachNotes: notes as CoachNoteRow[],
        },
      };
    },
    async upsertSetLog(row) { check(await sb.from("set_logs").upsert({ user_id, ...row }, { onConflict: "user_id,client_key" })); },
    async deleteSetLog(key) { check(await sb.from("set_logs").delete().eq("user_id", userId).eq("client_key", key)); },
    async upsertWorkout(row) { check(await sb.from("workouts").upsert({ user_id, ...row })); },
    async upsertCheckin(row) { check(await sb.from("checkins").upsert({ user_id, ...row })); },
    async upsertMeasurement(row) { check(await sb.from("measurements").upsert({ user_id, ...row })); },
    async setHabit(row, done) {
      if (done) check(await sb.from("habit_logs").upsert({ user_id, ...row }, { ignoreDuplicates: true }));
      else check(await sb.from("habit_logs").delete().eq("user_id", userId).eq("date", row.date).eq("habit_id", row.habit_id));
    },
    async addNote(text) { check(await sb.from("coach_notes").upsert({ user_id, text, source: "chat" }, { onConflict: "user_id,text", ignoreDuplicates: true })); },
    async deleteNote(text) { check(await sb.from("coach_notes").delete().eq("user_id", userId).eq("text", text)); },
    async saveProgram(program, reason) { check(await sb.rpc("save_program", { p_data: program, p_version: program.version, p_reason: reason })); },
    async updateProfile(patch) { check(await sb.from("profiles").upsert({ user_id, ...patch })); },
  };
}

/** In-memory repo for tests and local demos. */
export function memoryRepo(rows: UserRows, timezone = "UTC"): Repo & { rows: UserRows } {
  const r = structuredClone(rows);
  return {
    rows: r,
    async load() { return { rows: structuredClone(r), timezone }; },
    async upsertSetLog(row) { r.setLogs = [...r.setLogs.filter((x) => x.client_key !== row.client_key), row]; },
    async deleteSetLog(key) { r.setLogs = r.setLogs.filter((x) => x.client_key !== key); },
    async upsertWorkout(row) { r.workouts = [...r.workouts.filter((x) => !(x.date === row.date && x.weekday === row.weekday)), row]; },
    async upsertCheckin(row) { r.checkins = [...r.checkins.filter((x) => x.date !== row.date), row]; },
    async upsertMeasurement(row) { r.measurements = [...r.measurements.filter((x) => x.date !== row.date), row]; },
    async setHabit(row, done) {
      r.habitLogs = r.habitLogs.filter((x) => !(x.date === row.date && x.habit_id === row.habit_id));
      if (done) r.habitLogs.push(row);
    },
    async addNote(text) { if (!r.coachNotes.some((n) => n.text === text)) r.coachNotes.push({ text, source: "chat", id: `n${r.coachNotes.length}` }); },
    async deleteNote(text) { r.coachNotes = r.coachNotes.filter((n) => n.text !== text); },
    async saveProgram(program, reason) { r.program = { version: program.version, data: program, reason, is_active: true }; },
    async updateProfile(patch) { r.profile = { ...(r.profile ?? emptyProfile()), ...patch } as ProfileRow; },
  };
}

export const emptyProfile = (): ProfileRow => ({
  user_id: "test", name: "", height_cm: null, goal_metric: "none", goal_value: null, program_source: null,
  program_start: "2026-11-09", units: "metric", timezone: "UTC", habits: [], health_consent_at: null,
});
