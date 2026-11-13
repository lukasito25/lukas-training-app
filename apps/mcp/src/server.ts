import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runTool, SERVER_INSTRUCTIONS, TOOLS, type Ctx } from "./tools";
import { WIDGETS, widgetUri } from "./widgets";

export const SERVER_INFO = { name: "liftwise", title: "LiftWise: AI Strength & Physique Coach", version: "0.1.0" };

/** One MCP server per request, bound to the signed-in user's data (stateless transport). */
export function buildServer(ctx: Ctx): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: SERVER_INSTRUCTIONS });

  for (const [id, w] of Object.entries(WIDGETS) as [keyof typeof WIDGETS, (typeof WIDGETS)[keyof typeof WIDGETS]][]) {
    const meta = {
      ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: [] } },
      "openai/widgetDescription": w.title,
      "openai/widgetPrefersBorder": false,
    };
    // MCP Apps (Claude and other hosts).
    server.registerResource(`${id}-widget`, widgetUri(id, "mcp"), { title: w.title, mimeType: "text/html;profile=mcp-app" }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/html;profile=mcp-app", text: w.html, _meta: meta }],
    }));
    // ChatGPT Apps SDK.
    server.registerResource(`${id}-widget-openai`, widgetUri(id, "openai"), { title: w.title, mimeType: "text/html+skybridge" }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/html+skybridge", text: w.html, _meta: meta }],
    }));
  }

  for (const def of TOOLS) {
    const _meta: Record<string, unknown> = {};
    if (def.widget) {
      _meta.ui = { resourceUri: widgetUri(def.widget, "mcp") };
      _meta["openai/outputTemplate"] = widgetUri(def.widget, "openai");
      _meta["openai/widgetAccessible"] = true;
    }
    _meta["openai/toolInvocation/invoking"] = `${def.title}…`;
    _meta["openai/toolInvocation/invoked"] = def.title;

    server.registerTool(
      def.name,
      {
        title: def.title,
        description: def.description,
        inputSchema: def.input,
        annotations: {
          title: def.title,
          readOnlyHint: def.readOnly,
          destructiveHint: def.destructive ?? false,
          idempotentHint: def.idempotent ?? def.readOnly,
          openWorldHint: false,
        },
        _meta,
      },
      async (args: unknown) => {
        const started = Date.now();
        const r = await runTool(def, args, ctx);
        console.log(JSON.stringify({ level: "info", tool: def.name, ok: !r.isError, ms: Date.now() - started, source: ctx.source }));
        return { content: [{ type: "text" as const, text: r.text }], structuredContent: r.data, isError: r.isError };
      },
    );
  }
  return server;
}
