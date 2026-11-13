/**
 * One-off: copy the classic app's shared 'anonymous' data onto one LiftWise account.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run claim-legacy -- --user <auth user uuid>          # dry run
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run claim-legacy -- --user <auth user uuid> --apply  # write
 *
 * The classic app never stored dated sessions, so this carries over what exists honestly:
 *  - position in the 48-week plan (meso/week) → program_source 'classic' + program_start
 *  - body_measurements → measurements (weight, arms, chest)
 *  - last-used weights per exercise → coach memory notes (no invented set history)
 * Legacy tables are not modified. Afterwards, apply 20261112000002_lock_down_legacy.sql.
 * Run locally only; never deploy the service-role key.
 */
import { createClient } from "@supabase/supabase-js";
import { getLukasSession, LUKAS_TEMPLATE, localDate, startForWeek } from "../../../packages/core/src/index";

const args = process.argv.slice(2);
const userId = args[args.indexOf("--user") + 1];
const apply = args.includes("--apply");
const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || !userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
  console.error("Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run claim-legacy -- --user <uuid> [--apply]");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: user, error: userErr } = await sb.auth.admin.getUserById(userId);
if (userErr || !user?.user) throw new Error(`No auth user ${userId}: ${userErr?.message ?? "not found"}`);

const { data: prefs } = await sb.from("user_preferences").select("*").eq("user_id", "anonymous").maybeSingle();
const { data: legacyMeasurements } = await sb.from("body_measurements").select("*").eq("user_id", "anonymous");

const meso = Math.min(6, Math.max(1, prefs?.meso ?? 1));
const week = Math.min(8, Math.max(1, prefs?.week ?? 1));
const weekIndex = (meso - 1) * LUKAS_TEMPLATE.weeksPerMeso + (week - 1);
const profile = { user_id: userId, program_source: "classic", program_start: startForWeek(weekIndex) };

const measurements = (legacyMeasurements ?? [])
  .map((m) => {
    const t = Date.parse(m.date);
    if (Number.isNaN(t)) {
      console.warn(`skip measurement with unreadable date "${m.date}"`);
      return null;
    }
    return {
      user_id: userId, date: localDate(new Date(t)), weight_kg: Number(m.weight),
      body_fat_pct: null, arms_cm: Number(m.arms) || null, chest_cm: Number(m.chest) || null, waist_cm: null,
    };
  })
  .filter((m): m is NonNullable<typeof m> => m != null && m.weight_kg >= 25);

// weights: { "<day>-<exerciseIndex>": kg } for the meso the user was on.
const weightLines: string[] = [];
for (const [k, kg] of Object.entries((prefs?.weights ?? {}) as Record<string, number>)) {
  const m = /^([a-z_]+)-(\d+)$/.exec(k);
  if (!m || !kg) continue;
  const name = getLukasSession(meso, 1, m[1] as never).exercises[Number(m[2])]?.name;
  if (name) weightLines.push(`${name} ${kg} kg`);
}
const notes: string[] = [];
let cur = "Last weights in the classic app: ";
for (const w of weightLines) {
  if ((cur + w).length > 195) {
    notes.push(cur.replace(/, $/, ""));
    cur = "Classic app weights (cont.): ";
  }
  cur += `${w}, `;
}
if (weightLines.length) notes.push(cur.replace(/, $/, ""));

console.log(JSON.stringify({ user: user.user.email, profile, measurements: measurements.length, notes }, null, 2));

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write.");
  process.exit(0);
}

const must = (r: { error: { message: string } | null }, what: string) => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
};
must(await sb.from("profiles").upsert(profile), "profile");
if (measurements.length) must(await sb.from("measurements").upsert(measurements), "measurements");
for (const text of notes) must(await sb.from("coach_notes").upsert({ user_id: userId, text, source: "onboarding" }, { onConflict: "user_id,text" }), "notes");
console.log("Done. Sign in on the web app to see it, then apply the lock-down migration.");
