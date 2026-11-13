/**
 * One bridge for both widget hosts:
 *  - ChatGPT Apps SDK: window.openai (toolOutput, callTool, sendFollowUpMessage, openExternal, requestDisplayMode, setWidgetState)
 *  - MCP Apps (Claude and others): JSON-RPC over postMessage (ui/initialize, tools/call, ui/message, ui/open-link,
 *    ui/request-display-mode, ui/update-model-context, ui/notifications/*)
 * Every capability is feature-detected; callers check `can.*` and hide what the host doesn't support.
 */

type Json = Record<string, unknown>;
interface OpenAI {
  toolOutput?: Json | null;
  widgetState?: Json | null;
  theme?: "light" | "dark";
  displayMode?: string;
  callTool?: (name: string, args: Json) => Promise<unknown>;
  sendFollowUpMessage?: (a: { prompt: string }) => Promise<void>;
  openExternal?: (a: { href: string }) => void;
  requestDisplayMode?: (a: { mode: string }) => Promise<{ mode: string }>;
  setWidgetState?: (s: Json) => void;
}
declare global {
  interface Window { openai?: OpenAI }
}

export interface ToolCallError { message: string }

let rpcId = 0;
const pending = new Map<number, { res: (v: unknown) => void; rej: (e: unknown) => void }>();
let onData: (d: Json | null) => void = () => {};
let hostContext: Json = {};
let hostCaps: Json = {};
let mcpReady = false;

const oa = () => window.openai;
const post = (m: Json) => window.parent.postMessage(m, "*");
function rpc<T = unknown>(method: string, params: Json): Promise<T> {
  return new Promise((res, rej) => {
    const id = ++rpcId;
    pending.set(id, { res: res as (v: unknown) => void, rej });
    post({ jsonrpc: "2.0", id, method, params });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        rej({ message: "The app didn't respond. Try again." });
      }
    }, 30_000);
  });
}

function applyTheme(t: unknown) {
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
}

window.addEventListener("message", (e) => {
  const m = e.data as Json | null;
  if (!m || m.jsonrpc !== "2.0") return;
  if (typeof m.id === "number" && pending.has(m.id) && !m.method) {
    const p = pending.get(m.id)!;
    pending.delete(m.id);
    if (m.error) p.rej(m.error);
    else p.res(m.result);
    return;
  }
  const params = (m.params ?? {}) as Json;
  if (m.method === "ui/notifications/tool-result") onData((params.structuredContent as Json) ?? null);
  if (m.method === "ui/notifications/host-context-changed") {
    hostContext = { ...hostContext, ...params };
    applyTheme(params.theme);
    listeners.forEach((l) => l());
  }
});

const listeners = new Set<() => void>();
export const onHostChange = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export const host = {
  kind: (): "openai" | "mcp" => (oa() ? "openai" : "mcp"),

  start(cb: (d: Json | null) => void) {
    onData = cb;
    const o = oa();
    if (o) {
      applyTheme(o.theme);
      cb(o.toolOutput ?? null);
      let last = o.toolOutput;
      window.addEventListener("openai:set_globals", () => {
        const w = oa()!;
        applyTheme(w.theme);
        if (w.toolOutput !== last) {
          last = w.toolOutput;
          cb(w.toolOutput ?? null);
        }
        listeners.forEach((l) => l());
      });
      return;
    }
    rpc<Json>("ui/initialize", {
      appInfo: { name: "LiftWise", version: "0.2.0" },
      appCapabilities: {},
      protocolVersion: "2026-01-26",
    })
      .then((r) => {
        hostContext = (r?.hostContext as Json) ?? {};
        hostCaps = (r?.hostCapabilities as Json) ?? {};
        applyTheme(hostContext.theme);
        mcpReady = true;
        post({ jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} });
        listeners.forEach((l) => l());
      })
      .catch(() => undefined);
  },

  can: {
    fullscreen: () => {
      const o = oa();
      if (o) return !!o.requestDisplayMode;
      const modes = hostContext.availableDisplayModes as string[] | undefined;
      return mcpReady && (!modes || modes.includes("fullscreen"));
    },
    message: () => !!oa()?.sendFollowUpMessage || mcpReady,
    openLink: () => true,
  },

  displayMode: (): string => (oa()?.displayMode ?? (hostContext.displayMode as string) ?? "inline"),

  /** Calls a LiftWise tool and returns its structuredContent. Throws {message} on tool errors. */
  async call(name: string, args: Json = {}): Promise<Json> {
    const o = oa();
    const r = (o?.callTool ? await o.callTool(name, args) : await rpc("tools/call", { name, arguments: args })) as Json | null;
    const res = (r?.result as Json | undefined) ?? r ?? {};
    if (res.isError) {
      const content = (res.content as { text?: string }[] | undefined) ?? [];
      throw { message: content.map((c) => c.text).filter(Boolean).join(" ") || "That didn't work. Try again." } satisfies ToolCallError;
    }
    return (res.structuredContent as Json) ?? {};
  },

  /** Puts a user message into the chat so the model responds (e.g. "how did it feel"). */
  async say(text: string) {
    const o = oa();
    if (o?.sendFollowUpMessage) return o.sendFollowUpMessage({ prompt: text });
    await rpc("ui/message", { role: "user", content: [{ type: "text", text }] });
  },

  openLink(url: string) {
    const o = oa();
    if (o?.openExternal) return o.openExternal({ href: url });
    if (mcpReady) {
      rpc("ui/open-link", { url }).catch(() => window.open(url, "_blank", "noopener"));
      return;
    }
    window.open(url, "_blank", "noopener");
  },

  async fullscreen(on = true) {
    const mode = on ? "fullscreen" : "inline";
    const o = oa();
    if (o?.requestDisplayMode) return o.requestDisplayMode({ mode });
    return rpc("ui/request-display-mode", { mode });
  },

  /** Tells the model what the user is doing in the card (so "make it 80" in chat works). */
  context(summary: string, state: Json = {}) {
    const o = oa();
    if (o?.setWidgetState) {
      o.setWidgetState({ ...state, summary });
      return;
    }
    if (mcpReady && hostCaps.updateModelContext !== false) {
      rpc("ui/update-model-context", { content: [{ type: "text", text: summary }], structuredContent: state }).catch(() => undefined);
    }
  },

  savedState: (): Json => (oa()?.widgetState as Json) ?? {},

  resized() {
    if (oa()) return;
    post({ jsonrpc: "2.0", method: "ui/notifications/size-changed", params: { height: Math.ceil(document.documentElement.scrollHeight) } });
  },
};
