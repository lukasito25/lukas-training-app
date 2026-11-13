/** Vercel entry (Web handler). vercel.json routes every path here. */
import { createHandler } from "../src/http";

let handler: ReturnType<typeof createHandler> | null = null;

function handle(request: Request) {
  handler ??= createHandler({
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    PUBLIC_URL: process.env.PUBLIC_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
  return handler(request);
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
export const DELETE = handle;
export default { fetch: handle };
