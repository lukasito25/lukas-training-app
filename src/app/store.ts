/**
 * Local-first app state for LiftWise.
 *
 * A small repository behind hooks: today it persists to localStorage; with accounts the
 * same actions write to Supabase (per-user, RLS) and this store becomes the offline queue.
 * Screens must only use the hooks/actions exported here.
 */
import { useSyncExternalStore } from "react";
import {
  CheckinSchema, MeasurementSchema, ProgramInputsSchema, SetLogSchema,
  type Checkin, type CoachNote, type Habit, type HabitGroup, type Measurement, type Program, type SetLog, type UserData,
} from "@fitness/core";

export type { CoachNote, CompletedSession, GoalMetric, Habit, HabitGroup } from "@fitness/core";

export interface ActiveSession {
  date: string;
  /** Plan weekday (Mon = 0) whose session is being trained. */
  weekday: number;
  startedAt: string;
  exerciseIndex: number;
  weights: Record<string, number>;
  restUntil: number | null;
}

/** Everything the coach knows (UserData, shared with the server) plus device-only UI state. */
export interface AppState extends UserData {
  version: 2;
  /** The session being trained on this device right now. Not synced. */
  active: ActiveSession | null;
}

// ---------- dates (local time; the user's day, not UTC's) ----------

export { localDate, mondayOf, parseLocal } from "@fitness/core";
import { localDate, mondayOf, startForWeek } from "@fitness/core";

// ---------- defaults ----------

export const DEFAULT_HABITS: Habit[] = [
  { id: "breakfast", name: "Break-fast · 40 g protein", detail: "12:00", group: "FOOD" },
  { id: "pre-workout", name: "Pre-workout · 40 g protein", detail: "15:00–16:00 · include carbs", group: "FOOD" },
  { id: "post-workout", name: "Post-workout · 40–50 g", detail: "19:30–20:00 · high carbs", group: "FOOD" },
  { id: "pre-sleep", name: "Pre-sleep · casein 40 g", detail: "before bed", group: "FOOD" },
  { id: "water", name: "Water 3.5 L", detail: "through the day", group: "WATER" },
  { id: "mag-zinc", name: "Magnesium + Zinc", detail: "evening", group: "SUPPS" },
  { id: "creatine", name: "Creatine 5 g", detail: "any time", group: "SUPPS" },
];

const initialState = (): AppState => ({
  version: 2,
  name: "",
  heightCm: null,
  goalMetric: "none",
  goalValue: null,
  programSource: null,
  program: null,
  programStart: localDate(mondayOf()),
  checkins: {},
  setLogs: [],
  habits: DEFAULT_HABITS,
  habitDone: {},
  active: null,
  completed: [],
  measurements: [],
  coachNotes: [],
});

// ---------- persistence (storage can be missing or throw: private mode, previews) ----------

const KEY = "liftwise.v2";
const LEGACY_KEY = "companion.v1";

function sanitize(parsed: Partial<AppState>): AppState {
  const base = initialState();
  const program = parsed.program && ProgramInputsSchema.safeParse(parsed.program.inputs).success ? parsed.program : null;
  return {
    ...base,
    ...parsed,
    version: 2,
    program,
    programSource: parsed.programSource === "generated" && !program ? null : parsed.programSource ?? null,
    // Drop anything that no longer validates instead of crashing the UI.
    setLogs: (parsed.setLogs ?? []).filter((l) => SetLogSchema.safeParse(l).success),
    measurements: (parsed.measurements ?? []).filter((m) => MeasurementSchema.safeParse(m).success),
    checkins: Object.fromEntries(Object.entries(parsed.checkins ?? {}).filter(([, c]) => CheckinSchema.safeParse(c).success)),
    completed: (parsed.completed ?? []).filter((c) => typeof c.weekday === "number"),
    active: parsed.active && typeof parsed.active.weekday === "number" ? parsed.active : null,
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw));
    // One-time upgrade from the first redesign build: keep logs/habits/check-ins, use the classic plan.
    const old = localStorage.getItem(LEGACY_KEY);
    if (old) {
      const v1 = JSON.parse(old);
      return sanitize({ ...v1, programSource: "classic", completed: [], active: null });
    }
  } catch {
    /* fall through */
  }
  return initialState();
}

let state: AppState = load();
const listeners = new Set<() => void>();

/** Local edits (not server refreshes) — the sync layer turns these into cloud writes. */
type ChangeListener = (prev: AppState, next: AppState) => void;
const changeListeners = new Set<ChangeListener>();
export const onLocalChange = (l: ChangeListener) => {
  changeListeners.add(l);
  return () => changeListeners.delete(l);
};

function set(next: AppState, opts: { fromServer?: boolean } = {}) {
  const prev = state;
  state = next;
  if (!opts.fromServer) changeListeners.forEach((l) => l(prev, next));
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* keep working in memory */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const getState = () => state;

/** Replaces the synced part of the state with the server's copy (keeps device-only `active`). */
export function applyServerState(data: UserData) {
  const next = sanitize({ ...data, active: state.active });
  // A session in progress keeps going even if the server copy predates it.
  set(next, { fromServer: true });
}

/** Clears this device's copy without touching the cloud (sign out, account deleted). */
export function resetLocal() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  set(initialState(), { fromServer: true });
}

