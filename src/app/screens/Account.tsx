import { useEffect, useState } from "react";
import { Card, Icon } from "../ui";
import {
  disableReminder, enableReminder, getReminder, listGrants, MCP_URL, reminderSupport, revokeGrant, sendMagicLink, signOut, supabase, useCloud,
  type Grant,
} from "../cloud";
import { BRAND } from "../brand";

const PHASE_TEXT = {
  off: "", signed_out: "", syncing: "Syncing…", synced: "Synced", offline: "Offline · changes saved on this device", error: "Sync paused · retrying",
} as const;

/** Email magic-link sign-in. `compact` is the one-line version used on onboarding. */
export function SignInForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (sent) {
    return (
      <span className="text-[13px] text-[#3A3A40]" role="status">
        Check <b className="font-semibold">{sent}</b> for a sign-in link. Open it on this device.
      </span>
    );
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const err = await sendMagicLink(email);
        setBusy(false);
        if (err) setError(err);
        else setSent(email.trim());
      }}
    >
      <div className="flex gap-2">
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          aria-label="Email" className="h-11 flex-1 min-w-0 px-3 rounded-xl border border-hairline-strong bg-surface text-sm" />
        <button type="submit" disabled={busy || !email.includes("@")}
          className="h-11 px-3.5 rounded-xl bg-ink text-on-dark text-[13px] font-semibold disabled:opacity-40">
          {busy ? "Sending…" : compact ? "Sign in" : "Email me a link"}
        </button>
      </div>
      {error && <span className="text-xs text-danger" role="alert">{error}</span>}
      {!compact && <span className="text-xs text-muted">No password. We'll email you a one-time sign-in link.</span>}
    </form>
  );
}

export function AccountCard() {
  const cloud = useCloud();
  const [error, setError] = useState<string | null>(null);
  if (cloud.phase === "off") return null;

  if (!cloud.userId) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Back up & sync</span>
          <span className="text-xs text-muted">
            Sign in to keep your training safe, use {BRAND.name} on every device, and connect ChatGPT or Claude.
          </span>
        </div>
        <SignInForm />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-sm font-semibold">Account</span>
        <span className={`text-xs ${cloud.phase === "error" ? "text-danger" : "text-muted"}`} role="status">
          {PHASE_TEXT[cloud.phase]}{cloud.pending > 0 && cloud.phase !== "syncing" ? ` · ${cloud.pending} waiting` : ""}
        </span>
      </div>
      <span className="text-[13px] text-[#3A3A40] truncate">{cloud.email}</span>
      {error && <span className="text-xs text-danger" role="alert">{error}</span>}
      <button onClick={async () => setError(await signOut())}
        className="self-start h-10 px-3 rounded-xl border border-hairline-strong text-[13px] font-semibold">
        Sign out
      </button>
    </Card>
  );
}

export function ConnectedApps() {
  const cloud = useCloud();
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cloud.userId) listGrants().then(setGrants);
    else setGrants(null);
  }, [cloud.userId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the URL is visible to copy by hand */
    }
  };

  return (
    <Card className="flex flex-col p-4 gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">Connected AI apps</span>
        <span className="text-xs text-muted">
          Ask ChatGPT or Claude "what's my workout today?", log sets by chat, and get your weekly review. They use your {BRAND.name} account.
        </span>
      </div>

      {!cloud.userId ? (
        <span className="text-[13px] text-muted">Sign in above to connect an AI app.</span>
      ) : (
        <>
          {grants && grants.length > 0 ? (
            grants.map((g) => (
              <div key={g.clientId} className="flex items-center gap-2 min-h-[48px] border-t border-hairline first:border-t-0">
                <div className="flex-1 flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{g.name}</span>
                  <span className="text-xs text-muted">Connected {new Date(g.grantedAt).toLocaleDateString()}</span>
                </div>
                <button onClick={async () => { if (!(await revokeGrant(g.clientId))) setGrants((gs) => gs?.filter((x) => x.clientId !== g.clientId) ?? null); }}
                  className="h-10 px-3 rounded-xl border border-danger-line text-danger text-[13px] font-semibold">Disconnect</button>
              </div>
            ))
          ) : (
            <span className="text-[13px] text-muted">{grants ? "Nothing connected yet." : "Loading…"}</span>
          )}
          {MCP_URL && (
            <details className="pt-1">
              <summary className="text-[13px] font-semibold cursor-pointer">How to connect</summary>
              <ol className="mt-2 flex flex-col gap-1.5 text-[13px] text-[#3A3A40] list-decimal pl-5">
                <li><b className="font-semibold">Claude:</b> Settings › Connectors › Add custom connector, paste the URL below.</li>
                <li><b className="font-semibold">ChatGPT:</b> Settings › Apps › Create app (developer mode), paste the URL below, choose OAuth.</li>
                <li>Sign in with this email when asked and approve access.</li>
              </ol>
              <div className="mt-2 flex gap-2 items-center">
                <code className="flex-1 min-w-0 truncate text-xs bg-chalk rounded-lg px-2 py-2">{MCP_URL}</code>
                <button onClick={copy} className="h-9 px-3 rounded-lg bg-ink text-on-dark text-xs font-semibold flex-none">{copied ? "Copied" : "Copy"}</button>
              </div>
            </details>
          )}
        </>
      )}
    </Card>
  );
}

