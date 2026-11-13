-- LiftWise: per-user schema. Every row belongs to auth.uid(); RLS enforces it on every table.
-- The web app (anon key + user session) and the MCP server (user's OAuth access token) both go
-- through these policies, so neither can ever read or write another user's data.
-- Legacy tables (user_preferences, completed_sessions, body_measurements) are left untouched here;
-- see 20261112000002_lock_down_legacy.sql.

create extension if not exists pgcrypto;

-- ---------- profiles: one row per user; scalar settings + small JSON blobs ----------
create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  name           text not null default '' check (char_length(name) <= 40),
  height_cm      numeric(5,1) check (height_cm between 100 and 250),
  goal_metric    text not null default 'none' check (goal_metric in ('ffmi','weight','bodyfat','none')),
  goal_value     numeric(6,2),
  program_source text check (program_source in ('classic','generated')),
  program_start  date not null default (date_trunc('week', now()))::date,
  units          text not null default 'metric' check (units in ('metric','imperial')),
  timezone       text not null default 'UTC' check (char_length(timezone) <= 64),
  habits         jsonb not null default '[]'::jsonb check (jsonb_typeof(habits) = 'array' and pg_column_size(habits) < 16384),
  active_session jsonb check (active_session is null or pg_column_size(active_session) < 16384),
  health_consent_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- programs: versioned; exactly one active per user. Changes add a version. ----------
create table public.programs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  version     int  not null check (version >= 1),
  data        jsonb not null check (pg_column_size(data) < 262144),
  reason      text not null default '' check (char_length(reason) <= 300),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, version)
);
create unique index programs_one_active on public.programs (user_id) where is_active;

-- ---------- set_logs: one row per completed set. client_key makes writes idempotent. ----------
create table public.set_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_key    text not null check (char_length(client_key) <= 160),   -- "<exerciseId>:<setIndex>:<yyyy-mm-dd>"
  exercise_id   text not null check (char_length(exercise_id) <= 120),
  set_index     smallint not null check (set_index between 0 and 20),
  weight_kg     numeric(6,2) not null check (weight_kg between 0 and 1000),
  reps          smallint not null check (reps between 0 and 200),
  rir           smallint check (rir between 0 and 10),
  completed_at  timestamptz not null,
  source        text not null default 'app' check (source in ('app','chatgpt','claude','mcp')),
  unique (user_id, client_key)
);
create index set_logs_user_time on public.set_logs (user_id, completed_at desc);
create index set_logs_user_exercise on public.set_logs (user_id, exercise_id, completed_at desc);

-- ---------- workouts: finished sessions ----------
create table public.workouts (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date     date not null,
  weekday  smallint not null check (weekday between 0 and 6),
  sets     smallint not null check (sets between 0 and 200),
  source   text not null default 'app' check (source in ('app','chatgpt','claude','mcp')),
  primary key (user_id, date, weekday)
);

-- ---------- checkins: daily readiness ----------
create table public.checkins (
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date         date not null,
  sleep_hours  numeric(3,1) not null check (sleep_hours between 0 and 24),
  energy       smallint not null check (energy between 1 and 5),
  soreness     text not null check (soreness in ('none','low','mid','high','max')),
  primary key (user_id, date)
);

-- ---------- habit_logs: which habits were done on which day ----------
create table public.habit_logs (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date      date not null,
  habit_id  text not null check (char_length(habit_id) <= 80),
  primary key (user_id, date, habit_id)
);

-- ---------- measurements: one row per day ----------
create table public.measurements (
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date         date not null,
  weight_kg    numeric(5,2) not null check (weight_kg between 25 and 350),
  body_fat_pct numeric(4,1) check (body_fat_pct between 2 and 60),
  arms_cm      numeric(4,1) check (arms_cm between 15 and 80),
  chest_cm     numeric(5,1) check (chest_cm between 50 and 200),
  waist_cm     numeric(5,1) check (waist_cm between 40 and 200),
  primary key (user_id, date)
);

-- ---------- coach_notes: what the AI coach remembers (visible + deletable by the user) ----------
create table public.coach_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 200),
  source      text not null default 'you' check (source in ('you','onboarding','chat')),
  created_at  timestamptz not null default now(),
  unique (user_id, text)
);

-- ---------- RLS: owner-only on every table ----------
do $$
declare t text;
begin
  foreach t in array array['programs','set_logs','workouts','checkins','habit_logs','measurements','coach_notes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format($p$create policy "own rows" on public.%I for all to authenticated
                     using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Nothing is readable without a signed-in user.
revoke all on public.profiles, public.programs, public.set_logs, public.workouts, public.checkins,
              public.habit_logs, public.measurements, public.coach_notes from anon;

-- ---------- housekeeping ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- A profile row appears on signup so clients can always upsert into it.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Activating a new program version deactivates the old one atomically.
create or replace function public.save_program(p_data jsonb, p_version int, p_reason text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare new_id uuid;
begin
  update public.programs set is_active = false where user_id = (select auth.uid()) and is_active;
  insert into public.programs (user_id, version, data, reason, is_active)
  values ((select auth.uid()), p_version, p_data, coalesce(p_reason, ''), true)
  on conflict (user_id, version) do update set data = excluded.data, reason = excluded.reason, is_active = true
  returning id into new_id;
  return new_id;
end $$;

-- GDPR: users can delete their own account (cascades to every table above).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Workout reminders: one row per device that turned on notifications.
-- The reminder sender (apps/mcp /cron/reminders, service role) reads these; users only see their own.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null check (endpoint like 'https://%' and length(endpoint) < 1024),
  p256dh text not null check (length(p256dh) < 256),
  auth text not null check (length(auth) < 128),
  remind_at time not null default '18:00',
  last_sent_on date,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.push_subscriptions from anon;

-- Realtime: sets logged from ChatGPT/Claude show up in an open app immediately.
alter publication supabase_realtime add table public.set_logs, public.workouts, public.checkins, public.coach_notes, public.programs;
