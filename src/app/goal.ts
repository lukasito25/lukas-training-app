/** Goal-metric hook for the Today tile. The series math lives in @fitness/core (shared with MCP). */
import { useMemo } from "react";
import { formatMetric, METRIC_LABEL, series, type Metric } from "@fitness/core";
import { useAppState } from "./store";

export { formatMetric, METRIC_LABEL, metricValue, series, type Metric, type Series } from "@fitness/core";

export function useGoal() {
  const s = useAppState();
  return useMemo(() => {
    const metric: Metric = s.goalMetric === "none" ? "weight" : s.goalMetric;
    const sr = series(s, metric);
    const first = sr.points[0]?.value ?? null;
    const current = sr.points[sr.points.length - 1]?.value ?? null;
    const target = sr.target;
    const format = formatMetric(metric);
    const delta = first != null && current != null && sr.points.length > 1 ? Math.round((current - first) * 10) / 10 : null;
    const progressPct = first != null && current != null && target != null && target !== first ? ((current - first) / (target - first)) * 100 : null;
    const cta = metric === "ffmi" && !s.heightCm ? "Add height & a measurement ›" : "Add a measurement ›";
    return {
      label: METRIC_LABEL[metric], current, target, format, delta, progressPct: sr.reached ? 100 : progressPct, cta, reached: sr.reached,
      deltaGood: delta != null && (sr.wantsDown ? delta < 0 : delta > 0),
    };
  }, [s]);
}
