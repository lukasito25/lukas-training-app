import { render } from "preact";
import { useEffect, useLayoutEffect, useMemo, useState } from "preact/hooks";
import { host } from "./host";
import { NavCtx, type Nav } from "./ui";
import type { ViewData } from "./types";
import { Today } from "./today";
import { Change, ExerciseCard, Progress, Review } from "./cards";
import { PlanBuilder, PlanPreview } from "./plan";

function View({ d }: { d: ViewData }) {
  switch (d.view) {
    case "today": return <Today d={d} />;
    case "exercise": return <ExerciseCard d={d} />;
    case "change": return <Change d={d} />;
    case "review": return <Review d={d} />;
    case "progress": return <Progress d={d} />;
    case "plan_builder": return <PlanBuilder d={d} />;
    case "plan_preview": return <PlanPreview d={d} />;
    default: return <div class="card empty">This card isn't available.</div>;
  }
}

function App() {
  const [stack, setStack] = useState<ViewData[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    host.start((d) => {
      if (d && typeof d.view === "string") setStack([d as unknown as ViewData]);
    });
  }, []);

  // Keep the host iframe sized to the content (MCP Apps hosts).
  useLayoutEffect(() => {
    host.resized();
    const ro = new ResizeObserver(() => host.resized());
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const nav: Nav = useMemo(() => ({
    show: (d) => setStack((s) => (s[s.length - 1]?.view === d.view ? [...s.slice(0, -1), d] : [...s, d])),
    back: stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : null,
    busy,
    error: setToast,
    async run(name, args = {}, opts = {}) {
      setBusy(name);
      setToast(null);
      try {
        const d = await host.call(name, args);
        if (!opts.keep && typeof d.view === "string") {
          const v = d as unknown as ViewData;
          setStack((s) => (s[s.length - 1]?.view === v.view ? [...s.slice(0, -1), v] : [...s, v]));
        }
        return d;
      } catch (e) {
        setToast((e as { message?: string })?.message ?? "That didn't work. Try again.");
        return null;
      } finally {
        setBusy(null);
      }
    },
  }), [busy, stack.length]);

  const top = stack[stack.length - 1];
  return (
    <NavCtx.Provider value={nav}>
      {top ? <View d={top} /> : <div class="card empty" role="status">Loading LiftWise…</div>}
      {toast && <div class="toast" role="alert">{toast}</div>}
    </NavCtx.Provider>
  );
}

render(<App />, document.getElementById("app")!);
