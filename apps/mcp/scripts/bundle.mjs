// Bundles the connector into .deploy/ (one self-contained function + Vercel config) so it can be
// deployed without the monorepo: `npm run bundle && cd .deploy && vercel deploy --prod`.
import { build } from "esbuild";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const out = new URL("../.deploy/", import.meta.url);
await rm(new URL("api/", out), { recursive: true, force: true }); // keep .vercel (project link)
await mkdir(new URL("api/", out), { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL("../api/index.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("api/index.mjs", out)),
  bundle: true, platform: "node", target: "node22", format: "esm", minify: true, sourcemap: false, legalComments: "none",
  // Some CommonJS deps call require(); give the ESM bundle one.
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
await writeFile(new URL("vercel.json", out), JSON.stringify({
  rewrites: [{ source: "/(.*)", destination: "/api" }],
  functions: { "api/index.mjs": { maxDuration: 30 } },
}, null, 2));
await writeFile(new URL("package.json", out), JSON.stringify({ name: "liftwise-mcp", private: true, type: "module", engines: { node: "22.x" } }, null, 2));
console.log("bundled → .deploy/");
