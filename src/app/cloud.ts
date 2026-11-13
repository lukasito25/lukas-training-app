/**
 * Accounts and cloud sync (Supabase). The app stays local-first: every action writes to the
 * device store immediately; when signed in, changes queue in an outbox that flushes to Postgres
 * (owner-only RLS) and the device refreshes from the server — including sets logged from
 * ChatGPT or Claude through the MCP connector, which arrive over Realtime.
 *
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app simply runs device-only.
 */
import { useSyncExternalStore } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import {
  userDataFromRows, type CheckinRow, type CoachNoteRow, type HabitLogRow, type MeasurementRow, type ProfileRow,
  type ProgramRow, type SetLogRow, type UserData, type WorkoutRow,
} from "@fitness/core";
import { applyServerState, DEFAULT_HABITS, emptyUserData, getState, onLocalChange, resetLocal, type AppState } from "./store";
import { compact, diffState, mergeData, type Op } from "./sync";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const MCP_URL = (import.meta.env.VITE_MCP_URL as string | undefined) ?? "";

export const supabase: SupabaseClient | null =
  URL_ && KEY_ ? createClient(URL_, KEY_, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

// ---------- status store ----------

export type SyncPhase = "off" | "signed_out" | "syncing" | "synced" | "offline" | "error";
export interface CloudStatus {
  phase: SyncPhase;
  email: string | null;
  userId: string | null;
  pending: number;
  lastSyncedAt: number | null;
  error: string | null;
}

let status: CloudStatus = { phase: supabase ? "signed_out" : "off", email: null, userId: null, pending: 0, lastSyncedAt: null, error: null };
const statusListeners = new Set<() => void>();
const setStatus = (patch: Partial<CloudStatus>) => {
  status = { ...status, ...patch };
  statusListeners.forEach((l) => l());
};
export const useCloud = () =>
  useSyncExternalStore((l) => (statusListeners.add(l), () => statusListeners.delete(l)), () => status, () => status);

// ---------- outbox (persisted so offline edits survive a reload) ----------

const OUTBOX_KEY = "liftwise.outbox";
const LINKED_KEY = (uid: string) => `liftwise.linked.${uid}`;
let outbox: Op[] = [];
try {
  outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]");
} catch {
  outbox = [];
}
const saveOutbox = () => {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  } catch {
    /* in memory only */
  }
  setStatus({ pending: outbox.length });
};
const enqueue = (ops: Op[]) => {
  if (!ops.length) return;
  outbox = compact([...outbox, ...ops]);
  saveOutbox();
  scheduleFlush(300);
};

const userData = (s: AppState): UserData => {
  const { version: _v, active: _a, ...data } = s;
  return data;
};

// ---------- network ----------

let session: Session | null = null;
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let localVersion = 0;

function scheduleFlush(ms: number) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), ms);
}

