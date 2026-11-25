// The source markers of the staging (OP v2): each element a page shows knows the file and the place it was written
// in, so OP edits the site's own files with no selector and no mark written by hand. The marking itself is Stacki's
// (MIT, © 2026 Timothy Ricks: op-markers/LICENSE), bundled as it is in op-markers/stacki-markers.cjs by OP v2
// (official-partner/op-v2, scripts/build-markers.mts: bring a newer one from there, never edit it here). This file
// only hands Astro the marked copy of each .astro file as Vite loads it. Nothing is written to the project, and a
// build without them (the live site always: markersOn, below) never loads it.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

function buildCommit(root) {
  const said = process.env.WORKERS_CI_COMMIT_SHA || "";
  if (/^[0-9a-f]{40}$/.test(said)) return said;
  try {
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha : "";
  } catch {
    return "";
  }
}

/**
 * Whether this build carries the markers. A staging does: Cloudflare's build of any branch but main (it says the
 * branch, WORKERS_CI_BRANCH), with nothing to set in Cloudflare, so a variable there can never mark the live site by
 * mistake. By hand, OP_MARKERS=1. OP_MARKERS=0 turns them off on a branch. The live site (main) never has them,
 * whatever is set.
 */
export function markersOn(env = process.env) {
  const branch = env.WORKERS_CI_BRANCH || "";
  if (branch === "main") return false;
  if (env.OP_MARKERS === "0") return false;
  if (env.OP_MARKERS === "1") return true;
  return branch !== "";
}

/** @returns {import("astro").AstroIntegration} */
export default function opMarkers({ on }) {
  return {
    name: "op-markers",
    hooks: {
      "astro:config:setup": ({ updateConfig, injectScript, config }) => {
        if (!on) return;
        const { markSourceFile } = require("./op-markers/stacki-markers.cjs");
        const root = path.resolve(config.root instanceof URL ? config.root.pathname : String(config.root));
        // Every page says the commit it was built from (window.opBuild): OP states a change against that commit's
        // files, whatever it last read of site.json. Cloudflare's build says it; a build by hand asks git.
        const build = buildCommit(root);
        if (build) injectScript("head-inline", `window.opBuild=${JSON.stringify(build)};`);
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
