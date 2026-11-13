import { useEffect, useState } from "react";
import { TabBar, type Tab } from "./ui";
import { useAppState } from "./store";
import Today from "./screens/Today";
import Train from "./screens/Train";
import Habits from "./screens/Habits";
import Progress from "./screens/Progress";
import You from "./screens/You";
import Onboarding from "./screens/Onboarding";

const TABS: Tab[] = ["today", "train", "progress", "habits", "you"];
const fromHash = (): Tab => {
  const h = window.location.hash.replace("#", "") as Tab;
  return TABS.includes(h) ? h : "today";
};

export default function App() {
  const s = useAppState();
  const [tab, setTab] = useState<Tab>(fromHash);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (t: Tab) => {
    if (t !== tab) window.location.hash = t;
    setTab(t);
    window.scrollTo(0, 0);
  };

  // No plan yet (first run or after deleting data): onboarding first.
  if (!s.programSource) return <Onboarding mode="new" onDone={() => go("today")} />;
  if (editing) return <Onboarding mode="edit" onDone={() => { setEditing(false); go("you"); }} />;

  return (
    <div className="min-h-[100dvh] bg-chalk text-ink font-sans flex justify-center">
      <div className="w-full max-w-[440px] min-h-[100dvh] flex flex-col">
        <main className="flex-1">
          {tab === "today" && <Today go={go} />}
          {tab === "train" && <Train go={go} />}
          {tab === "progress" && <Progress />}
          {tab === "habits" && <Habits />}
          {tab === "you" && <You go={go} editProgram={() => { setEditing(true); window.scrollTo(0, 0); }} />}
        </main>
        <div className="sticky bottom-0">
          <TabBar tab={tab} onChange={go} />
        </div>
      </div>
    </div>
  );
}
