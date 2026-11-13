-- LiftWise reminders: call the connector's /cron/reminders every 15 minutes.
-- Run AFTER the connector is deployed. Replace the two placeholders first:
--   <CRON_SECRET>  the same value as the Vercel env var CRON_SECRET
--   <MCP_BASE_URL> e.g. https://liftwise-mcp.vercel.app
-- The secret lives in Supabase Vault, not in the job text.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<CRON_SECRET>', 'liftwise_cron_secret', 'Bearer token for LiftWise /cron/reminders');

select cron.schedule(
  'liftwise-reminders',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := '<MCP_BASE_URL>/cron/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'liftwise_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $job$
);

-- Check it:   select * from cron.job_run_details order by start_time desc limit 5;
--             select status_code, content from net._http_response order by created desc limit 5;
-- Undo:       select cron.unschedule('liftwise-reminders');
