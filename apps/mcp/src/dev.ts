/** Local server: `npm run dev` (needs SUPABASE_URL/SUPABASE_ANON_KEY, or DEV_NO_AUTH=1 for a demo user). */
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { createHandler } from "./http";

const port = Number(process.env.PORT ?? 8787);
const env = {
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  PUBLIC_URL: process.env.PUBLIC_URL ?? `http://localhost:${port}`,
  DEV_NO_AUTH: process.env.DEV_NO_AUTH,
};
if (!env.SUPABASE_URL && env.DEV_NO_AUTH !== "1") {
  console.error("Set SUPABASE_URL and SUPABASE_ANON_KEY, or DEV_NO_AUTH=1 for the in-memory demo user.");
  process.exit(1);
}
const handle = createHandler({ ...env, SUPABASE_URL: env.SUPABASE_URL || "http://localhost:54321", SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || "dev" });

createServer(async (req, res) => {
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : (Readable.toWeb(req) as ReadableStream);
  const request = new Request(new URL(req.url ?? "/", env.PUBLIC_URL), {
    method: req.method, headers: req.headers as HeadersInit, body, duplex: "half",
  } as RequestInit);
  const response = await handle(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (response.body) Readable.fromWeb(response.body as never).pipe(res);
  else res.end();
}).listen(port, () => console.log(`LiftWise MCP on ${env.PUBLIC_URL}/mcp${env.DEV_NO_AUTH === "1" ? " (demo user, no auth)" : ""}`));
