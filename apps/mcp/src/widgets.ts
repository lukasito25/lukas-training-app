/**
 * Inline widgets rendered by ChatGPT (Apps SDK) and Claude / other MCP Apps hosts.
 * Self-contained HTML (no external scripts). Data arrives as the tool's structuredContent:
 *  - ChatGPT: window.openai.toolOutput (+ "openai:set_globals" events), window.openai.callTool
 *  - MCP Apps: JSON-RPC over postMessage (ui/initialize, ui/notifications/tool-result, tools/call)
 */

const BASE_CSS = `
:root{--bg:#F2F2EE;--surface:#FFFFFF;--ink:#111113;--muted:#6E6E76;--line:#E4E4DE;--volt:#D4F55A;--volt-ink:#2A3300;--dark:#141518;--on-dark:#F4F4F0}
@media (prefers-color-scheme: dark){:root:not([data-theme=light]){--bg:#0E0F11;--surface:#17181B;--ink:#F4F4F0;--muted:#A9A9B0;--line:#2A2B30}}
:root[data-theme=dark]{--bg:#0E0F11;--surface:#17181B;--ink:#F4F4F0;--muted:#A9A9B0;--line:#2A2B30}
*{box-sizing:border-box}html,body{margin:0;background:transparent;color:var(--ink);font:14px/1.4 Inter,system-ui,-apple-system,sans-serif}
.card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px}
.hero{background:var(--dark);color:var(--on-dark);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:4px}
.k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--volt);font-weight:600}
.t{font:600 20px/1.2 "Space Grotesk",Inter,system-ui,sans-serif;margin:0}
.s{font-size:12px;color:#A9A9B0}.m{color:var(--muted);font-size:12px}
.row{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.row:first-child{border-top:0}
.grow{flex:1;min-width:0}.name{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pill{font-size:12px;font-weight:600;padding:4px 8px;border-radius:999px;background:var(--bg);white-space:nowrap}
.done{background:var(--volt);color:var(--volt-ink)}
button{font:inherit;font-size:12px;font-weight:600;border:0;border-radius:10px;padding:8px 10px;background:var(--ink);color:var(--surface);cursor:pointer;min-height:36px}
button:disabled{opacity:.4;cursor:default}
.bar{height:6px;border-radius:3px;background:var(--line);overflow:hidden}.bar>i{display:block;height:6px;background:var(--ink)}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.stat{background:var(--bg);border-radius:12px;padding:8px 10px}
.stat b{font:600 18px "Space Grotesk",Inter,sans-serif;display:block}
.note{background:var(--bg);border-radius:10px;padding:8px 10px;font-size:12px}
`;

const BRIDGE = `
const lw = (() => {
  const oa = window.openai;
  let id = 0; const pending = new Map(); let onData = () => {};
  const send = (m) => window.parent.postMessage(m, "*");
  const rpc = (method, params) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); send({ jsonrpc: "2.0", id: i, method, params }); });
  window.addEventListener("message", (e) => {
    const m = e.data; if (!m || m.jsonrpc !== "2.0") return;
    if (m.id != null && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); return; }
    if (m.method === "ui/notifications/tool-result") onData(m.params && m.params.structuredContent);
    if (m.method === "ui/notifications/host-context-changed" && m.params && m.params.theme) document.documentElement.dataset.theme = m.params.theme;
  });
  return {
    start(cb) {
      onData = cb;
      if (oa) {
        if (oa.theme) document.documentElement.dataset.theme = oa.theme;
        cb(oa.toolOutput);
        window.addEventListener("openai:set_globals", () => cb(window.openai.toolOutput));
      } else {
        rpc("ui/initialize", { appInfo: { name: "LiftWise", version: "0.1.0" }, appCapabilities: {}, protocolVersion: "2026-01-26" })
          .then((r) => { const th = r && r.hostContext && r.hostContext.theme; if (th) document.documentElement.dataset.theme = th; send({ jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} }); })
          .catch(() => {});
      }
    },
    async call(name, args) {
      const r = oa ? await oa.callTool(name, args) : await rpc("tools/call", { name, arguments: args });
      return (r && (r.structuredContent || (r.result && r.result.structuredContent))) || null;
    },
    size() { const h = document.body.scrollHeight; if (!oa) send({ jsonrpc: "2.0", method: "ui/notifications/size-changed", params: { height: h } }); },
  };
})();
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kg = (n) => (Number.isInteger(n) ? n : n.toFixed(1));
`;