async function runOp(sb: SupabaseClient, uid: string, op: Op) {
  const user_id = uid;
  switch (op.t) {
    case "profile": return sb.from("profiles").upsert({ user_id, ...op.row, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    case "program": return sb.rpc("save_program", { p_data: op.data, p_version: op.version, p_reason: op.reason });
    case "set_upsert": return sb.from("set_logs").upsert({ user_id, ...op.row }, { onConflict: "user_id,client_key" });
    case "set_delete": return sb.from("set_logs").delete().eq("user_id", uid).eq("client_key", op.key);
    case "workout_upsert": return sb.from("workouts").upsert({ user_id, ...op.row });
    case "checkin_upsert": return sb.from("checkins").upsert({ user_id, ...op.row });
    case "habit_insert": return sb.from("habit_logs").upsert({ user_id, ...op.row }, { ignoreDuplicates: true });
    case "habit_delete": return sb.from("habit_logs").delete().eq("user_id", uid).eq("date", op.row.date).eq("habit_id", op.row.habit_id);
    case "measure_upsert": return sb.from("measurements").upsert({ user_id, ...op.row });
    case "measure_delete": return sb.from("measurements").delete().eq("user_id", uid).eq("date", op.date);
    case "note_insert": return sb.from("coach_notes").upsert({ user_id, text: op.text, source: op.source }, { onConflict: "user_id,text", ignoreDuplicates: true });
    case "note_delete": return sb.from("coach_notes").delete().eq("user_id", uid).eq("text", op.text);
  }
}

/** Sends queued writes in order; stops at the first failure and retries later. */
export async function flush(): Promise<boolean> {
  const sb = supabase, uid = session?.user.id;
  if (!sb || !uid || flushing) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus({ phase: "offline" });
    return false;
  }
  flushing = true;
  setStatus({ phase: "syncing" });
  try {
    while (outbox.length) {
      const { error } = (await runOp(sb, uid, outbox[0])) ?? {};
      if (error) {
        // Constraint violations won't succeed on retry: drop that write instead of blocking the queue.
        if (/violates|invalid input|out of range/i.test(error.message)) {
          console.warn("[sync] dropped an invalid write", outbox[0].t, error.message);
        } else {
          throw error;
        }
      }
      outbox = outbox.slice(1);
      saveOutbox();
    }
    setStatus({ phase: "synced", lastSyncedAt: Date.now(), error: null });
    return true;
  } catch (e) {
    setStatus({ phase: navigator.onLine ? "error" : "offline", error: e instanceof Error ? e.message : String(e) });
    scheduleFlush(15_000);
    return false;
  } finally {
    flushing = false;
  }
}

async function fetchServer(sb: SupabaseClient, uid: string): Promise<{ data: UserData; empty: boolean }> {
  const q = <T>(p: PromiseLike<{ data: T[] | null; error: unknown }>) =>
    Promise.resolve(p).then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });
  const [profiles, programs, setLogs, workouts, checkins, habitLogs, measurements, coachNotes] = await Promise.all([
    q<ProfileRow>(sb.from("profiles").select("*").eq("user_id", uid)),
    q<ProgramRow>(sb.from("programs").select("*").eq("user_id", uid).eq("is_active", true)),
    q<SetLogRow>(sb.from("set_logs").select("*").eq("user_id", uid).order("completed_at", { ascending: true }).limit(20000)),
    q<WorkoutRow>(sb.from("workouts").select("*").eq("user_id", uid)),
    q<CheckinRow>(sb.from("checkins").select("*").eq("user_id", uid)),
    q<HabitLogRow>(sb.from("habit_logs").select("*").eq("user_id", uid)),
    q<MeasurementRow>(sb.from("measurements").select("*").eq("user_id", uid)),
    q<CoachNoteRow>(sb.from("coach_notes").select("*").eq("user_id", uid).order("created_at")),
  ]);
  const profile = profiles[0] ?? null;
  const empty = !profile?.program_source && setLogs.length === 0 && measurements.length === 0;
  return {
    data: userDataFromRows({ profile, program: programs[0] ?? null, setLogs, workouts, checkins, habitLogs, measurements, coachNotes }, DEFAULT_HABITS),
    empty,
  };
}

/** Pulls the server copy, unless local edits are still queued or happened meanwhile. */
export async function refresh() {
  const sb = supabase, uid = session?.user.id;
  if (!sb || !uid) return;
  if (!(await flush()) && outbox.length) return;
  const startedAt = localVersion;
  try {
    const { data } = await fetchServer(sb, uid);
    if (outbox.length === 0 && localVersion === startedAt) applyServerState(data);
    setStatus({ phase: "synced", lastSyncedAt: Date.now(), error: null });
  } catch (e) {
    setStatus({ phase: navigator.onLine ? "error" : "offline", error: e instanceof Error ? e.message : String(e) });
  }
}

/** First sign-in on this device: keep data from both sides, then upload what the server lacks. */
async function link(sb: SupabaseClient, uid: string) {
  setStatus({ phase: "syncing" });
  const { data: server, empty } = await fetchServer(sb, uid);
  const local = userData(getState());
  if (empty) {
    enqueue(diffState(emptyUserData(), local));
  } else {
    const merged = mergeData(local, server);
    applyServerState(merged);
    enqueue(diffState(server, merged));
  }
  try {
    localStorage.setItem(LINKED_KEY(uid), "1");
  } catch {
    /* re-links next time; merging is idempotent */
  }
  await flush();
}

// ---------- realtime ----------

let channel: ReturnType<SupabaseClient["channel"]> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
function subscribe(sb: SupabaseClient, uid: string) {
  channel?.unsubscribe();
  const debounced = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void refresh(), 800);
  };
  channel = sb.channel(`user-${uid}`);
  for (const table of ["set_logs", "workouts", "checkins", "coach_notes", "programs"]) {
    channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `user_id=eq.${uid}` }, debounced);
  }
  channel.subscribe();
}

// ---------- auth ----------

async function onSession(next: Session | null) {
  const prevUid = session?.user.id ?? null;
  session = next;
  const sb = supabase;
  if (!sb) return;
  if (!next) {
    channel?.unsubscribe();
    channel = null;
    setStatus({ phase: "signed_out", email: null, userId: null });
    return;
  }
  setStatus({ email: next.user.email ?? null, userId: next.user.id });
  if (prevUid === next.user.id) return; // token refresh
  try {
    let linked = false;
    try {
      linked = localStorage.getItem(LINKED_KEY(next.user.id)) === "1";
    } catch {
      /* treat as not linked */
    }
    if (linked) await refresh();
    else await link(sb, next.user.id);
    subscribe(sb, next.user.id);
  } catch (e) {
    setStatus({ phase: "error", error: e instanceof Error ? e.message : String(e) });
  }
}

