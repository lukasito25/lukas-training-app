/**
 * Workout reminders. Supabase pg_cron calls POST /cron/reminders every 15 minutes
 * (see supabase/migrations/20261113000003_reminder_cron.sql). For each device that turned
 * reminders on, we send one web-push per day, at or shortly after its chosen time, only on
 * training days and only if today's workout isn't already logged.
 *
 * This is the one code path that uses the service-role key (it has to read every user's
 * subscriptions). It only reads profiles, the active program and today's workouts, and it
 * runs only with a valid CRON_SECRET.
 */
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import {
  buildToday, localDate, planFor, userDataFromRows, zonedNow, type ProfileRow, type ProgramRow, type WorkoutRow,
} from "../../../packages/core/src/index";

export interface ReminderEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  CRON_SECRET?: string;
}

export interface SubRow {
  id: string; user_id: string; endpoint: string; p256dh: string; auth: string; remind_at: string; last_sent_on: string | null;
}

/** Send window: from the chosen time until 2 hours later (covers a missed cron tick, never nags at night). */
const WINDOW_MIN = 120;

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export interface Due { sub: SubRow; title: string; body: string; date: string }

/** Pure decision step (unit-tested): which subscriptions get a reminder right now, and what it says. */
export function dueReminders(
  subs: SubRow[], profiles: ProfileRow[], programs: ProgramRow[], workouts: WorkoutRow[], at = new Date(),
): Due[] {
  const out: Due[] = [];
  for (const sub of subs) {
    const profile = profiles.find((p) => p.user_id === sub.user_id) ?? null;
    if (!profile) continue;
    const now = zonedNow(profile.timezone || "UTC", at);
    const date = localDate(now);
    if (sub.last_sent_on === date) continue;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const start = minutes(sub.remind_at);
    if (nowMin < start || nowMin > start + WINDOW_MIN) continue;

    const mine = workouts.filter((w) => w.user_id === sub.user_id);
    if (mine.some((w) => w.date === date)) continue;
    const data = userDataFromRows({
      profile, program: programs.find((p) => p.user_id === sub.user_id) ?? null,
      setLogs: [], workouts: mine, checkins: [], habitLogs: [], measurements: [], coachNotes: [],
    });
    const plan = planFor(data);
    if (!plan) continue;
    const t = buildToday(data, plan, now);
    if (!t.session.training) continue;
    const s = t.session;
    out.push({
      sub, date,
      title: `${s.label} day${s.deload ? " · deload" : ""}`,
      body: `${s.title}: ${s.exercises.length} exercises, about ${s.estMinutes} min. Tap to start.`,
    });
  }
  return out;
}

export async function runReminders(env: ReminderEnv, at = new Date()) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return { ok: false, error: "reminders not configured" };
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT || "mailto:support@camponord.eu", env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: subs, error } = await sb.from("push_subscriptions").select("*").limit(5000);
  if (error) throw new Error(error.message);
  if (!subs?.length) return { ok: true, checked: 0, sent: 0 };
  const users = [...new Set(subs.map((s) => s.user_id as string))];
  // Today's workouts only (any timezone): yesterday..tomorrow in UTC covers every offset.
  const day = 86_400_000;
  const from = localDate(new Date(at.getTime() - day));
  const to = localDate(new Date(at.getTime() + day));
  const [profiles, programs, workouts] = await Promise.all([
    sb.from("profiles").select("*").in("user_id", users),
    sb.from("programs").select("*").in("user_id", users).eq("is_active", true),
    sb.from("workouts").select("user_id,date,weekday,sets").in("user_id", users).gte("date", from).lte("date", to),
  ]);
  for (const r of [profiles, programs, workouts]) if (r.error) throw new Error(r.error.message);

  const due = dueReminders(subs as SubRow[], profiles.data as ProfileRow[], programs.data as ProgramRow[], workouts.data as WorkoutRow[], at);
  let sent = 0, removed = 0;
  await Promise.all(due.map(async (d) => {
    try {
      await webpush.sendNotification(
        { endpoint: d.sub.endpoint, keys: { p256dh: d.sub.p256dh, auth: d.sub.auth } },
        JSON.stringify({ title: d.title, body: d.body, url: "/" }),
        { TTL: 3 * 3600, urgency: "normal" },
      );
      sent++;
      await sb.from("push_subscriptions").update({ last_sent_on: d.date }).eq("id", d.sub.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        // The browser dropped this subscription; forget it.
        removed++;
        await sb.from("push_subscriptions").delete().eq("id", d.sub.id);
      } else {
        console.log(JSON.stringify({ level: "warn", msg: "push failed", status: code ?? null }));
      }
    }
  }));
  console.log(JSON.stringify({ level: "info", job: "reminders", checked: subs.length, due: due.length, sent, removed }));
  return { ok: true, checked: subs.length, sent, removed };
}