const TODAY_JS = `
const root = document.getElementById("app");
let state = null;
function firstReps(label) { const m = /^(\\d+)/.exec(label || ""); return m ? Number(m[1]) : null; }
function render(d) {
  if (!d || !d.exercises) { root.innerHTML = '<div class="card m">Loading your session…</div>'; return; }
  state = d;
  const head = '<div class="hero"><span class="k">' + esc(d.dayName) + ' · Week ' + d.week + ' · ' + esc(d.block) + (d.deload ? ' · Deload' : '') + '</span>' +
    '<p class="t">' + esc(d.training ? d.label + ': ' + d.title : d.title) + '</p>' +
    (d.training ? '<span class="s">' + d.workingSets + ' sets · ~' + d.estMinutes + ' min</span>' : '<span class="s">Recovery day</span>') + '</div>';
  const adj = d.adjustment ? '<div class="note">' + esc(d.adjustment) + '</div>' : '';
  const rows = d.exercises.map((e, i) => {
    const n = e.setsDone.length, full = n >= e.sets, reps = firstReps(e.reps);
    const canLog = !full && e.suggestedKg != null && reps != null;
    return '<div class="row"><div class="grow"><div class="name">' + esc(e.name) + '</div><div class="m">' + e.sets + ' × ' + esc(e.reps) + ' @ ' + e.rir + ' RIR' +
      (e.suggestedKg != null ? ' · ' + kg(e.suggestedKg) + ' kg' : '') + '</div></div>' +
      '<span class="pill ' + (full ? 'done' : '') + '">' + n + '/' + e.sets + '</span>' +
      (canLog ? '<button data-i="' + i + '" aria-label="Log a set of ' + esc(e.name) + ' at ' + kg(e.suggestedKg) + ' kg for ' + reps + '">+ ' + kg(e.suggestedKg) + '×' + reps + '</button>' : '') + '</div>';
  }).join("");
  root.innerHTML = '<div class="card">' + head + adj + (d.training ? '<div>' + rows + '</div>' : '') +
    '<span class="m">Tell me a different weight or reps and I\\'ll log that instead.</span></div>';
  root.querySelectorAll("button[data-i]").forEach((b) => b.addEventListener("click", async () => {
    const e = state.exercises[Number(b.dataset.i)]; b.disabled = true;
    try {
      await lw.call("log_set", { exercise: e.id, weight_kg: e.suggestedKg, reps: firstReps(e.reps), weekday: state.weekday });
      const fresh = await lw.call("get_today_workout", { weekday: state.weekday });
      if (fresh) render(fresh); else { e.setsDone.push({}); render(state); }
    } catch { b.disabled = false; }
  }));
  lw.size();
}
lw.start(render);
`;

const REVIEW_JS = `
const root = document.getElementById("app");
function render(d) {
  if (!d || !d.review) { root.innerHTML = '<div class="card m">Loading your week…</div>'; return; }
  const r = d.review, pct = r.setsPlanned ? Math.round(r.setsDone / r.setsPlanned * 100) : 0;
  const stats = [[r.sessionsDone + '/' + r.sessionsPlanned, 'sessions'], [String(r.newBests.length), 'new bests'], [pct + '%', 'sets done']]
    .map(([v, l]) => '<div class="stat"><b>' + v + '</b><span class="m">' + l + '</span></div>').join("");
  const bars = d.muscles.slice(0, 8).map((m) => '<div class="row"><span style="width:84px">' + esc(m.label) + '</span><div class="grow bar" role="img" aria-label="' + esc(m.label) + ': ' + m.done + ' of ' + m.planned + ' sets"><i style="width:' + Math.min(100, m.done / Math.max(1, m.planned) * 100) + '%"></i></div><span class="m" style="width:40px;text-align:right">' + m.done + '/' + m.planned + '</span></div>').join("");
  const bests = (d.newBests || []).slice(0, 3).map((b) => '<div><b>' + esc(b.name) + '</b> ' + kg(b.weightKg) + ' kg × ' + b.reps + '</div>').join("");
  root.innerHTML = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>Week ' + d.overallWeek + ' review' + (d.finished ? '' : ' · so far') + '</b><span class="m">' + esc(d.from) + '</span></div>' +
    '<div class="grid3">' + stats + '</div><div>' + bars + '</div>' + (bests ? '<div class="note">' + bests + '</div>' : '') + '</div>';
  lw.size();
}
lw.start(render);
`;

const page = (title: string, js: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${BASE_CSS}</style></head>` +
  `<body><div id="app"></div><script>${BRIDGE}${js}</script></body></html>`;

export const WIDGETS = {
  today: { title: "LiftWise · Today's workout", html: page("Today's workout", TODAY_JS) },
  review: { title: "LiftWise · Weekly review", html: page("Weekly review", REVIEW_JS) },
} as const;

export const widgetUri = (id: keyof typeof WIDGETS, flavor: "mcp" | "openai") =>
  flavor === "mcp" ? `ui://liftwise/${id}.html` : `ui://liftwise/${id}.skybridge.html`;
