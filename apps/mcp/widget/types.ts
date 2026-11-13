/** Shapes of the tools' structuredContent (see apps/mcp/src/tools.ts). Kept loose on purpose. */

export interface SetDone { set: number; weightKg: number; reps: number; rir: number | null }
export interface Ex {
  id: string; name: string; sets: number; reps: string; rir: number; restSec: number | null; notes: string;
  suggestedKg: number | null; suggestion: string | null; startKg: number | null; startReps: number;
  timed: boolean; bodyweight: boolean; primary: string | null; muscles: string[]; equipment: string[];
  cues: string[]; demoUrl: string; lastTime: { date: string; sets: { weightKg: number; reps: number }[] } | null;
  setsDone: SetDone[];
}
export interface WeekDot { label: string; weekday: number; status: "done" | "today" | "rest" | "upcoming" | "missed" }
export interface TodayData {
  view: "today";
  date: string; weekday: number; dayName: string; isToday: boolean; week: number; totalWeeks: number; block: string;
  training: boolean; deload: boolean; label: string; title: string; workingSets: number; estMinutes: number;
  adjustment: string | null; checkin: { sleepHours: number; energy: number; soreness: string } | null; checkinNeeded: boolean;
  status: "not_started" | "in_progress" | "done"; setsLogged: number; totalSets: number;
  current: { index: number; set: number } | null;
  summary: { sets: number; volumeKg: number; bests: { name: string; weightKg: number; reps: number }[] } | null;
  weekDots: WeekDot[]; sessionsThisWeek: { done: number; planned: number }; exercises: Ex[];
  justLogged?: { exerciseId: string; exercise: string; set: number; weightKg: number; reps: number };
  applied?: { before: string; after: string; dayLabel: string; version: number };
  saved?: { version: number };
}
export interface Alt { id: string; name: string; equipment: string[] }
export interface ExerciseData {
  view: "exercise"; weekday: number; dayName: string; exercise: Ex;
  history: { date: string; sets: { weightKg: number; reps: number }[] }[]; alternatives: Alt[]; canSwap: boolean;
}
export interface ChangeData {
  view: "change"; stage: "pick" | "preview";
  exercise?: string; exerciseId?: string; weekday: number; dayLabel: string; reason?: string | null; alternatives?: Alt[];
  before?: string; after?: string; fromVersion?: number; toVersion?: number; confirmArgs?: Record<string, unknown>;
}
export interface ReviewData {
  view: "review"; overallWeek: number; from: string; to: string; finished: boolean;
  review: { sessionsDone: number; sessionsPlanned: number; setsDone: number; setsPlanned: number };
  muscles: { group: string; label: string; done: number; planned: number; exercises: { name: string; sets: number }[] }[];
  newBests: { name: string; weightKg: number; reps: number }[];
}
export interface ProgressData {
  view: "progress"; metric: string; label: string; metrics: { id: string; label: string }[];
  points: { week: number; value: number; label: string }[];
  latest: number | null; latestLabel: string | null; target: number | null; targetLabel: string | null;
  goalWeek: number; pace: { status: string; projectedWeek: number | null }; reached: boolean; wantsDown: boolean;
  needsHeight: boolean;
  lastMeasurement: { date: string; weightKg: number; bodyFatPct: number | null; armsCm: number | null; waistCm: number | null } | null;
  saved?: string;
}
export interface Opt<T = string> { id: T; label: string; detail?: string }
export interface BuilderData {
  view: "plan_builder"; hasPlan: boolean;
  goals: Opt[]; experience: Opt[]; days: Opt<number>[]; minutes: number[]; equipment: Opt[]; focus: string[];
  current: Record<string, unknown> | null;
}
export interface PlanPreviewData {
  view: "plan_preview"; summary: string; replaces: boolean; weeks: number;
  days: { weekday: number; day: string; label: string; exercises: { name: string; sets: number }[] }[];
  volume: { group: string; label: string; sets: number }[]; notes: string[]; confirmArgs: Record<string, unknown>;
}
export type ViewData = TodayData | ExerciseData | ChangeData | ReviewData | ProgressData | BuilderData | PlanPreviewData;