let started = false;
/** Wires auth, the outbox and refresh-on-focus. Safe to call more than once. */
export function startCloud() {
  if (started || !supabase) return;
  started = true;
  onLocalChange((prev, next) => {
    localVersion++;
    if (session) enqueue(diffState(userData(prev), userData(next)));
  });
  supabase.auth.getSession().then(({ data }) => onSession(data.session));
  supabase.auth.onAuthStateChange((_event, s) => {
    // Never await Supabase calls inside this callback (it holds the auth lock).
    setTimeout(() => void onSession(s), 0);
  });
  window.addEventListener("online", () => void flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refresh();
  });
}

const redirectBack = () => window.location.origin + window.location.pathname + window.location.search;

export async function sendMagicLink(email: string): Promise<string | null> {
  if (!supabase) return "Accounts aren't set up on this build.";
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectBack(), shouldCreateUser: true } });
  return error ? error.message : null;
}

/** Signs out and removes this device's copy (the account keeps everything). */
export async function signOut(): Promise<string | null> {
  if (!supabase) return null;
  if (outbox.length && !(await flush())) return "Some changes haven't synced yet. Connect to the internet and try again.";
  await disableReminder().catch(() => undefined); // the next person on this device shouldn't get your reminders
  const { error } = await supabase.auth.signOut();
  if (error) return error.message;
  resetLocal();
  return null;
}

/** Permanently deletes the account and all its data on the server, then this device's copy. */
export async function deleteAccount(): Promise<string | null> {
  if (!supabase || !session) {
    resetLocal();
    return null;
  }
  await disableReminder().catch(() => undefined);
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return error.message;
  outbox = [];
  saveOutbox();
  await supabase.auth.signOut().catch(() => undefined);
  resetLocal();
  return null;
}

// ---------- connected AI apps (OAuth grants from Supabase's OAuth 2.1 server) ----------

export interface Grant { clientId: string; name: string; uri: string; logo: string; scopes: string[]; grantedAt: string }

export async function listGrants(): Promise<Grant[] | null> {
  if (!supabase || !session) return null;
  try {
    const { data, error } = await supabase.auth.oauth.listGrants();
    if (error || !data) return [];
    return data.map((g) => ({ clientId: g.client.id, name: g.client.name, uri: g.client.uri, logo: g.client.logo_uri, scopes: g.scopes, grantedAt: g.granted_at }));
  } catch {
    return []; // OAuth server not enabled on this project yet
  }
}

export async function revokeGrant(clientId: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
  return error ? error.message : null;
}

// ---------- workout reminders (web push) ----------

const VAPID_PUBLIC = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? "";

export type ReminderSupport = "ok" | "no_server" | "no_browser" | "ios_install" | "blocked";

export function reminderSupport(): ReminderSupport {
  if (!supabase || !VAPID_PUBLIC) return "no_server";
  if (typeof Notification !== "undefined" && Notification.permission === "denied") return "blocked";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return "ios_install"; // iOS only allows push for apps added to the Home Screen
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") return "no_browser";
  return "ok";
}

const b64ToBytes = (b64: string) => {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function currentPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** This device's reminder time ("18:00") if reminders are on, else null. */
export async function getReminder(): Promise<string | null> {
  if (!supabase || !session) return null;
  const sub = await currentPush();
  if (!sub) return null;
  const { data } = await supabase.from("push_subscriptions").select("remind_at").eq("endpoint", sub.endpoint).maybeSingle();
  return data ? String(data.remind_at).slice(0, 5) : null;
}

/** Asks for notification permission, subscribes this device and saves the reminder time. */
export async function enableReminder(time: string): Promise<string | null> {
  if (!supabase || !session) return "Sign in first.";
  if (reminderSupport() !== "ok") return "Reminders aren't available in this browser.";
  if ((await Notification.requestPermission()) !== "granted") return "Notifications are blocked. Allow them for this site in your browser settings.";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) }));
  const keys = sub.toJSON().keys ?? {};
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  await supabase.from("profiles").update({ timezone }).eq("user_id", session.user.id);
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: session.user.id, endpoint: sub.endpoint, p256dh: keys.p256dh, auth: keys.auth, remind_at: time },
    { onConflict: "user_id,endpoint" },
  );
  return error ? error.message : null;
}

/** Turns reminders off on this device. */
export async function disableReminder(): Promise<string | null> {
  const sub = await currentPush().catch(() => null);
  if (!sub) return null;
  if (supabase && session) {
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    if (error) return error.message;
  }
  await sub.unsubscribe().catch(() => undefined);
  return null;
}
