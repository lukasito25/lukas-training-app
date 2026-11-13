-- Run ONLY after scripts/claim-legacy-data.mjs has copied the classic app's 'anonymous' data
-- onto the owner's account. Until then the classic app (?legacy) still reads these tables.
--
-- Today any holder of the public anon key can read and write these rows. This removes every
-- policy on them and blocks the anon/authenticated roles entirely (service role still works,
-- so the data stays recoverable).

do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('user_preferences','completed_sessions','body_measurements')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table if exists public.user_preferences   enable row level security;
alter table if exists public.completed_sessions enable row level security;
alter table if exists public.body_measurements  enable row level security;

revoke all on table public.user_preferences, public.completed_sessions, public.body_measurements from anon, authenticated;