export const emptyUserData = (): UserData => {
  const { version: _v, active: _a, ...data } = initialState();
  return { ...data, habits: [] };
};

const uid = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------- actions ----------

export const actions = {
  setProfile(patch: Partial<Pick<AppState, "name" | "heightCm" | "goalMetric" | "goalValue">>) {
    const next = { ...state, ...patch };
    if (patch.name !== undefined) next.name = patch.name.slice(0, 40);
    set(next);
  },

  /** Saves a newly generated (or regenerated) program. Keeps the start date when only adjusting. */
  saveProgram(program: Program, opts: { restart: boolean }) {
    set({
      ...state,
      program,
      programSource: "generated",
      programStart: opts.restart ? localDate(mondayOf()) : state.programStart,
      // Adjusting (e.g. an exercise swap mid-session) keeps the session going.
      active: opts.restart ? null : state.active,
    });
  },

  useClassicProgram() {
    set({ ...state, program: null, programSource: "classic", programStart: localDate(mondayOf()), active: null });
  },

  /** Jump to a week by moving the program start date. */
  setWeekIndex(weekIndex: number) {
    set({ ...state, programStart: startForWeek(weekIndex) });
  },

  saveCheckin(c: Checkin) {
    const parsed = CheckinSchema.parse(c);
    set({ ...state, checkins: { ...state.checkins, [parsed.date]: parsed } });
  },

  toggleHabit(date: string, habitId: string) {
    const cur = state.habitDone[date] ?? [];
    const next = cur.includes(habitId) ? cur.filter((h) => h !== habitId) : [...cur, habitId];
    set({ ...state, habitDone: { ...state.habitDone, [date]: next } });
  },

  addHabit(name: string, group: HabitGroup = "OTHER", detail = "") {
    const clean = name.trim().slice(0, 60);
    if (!clean) return;
    set({ ...state, habits: [...state.habits, { id: uid("habit"), name: clean, detail: detail.trim().slice(0, 60), group }] });
  },

  removeHabit(id: string) {
    set({ ...state, habits: state.habits.filter((h) => h.id !== id) });
  },

  startSession(weekday: number) {
    if (state.active && state.active.date === localDate() && state.active.weekday === weekday) return;
    set({
      ...state,
      active: { date: localDate(), weekday, startedAt: new Date().toISOString(), exerciseIndex: 0, weights: {}, restUntil: null },
    });
  },

  patchActive(patch: Partial<ActiveSession>) {
    if (!state.active) return;
    set({ ...state, active: { ...state.active, ...patch } });
  },

  /** Marks a set done (adds a log) or undone (removes today's log for that set). */
  toggleSet(log: Omit<SetLog, "completedAt">, restSec: number | null) {
    const today = localDate();
    const isSame = (l: SetLog) =>
      l.exerciseId === log.exerciseId && l.setIndex === log.setIndex && localDate(new Date(l.completedAt)) === today;
    if (state.setLogs.some(isSame)) {
      set({ ...state, setLogs: state.setLogs.filter((l) => !isSame(l)) });
      return;
    }
    const entry = SetLogSchema.parse({ ...log, completedAt: new Date().toISOString() });
    set({
      ...state,
      setLogs: [...state.setLogs, entry],
      active: state.active ? { ...state.active, restUntil: restSec ? Date.now() + restSec * 1000 : null } : null,
    });
  },

  finishSession(sets: number) {
    if (!state.active) return;
    const { date, weekday } = state.active;
    const completed = [...state.completed.filter((c) => !(c.date === date && c.weekday === weekday)), { date, weekday, sets }];
    set({ ...state, active: null, completed });
  },

  saveMeasurement(m: Measurement) {
    const parsed = MeasurementSchema.parse(m);
    const measurements = [...state.measurements.filter((x) => x.date !== parsed.date), parsed].sort((a, b) => (a.date < b.date ? -1 : 1));
    set({ ...state, measurements });
  },

  removeMeasurement(date: string) {
    set({ ...state, measurements: state.measurements.filter((m) => m.date !== date) });
  },

  addCoachNote(text: string, source: CoachNote["source"] = "you") {
    const clean = text.trim().slice(0, 200);
    if (!clean || state.coachNotes.some((n) => n.text === clean)) return;
    set({ ...state, coachNotes: [...state.coachNotes, { id: uid("note"), text: clean, source, createdAt: new Date().toISOString() }] });
  },

  removeCoachNote(id: string) {
    set({ ...state, coachNotes: state.coachNotes.filter((n) => n.id !== id) });
  },

  exportJson(): string {
    return JSON.stringify({ exportedAt: new Date().toISOString(), app: "LiftWise", data: state }, null, 2);
  },

  /** Device-only wipe; with an account, cloud.deleteAccount() deletes the server copy first. */
  deleteEverything() {
    resetLocal();
  },
};
