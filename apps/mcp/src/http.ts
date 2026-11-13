/**
 * Web-standard HTTP handler (works on Vercel, Node, Deno, Cloudflare):
 *  - /.well-known/oauth-protected-resource  → points clients at Supabase's OAuth 2.1 server
 *  - /mcp                                    → MCP Streamable HTTP, bearer token required
 *
 * Auth: ChatGPT/Claude discover the authorization server from the protected-resource metadata,
 * register via Dynamic Client Registration, and send the user through LiftWise's consent page
 * (/oauth/consent in the web app). The access token is a Supabase JWT; tools run as that user.
 */
import { createClient } from "@supabase/supabase-js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "./server";
import { memoryRepo, supabaseRepo, type Repo } from "./repo";
import type { Source } from "../../../packages/core/src/index";
import { runReminders, type ReminderEnv } from "./reminders";

export interface Env extends ReminderEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  /** Public base URL of this server, e.g. https://mcp.liftwise.app */
  PUBLIC_URL: string;
  /** Local only: skip OAuth and use an in-memory demo user. Never set in production. */
  DEV_NO_AUTH?: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, WWW-Authenticate",
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS, ...headers } });

// Per-instance rate limit: 120 tool requests / minute / user.
const buckets = new Map<string, { n: number; reset: number }>();
function rateLimited(key: string) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + 60_000 });
    return false;
  }
  return ++b.n > 120;
}

function sourceFrom(req: Request): Source {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("openai") || ua.includes("chatgpt")) return "chatgpt";
  if (ua.includes("claude") || ua.includes("anthropic")) return "claude";
  return "mcp";
}

let devRepo: Repo | null = null;
const SCOPES = ["email", "profile"];

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function createHandler(env: Env) {
  const base = env.PUBLIC_URL.replace(/\/$/, "");
  const resource = `${base}/mcp`;
  const metadataUrl = `${base}/.well-known/oauth-protected-resource`;
  const issuer = `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
  const auth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const unauthorized = (error = "invalid_token", description = "Sign in to LiftWise to continue") =>
    json({ error, error_description: description }, 401, {
      "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}", scope="${SCOPES.join(" ")}", error="${error}", error_description="${description}"`,
    });

  // One structured line per request (path, status, auth outcome, client family). Never logs tokens or bodies.
  return async function handle(req: Request): Promise<Response> {
    const started = Date.now();
    const meta: { auth?: string } = {};
    const res = await route(req, meta);
    console.log(JSON.stringify({
      level: res.status >= 500 ? "error" : "info", req: `${req.method} ${new URL(req.url).pathname}`, status: res.status,
      auth: meta.auth, client: sourceFrom(req), ms: Date.now() - started,
    }));
    return res;
  };

  async function route(req: Request, meta: { auth?: string }): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (url.pathname.startsWith("/.well-known/oauth-protected-resource")) {
      return json({
        resource,
        authorization_servers: [issuer],
        bearer_methods_supported: ["header"],
        // No "openid": Supabase then tries to mint an ID token, which fails on projects still on the
        // legacy HS256 JWT secret ("Error generating ID token"). The connector only needs the access token.
        scopes_supported: SCOPES,
        resource_name: "LiftWise",
        resource_documentation: base,
      });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ name: "LiftWise MCP server", mcp: resource, ok: true });
    }

    if (url.pathname === "/cron/reminders") {
      if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!env.CRON_SECRET || !safeEqual(given, env.CRON_SECRET)) return json({ error: "unauthorized" }, 401);
      try {
        return json(await runReminders(env));
      } catch (e) {
        console.log(JSON.stringify({ level: "error", job: "reminders", msg: (e as Error).message }));
        return json({ ok: false }, 500);
      }
    }

    if (url.pathname !== "/mcp") return json({ error: "not_found" }, 404);

    let repo: Repo;
    let userKey: string;
    if (env.DEV_NO_AUTH === "1") {
      const { richDemoRows } = await import("./demo");
      devRepo ??= memoryRepo(richDemoRows(), "Europe/Bratislava");
      repo = devRepo;
      userKey = "dev";
    } else {
      const header = req.headers.get("authorization") ?? "";
      const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
      if (!token) {
        meta.auth = "no_token";
        return unauthorized("invalid_request", "Missing access token");
      }
      const { data, error } = await auth.auth.getClaims(token);
      const sub = data?.claims?.sub;
      if (error || !sub || data.claims.role !== "authenticated") {
        meta.auth = `rejected: ${error?.message ?? (!sub ? "no sub" : `role=${String(data?.claims?.role)}`)}`;
        return unauthorized();
      }
      meta.auth = "ok";
      repo = supabaseRepo(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, token, sub);
      userKey = sub;
    }

    if (req.method === "POST" && rateLimited(userKey)) {
      return json({ jsonrpc: "2.0", error: { code: -32000, message: "Too many requests, slow down for a minute." }, id: null }, 429, { "Retry-After": "60" });
    }
    if (req.method !== "POST") {
      // Stateless server: no standalone SSE stream or sessions to delete.
      return json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null }, 405, { Allow: "POST, OPTIONS" });
    }
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > 256_000) return json({ jsonrpc: "2.0", error: { code: -32600, message: "Request too large" }, id: null }, 413);

    const server = buildServer({ repo, source: sourceFrom(req) });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    try {
      const res = await transport.handleRequest(req);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
      return new Response(res.body, { status: res.status, headers });
    } finally {
      void server.close();
    }
  }
}
