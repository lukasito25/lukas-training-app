/**
 * Web hooks over the shared coaching views in @fitness/core (plan, today, suggestions).
 * The same functions back the MCP tools, so ChatGPT/Claude and the app agree on "what's today".
 */
import { useMemo } from "react";
import {
  buildToday, exerciseHistory as coreHistory, localDate, planFor, suggestionFor as coreSuggestion,
  type LoggedSet, type PrescribedExercise, type Suggestion, type TodayView,
} from "@fitness/core";
import { useAppState, type AppState } from "./store";

export {
  buildToday, dayOfWeekIndex, exerciseName, fmtKg, planFor, programPosition, setsPerGroup, WEEKDAY_SHORT,
  type Plan, type PlanSession, type TodayView,
} from "@fitness/core";

export const exerciseHistory = (s: AppState, exerciseId: string): LoggedSet[][] => coreHistory(s, exerciseId, localDate());
export const suggestionFor = (s: AppState, e: PrescribedExercise): Suggestion | null => coreSuggestion(s, e, localDate());

export function useToday(weekdayOverride?: number): TodayView | null {
  const s = useAppState();
  const date = localDate();
  return useMemo(() => {
    const plan = planFor(s);
    return plan ? buildToday(s, plan, new Date(), weekdayOverride) : null;
    // `date` re-runs this after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, date, weekdayOverride]);
}
