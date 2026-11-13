/**
 * The LiftWise card app rendered inline by ChatGPT (Apps SDK) and Claude / other MCP Apps hosts.
 * Source: apps/mcp/widget (Preact). Built into one HTML string by scripts/build-widget.mjs.
 * Every tool with `widget: "app"` returns structuredContent with a `view` field that picks the screen.
 */
import { WIDGET_HTML } from "./widget.generated";

export const WIDGETS = {
  app: { title: "LiftWise", html: WIDGET_HTML },
} as const;

export const widgetUri = (id: keyof typeof WIDGETS, flavor: "mcp" | "openai") =>
  flavor === "mcp" ? `ui://liftwise/${id}.v2.html` : `ui://liftwise/${id}.v2.skybridge.html`;