/** OAuth 2.1 consent screen: Supabase's authorization server sends ChatGPT/Claude users here. */
export function Consent() {
  const cloud = useCloud();
  const authorizationId = new URLSearchParams(window.location.search).get("authorization_id");
  const [details, setDetails] = useState<{ client: string; uri: string; scopes: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cloud.userId || !authorizationId || !supabase) return;
    let cancelled = false;
    const sb = supabase;
    (async () => {
      const { data, error: err } = await sb.auth.oauth.getAuthorizationDetails(authorizationId);
      if (cancelled) return;
      if (err || !data) return setError(err?.message ?? "This request has expired. Start connecting again from the AI app.");
      if ("redirect_url" in data && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      if ("client" in data) setDetails({ client: data.client.name, uri: data.client.uri, scopes: (data.scope ?? "").split(" ").filter(Boolean) });
    })();
    return () => { cancelled = true; };
  }, [cloud.userId, authorizationId]);

  const decide = async (approve: boolean) => {
    if (!supabase || !authorizationId) return;
    setBusy(true);
    const res = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
    if (res.error || !res.data?.redirect_url) {
      setBusy(false);
      setError(res.error?.message ?? "Something went wrong. Try connecting again.");
      return;
    }
    window.location.href = res.data.redirect_url;
  };

  return (
    <div className="min-h-[100dvh] bg-chalk text-ink font-sans flex justify-center">
      <div className="w-full max-w-[440px] flex flex-col gap-4 px-5 pt-10 pb-6">
        <span className="w-12 h-12 rounded-2xl bg-ink text-volt flex items-center justify-center"><Icon name="train" size={22} /></span>
        <h1 className="m-0 font-display text-[28px] font-semibold tracking-tightish">
          {details ? `Connect ${details.client} to ${BRAND.name}?` : `Connect to ${BRAND.name}`}
        </h1>
        {!authorizationId ? (
          <span className="text-sm text-muted">This link is missing its request. Start connecting again from ChatGPT or Claude.</span>
        ) : cloud.phase === "off" ? (
          <span className="text-sm text-muted">Accounts aren't set up on this build.</span>
        ) : !cloud.userId ? (
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-sm">Sign in to your {BRAND.name} account to continue.</span>
            <SignInForm />
          </Card>
        ) : error ? (
          <span className="text-sm text-danger" role="alert">{error}</span>
        ) : !details ? (
          <span className="text-sm text-muted">Loading…</span>
        ) : (
          <>
            <Card className="flex flex-col gap-2 p-4">
              <span className="text-sm font-semibold">{details.client} will be able to</span>
              <ul className="flex flex-col gap-1.5 text-[13px] text-[#3A3A40] list-disc pl-5">
                <li>see your program, today's session and progress</li>
                <li>log sets, check-ins, habits and measurements for you</li>
                <li>propose program changes (you see the change first)</li>
                <li>read and add to your coach memory</li>
              </ul>
              <span className="text-xs text-muted">Signed in as {cloud.email}. You can disconnect any time in You › Connected AI apps.</span>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={() => decide(false)} className="h-12 rounded-[14px] border border-hairline-strong text-sm font-semibold">Not now</button>
              <button disabled={busy} onClick={() => decide(true)} className="h-12 rounded-[14px] bg-ink text-volt text-sm font-semibold">Allow</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SUPPORT_TEXT = {
  no_server: "",
  no_browser: "This browser can't show notifications. Try Chrome, Edge, Firefox or Safari.",
  ios_install: "On iPhone, add LiftWise to your Home Screen first (Share › Add to Home Screen), then turn reminders on there.",
  blocked: "Notifications are blocked for this site. Allow them in your browser settings, then come back.",
} as const;

/** Training-day reminder for this device, sent by the server at the chosen local time. */
export function ReminderCard() {
  const cloud = useCloud();
  const [time, setTime] = useState("18:00");
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const support = reminderSupport();

  useEffect(() => {
    if (!cloud.userId || support !== "ok") return;
    getReminder().then((t) => {
      setOn(!!t);
      if (t) setTime(t);
    }).catch(() => undefined);
  }, [cloud.userId, support]);

  if (support === "no_server") return null;
  const run = async (fn: () => Promise<string | null>, next: boolean) => {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    else setOn(next);
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">Workout reminders</span>
        <span className="text-xs text-muted">A nudge on training days, if you haven't logged the session yet. Rest days stay quiet.</span>
      </div>
      {!cloud.userId ? (
        <span className="text-[13px] text-muted">Sign in above to turn on reminders.</span>
      ) : support !== "ok" ? (
        <span className="text-[13px] text-[#3A3A40]">{SUPPORT_TEXT[support]}</span>
      ) : (
        <div className="flex gap-2 items-end">
          <label className="flex flex-col gap-1 text-xs text-muted flex-1">Remind me at
            <input type="time" value={time} step={900} onChange={(e) => {
              setTime(e.target.value);
              if (on && e.target.value) void run(() => enableReminder(e.target.value), true);
            }} className="h-11 px-3 rounded-xl border border-hairline-strong bg-surface text-sm text-ink" />
          </label>
          <button disabled={busy || !time} aria-pressed={on}
            onClick={() => (on ? run(disableReminder, false) : run(() => enableReminder(time), true))}
            className={`h-11 px-3.5 rounded-xl text-[13px] font-semibold disabled:opacity-40 ${on ? "border border-hairline-strong" : "bg-ink text-on-dark"}`}>
            {busy ? "…" : on ? "Turn off" : "Turn on"}
          </button>
        </div>
      )}
      {on && !error && <span className="text-xs text-muted" role="status">On for this device · {time}</span>}
      {error && <span className="text-xs text-danger" role="alert">{error}</span>}
    </Card>
  );
}
