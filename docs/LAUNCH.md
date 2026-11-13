# LiftWise launch checklist

Order matters. Each step says who does it and how to check it worked.

## 1. Database schema (Supabase dashboard › SQL Editor)

1. Paste and run `supabase/migrations/20261112000001_liftwise_schema.sql`.
   It only creates new tables. The classic app's tables are untouched.
2. Check that row-level security is on everywhere:
   ```sql
   select relname, relrowsecurity, relforcerowsecurity
   from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;
   ```
   Every LiftWise table (profiles, programs, set_logs, workouts, checkins, habit_logs, measurements, coach_notes, push_subscriptions) should show `true | true`.

## 2. Auth settings (Supabase dashboard › Authentication)

- **URL Configuration:**
  - Site URL: the web app's URL.
  - Redirect URLs: add the web app URL with `/**` and `http://localhost:5173/**`.
- **Email:** keep magic link on. Set up custom SMTP before launch; the built-in sender is rate-limited to a few emails an hour.
- **OAuth Server** (needed for ChatGPT and Claude):
  - Enable it.
  - Turn on dynamic client registration.
  - Set the authorization path to `/oauth/consent`. With the site URL, this gives `https://<web app>/oauth/consent`.
- **Data region:** health data is GDPR special-category data. If this project isn't in an EU region, consider a new EU project before real users sign up.

## 3. Deploy the connector (terminal)

```bash
vercel login                                   # once
apps/mcp/scripts/deploy.sh <path to secrets.env>
cd apps/mcp/.deploy && vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive   # paste the service-role key
vercel deploy --prod                           # redeploy so the key is picked up
```

- `secrets.env` holds `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET`. Generate it once and never commit it.
- The script also sets `VITE_MCP_URL`, `VITE_VAPID_PUBLIC_KEY` and `VITE_SUPPORT_EMAIL` on the web app project. **Redeploy the web app afterwards.**
- The service-role key is used only by `/cron/reminders`. Tool calls always run as the signed-in user, so RLS applies to them.

To check it worked:
- `curl https://liftwise-mcp.vercel.app/health` returns `ok: true`.
- `curl -i -X POST https://liftwise-mcp.vercel.app/mcp` returns `401` with a `WWW-Authenticate: Bearer resource_metadata=…` header.

## 4. Reminder schedule (SQL Editor, after step 3)

- Run `supabase/migrations/20261113000003_reminder_cron.sql` with the two placeholders filled in. The secret must match the connector's `CRON_SECRET`.
- To check it worked, run `select status_code, content from net._http_response order by created desc limit 3;` after 15 minutes. You should see `200` and `{"ok":true,…}`.

## 5. Move the classic app's data (terminal), then lock the old tables

1. Sign in to the new web app once, so your account exists.
2. Supabase › Authentication › Users: copy your user id.
3. Dry run, then the real run:
   ```bash
   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm --prefix apps/mcp run claim-legacy -- --user <id>
   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm --prefix apps/mcp run claim-legacy -- --user <id> --apply
   ```
4. SQL Editor: run `supabase/migrations/20261112000002_lock_down_legacy.sql`. Until you do, anyone holding the public key can read and write the old tables.

## 6. Connect the AI apps

- **Claude:** Settings › Connectors › Add custom connector › `https://liftwise-mcp.vercel.app/mcp`.
- **ChatGPT:** Settings › Apps & Connectors › Developer mode › Create › the same URL, with OAuth.
- Try this flow: "What's my workout today?" → "Log bench 80 kg for 8" → check that the set appears in the open web app.

## 7. Directory submissions (once it's stable)

Both the OpenAI and the Anthropic directories ask for:
- the privacy policy (`/privacy`) and terms (`/terms`),
- the support contact (support@camponord.eu),
- a test account with a program and some logged sets,
- screenshots of the widgets.
