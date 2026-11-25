// The source markers of the staging (OP v2): each element a page shows knows the file and the place it was written
// in, so OP edits the site's own files with no selector and no mark written by hand. The marking itself is Stacki's
// (MIT, © 2026 Timothy Ricks: op-markers/LICENSE), bundled as it is in op-markers/stacki-markers.cjs by OP v2
// (official-partner/op-v2, scripts/build-markers.mts: bring a newer one from there, never edit it here). This file
// only hands Astro the marked copy of each .astro file as Vite loads it. Nothing is written to the project, and a
// build without OP_MARKERS=1 (the live site, and every site of OP v1) never loads it.
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

/** @returns {import("astro").AstroIntegration} */
export default function opMarkers({ on }) {
  return {
    name: "op-markers",
    hooks: {
      "astro:config:setup": ({ updateConfig, config }) => {
        if (!on) return;
        const { markSourceFile } = require("./op-markers/stacki-markers.cjs");
        const root = path.resolve(config.root instanceof URL ? config.root.pathname : String(config.root));
        updateConfig({
          vite: {
            plugins: [
              {
                name: "op-markers",
                apply: "build",
                enforce: "pre",
                load(id) {
                  if (id.includes("?")) return undefined;
                  const marked = markSourceFile(id, [root]);
                  return marked === undefined ? undefined : marked.code;
                },
              },
            ],
          },
        });
      },
    },
  };
}
