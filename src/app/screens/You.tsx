import { useState } from "react";
import { GOAL_INFO, SPLIT_LABEL } from "@fitness/core";
import { Card, Icon, type Tab } from "../ui";
import { actions, useAppState } from "../store";
import { planFor, programPosition } from "../today";
import { BRAND } from "../brand";
import { AccountCard, ConnectedApps, ReminderCard } from "./Account";
import { deleteAccount, useCloud } from "../cloud";

const Row = ({ label, onClick, href, download }: { label: string; onClick?: () => void; href?: string; download?: string }) => {
  const cls = "flex justify-between items-center min-h-[48px] px-4 text-sm font-semibold text-ink border-t border-hairline first:border-t-0";
  return href ? (
    <a href={href} download={download} className={cls}>{label}<span className="text-muted">›</span></a>
  ) : (
    <button onClick={onClick} className={`${cls} w-full text-left`}>{label}<span className="text-muted">›</span></button>
  );
};

export default function You({ go, editProgram }: { go: (t: Tab) => void; editProgram: () => void }) {
  const s = useAppState();
  const plan = planFor(s)!;
  const pos = programPosition(s.programStart, plan.totalWeeks, plan.weeksPerBlock);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cloud = useCloud();
  const [editingName, setEditingName] = useState(!s.name);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const exp = s.program?.inputs.experience;

  const exportData = () => {
    const blob = new Blob([actions.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liftwise-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-6 pb-4">
      <div className="flex items-center gap-3.5">
        <span className="w-14 h-14 rounded-full bg-ink text-volt font-display font-semibold text-[22px] flex items-center justify-center flex-none">
          {(s.name || "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          {editingName ? (
            <form onSubmit={(e) => { e.preventDefault(); setEditingName(false); }} className="flex gap-2">
              <input autoFocus value={s.name} onChange={(e) => actions.setProfile({ name: e.target.value })} placeholder="Your name" aria-label="Your name"
                className="h-11 flex-1 min-w-0 px-3 rounded-xl border border-hairline-strong bg-surface text-base font-semibold" />
              <button type="submit" className="h-11 px-3 rounded-xl bg-ink text-on-dark text-[13px] font-semibold">Save</button>
            </form>
          ) : (
            <button onClick={() => setEditingName(true)} className="text-left">
              <h1 className="m-0 font-display text-[26px] font-semibold tracking-tightish truncate">{s.name}</h1>
            </button>
          )}
          <span className="text-[13px] text-muted truncate">
            {exp ? `${exp[0].toUpperCase()}${exp.slice(1)} · ` : ""}kg / cm · {tz}
          </span>
        </div>
      </div>

      <AccountCard />

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-sm font-semibold">Your program</span>
          <span className="text-xs text-muted">v{s.program?.version ?? 1}</span>
        </div>
        <span className="text-[13px] text-[#3A3A40]">
          {s.programSource === "generated" && s.program
            ? `${GOAL_INFO[s.program.inputs.goal].label} · ${SPLIT_LABEL[s.program.inputs.daysPerWeek]} · ~${s.program.inputs.sessionMinutes} min`
            : "Classic 48-week hypertrophy plan · Push · Pull · Legs · Arms+"}
        </span>
        <label className="flex flex-col gap-1 text-xs text-muted">Current week
          <select value={pos.weekIndex} onChange={(e) => actions.setWeekIndex(Number(e.target.value))}
            className="h-11 px-2 rounded-xl border border-hairline-strong bg-surface text-sm text-ink">
            {Array.from({ length: plan.totalWeeks }, (_, i) => (
              <option key={i} value={i}>
                Week {i + 1} · Block {Math.floor(i / plan.weeksPerBlock) + 1} {plan.blockName(Math.floor(i / plan.weeksPerBlock))}{(i % plan.weeksPerBlock) + 1 === plan.weeksPerBlock ? " · deload" : ""}
              </option>
            ))}
          </select>
        </label>
        {s.program && s.program.history.length > 1 && (
          <details>
            <summary className="text-xs text-muted cursor-pointer">Change history ({s.program.history.length})</summary>
            <ul className="mt-2 flex flex-col gap-1">
              {[...s.program.history].reverse().map((h) => (
                <li key={h.version} className="text-xs text-[#3A3A40]">v{h.version} · {new Date(h.at).toLocaleDateString()} · {h.reason}</li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      <ReminderCard />

      <ConnectedApps />

      <Card className="flex flex-col p-4 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Coach memory</span>
          <span className="text-xs text-muted">What your AI coach remembers. Delete anything you don't want it to use.</span>
        </div>
        {s.coachNotes.length === 0 && <span className="text-[13px] text-muted">Nothing yet.</span>}
        {s.coachNotes.map((n) => (
          <div key={n.id} className="flex items-center gap-2 py-1.5 border-t border-hairline first:border-t-0">
            <span className="flex-1 text-[13px]">{n.text}</span>
            <button aria-label={`Delete memory: ${n.text}`} onClick={() => actions.removeCoachNote(n.id)}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-muted flex-none"><Icon name="x" size={16} /></button>
          </div>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); actions.addCoachNote(note); setNote(""); }} className="flex gap-2 pt-1">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. Trains at 6:00, before work" aria-label="New coach memory"
            className="h-11 flex-1 min-w-0 px-3 rounded-xl border border-hairline-strong bg-surface text-sm" />
          <button type="submit" disabled={!note.trim()} className="h-11 px-3.5 rounded-xl bg-ink text-on-dark text-[13px] font-semibold disabled:opacity-40">Add</button>
        </form>
      </Card>

      <Card className="flex flex-col !p-0 overflow-hidden">
        <Row label={s.programSource === "generated" ? "Goals & schedule" : "Build a personalised program"} onClick={editProgram} />
        <Row label="Habits & check-in" onClick={() => go("habits")} />
        <Row label="Export my data (JSON)" onClick={exportData} />
        <Row label="Previous app history (classic app)" href="?legacy" />
      </Card>

      {confirmDelete ? (
        <div className="flex flex-col gap-2 p-4 rounded-[18px] border border-danger-line bg-surface" role="alertdialog" aria-labelledby="del-title">
          <span id="del-title" className="text-sm font-semibold text-danger">
            {cloud.userId ? "Delete your account and all its data?" : "Delete all data on this device?"}
          </span>
          <span className="text-xs text-muted">
            Program, logs, measurements, habits and coach memory are removed{cloud.userId ? " from every device and our servers, and connected AI apps lose access" : ""}. This can't be undone. Export first if you want a copy.
          </span>
          {deleteError && <span className="text-xs text-danger" role="alert">{deleteError}</span>}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmDelete(false)} className="h-11 rounded-xl border border-hairline-strong text-sm font-semibold">Cancel</button>
            <button onClick={async () => setDeleteError(await deleteAccount())} className="h-11 rounded-xl bg-danger text-white text-sm font-semibold">Delete everything</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="h-12 rounded-[14px] border border-danger-line text-danger text-sm font-semibold">
          {cloud.userId ? "Delete account and all data" : "Delete all data on this device"}
        </button>
      )}
      <span className="text-[11px] text-muted text-center px-4">
        {BRAND.title}. Training guidance only, not medical advice. Check with a professional if you have an injury or condition.
        {" "}<a href="/privacy" className="underline">Privacy</a> · <a href="/terms" className="underline">Terms</a>
      </span>
    </div>
  );
}
