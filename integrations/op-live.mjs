// The staging rendered on demand (OP_LIVE): every .astro page of src/pages/ but the 404 is rendered per request by
// the Worker, so a page reads OP's working copy of the collections (src/live.config.ts) as it is now; endpoints
// (robots.txt) and the 404 stay prerendered. Without OP_LIVE the site is static, as main always is.
//
// What it does in a live build:
// - site.json reads the pages' HTML (integrations/op-system.mjs): the site is first built statically into STATIC_DIR
//   (OP_LIVE=0), where op-system reads them (its pagesDir), and that build's stylesheets are copied beside the Worker's
//   files so the ones site.json names are served.
// - The Worker's generated config (dist/server/wrangler.json) loses wrangler.jsonc's assets.not_found_handling: with
//   it, Cloudflare answers a browser's navigation to a path that is not a file with the 404 page before the Worker
//   runs (« Sec-Fetch-Mode: navigate »), so no page rendered on demand would ever show. Astro renders its own 404.
// - The headers dist/_headers gives the static files (noindex, the secure headers) are given to the pages the Worker
//   renders too (src/middleware.ts, __OP_HEADERS__): Cloudflare applies _headers to static files only.
// Without OP_LIVE, a live build's redirect of wrangler to its generated config (.wrangler/deploy/config.json) is removed
// so a deploy stays assets-only.
//
// In every build, a Vite plugin lets src/live.config.ts read src/content.config.ts's collections (below).
import { rm, readdir, copyFile, access, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SECURE_HEADERS } from "./op-system.mjs";

export const STATIC_DIR = ".op-static";

// src/content.config.ts stays in the simple form OP System's « Contenu » reads and writes (one defineCollection per
// collection, a glob() loader, a z.object() with its .describe() labels, `collections` exported): the app writes it.
// src/live.config.ts builds the staging's live collections from that same `collections` export, so a collection added
// in Contenu is live with no other edit. Imported as it is, content.config would bring its loaders (node's fs, in a
// Worker) and astro:content (which imports the live config: a cycle). Read from the live config, its imports of
// astro:content and astro/loaders are replaced by stand-ins: defineCollection returns its argument, glob() and file()
// a description, reference() the id written as the files write it ({ collection, id } once read, as Astro gives it).
const SCHEMAS = "?op-schemas";
const STUB = "\0op-content-stub";
const STUB_CODE = `import { z } from "astro/zod";
export { z };
export const defineCollection = (c) => c;
export const glob = (o) => ({ op: "glob", ...o });
export const file = (f, o) => ({ op: "file", file: f, ...o });
export const reference = (collection) => z.string().transform((id) => ({ collection, id }));`;
function schemasPlugin(root) {
  const config = path.join(root, "src/content.config.ts");
  return {
    name: "op-live:schemas",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === STUB) return STUB;
      if (importer && /src[\\/]live\.config\.[mc]?[jt]s$/.test(importer.split("?")[0]) && /(^|\/)content\.config(\.ts)?$/.test(source)) return config + SCHEMAS;
    },
    async load(id) {
      if (id === STUB) return STUB_CODE;
      if (id !== config + SCHEMAS) return;
      const code = await readFile(config, "utf8").catch(() => "export const collections = {};");
      return code.replace(/(import\s+(?!type\b)[^;]*?from\s*)["'](astro:content|astro\/loaders|astro\/content\/config)["']/g, `$1"${STUB}"`);
    },
  };
}

/* the headers of a page the Worker renders: those of dist/_headers (op-system.mjs), always noindex on the staging, but
   those the site's own public/_headers names */
async function stagingHeaders(root) {
  const site = await readFile(path.join(root, "public/_headers"), "utf8").catch(() => "");
  const named = new Set([...site.matchAll(/^[ \t]+(?:!\s*)?([A-Za-z0-9-]+)\s*(?::|$)/gm)].map((m) => m[1].toLowerCase()));
  return [["X-Robots-Tag", "noindex, nofollow"], ...SECURE_HEADERS.filter(([n]) => !named.has(n.toLowerCase()))];
}

export default function opLive({ live }) {
  let root = "";
  let server = "";
  return {
    name: "op-live",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig }) => {
        const dir = fileURLToPath(config.root);
        updateConfig({
          vite: {
            plugins: [schemasPlugin(dir)],
            define: { __OP_HEADERS__: JSON.stringify(live ? await stagingHeaders(dir) : []) },
          },
        });
      },
      "astro:config:done": async ({ config }) => {
        root = fileURLToPath(config.root);
        server = fileURLToPath(config.build.server);
        if (!live && !process.env.OP_LIVE_INNER) await rm(path.join(root, ".wrangler/deploy/config.json"), { force: true });
      },
      "astro:route:setup": ({ route }) => {
        if (!live) return;
        const page = /^src\/pages\/.*\.astro$/.test(route.component);
        if (page && !/^src\/pages\/404\.astro$/.test(route.component)) route.prerender = false;
      },
      "astro:build:done": async ({ dir, logger }) => {
        if (!live) return;
        const generated = path.join(server, "wrangler.json");
        const worker = JSON.parse(await readFile(generated, "utf8"));
        if (worker.assets?.not_found_handling) {
          delete worker.assets.not_found_handling;
          await writeFile(generated, JSON.stringify(worker));
        }
        const started = Date.now();
        const out = path.join(root, STATIC_DIR);
        await rm(out, { recursive: true, force: true });
        const bin = path.join(root, "node_modules/astro/bin/astro.mjs");
        const run = spawnSync(process.execPath, [bin, "build", "--outDir", out], {
          cwd: root,
          env: { ...process.env, OP_LIVE: "0", OP_LIVE_INNER: "1" },
          encoding: "utf8",
        });
        if (run.status !== 0) throw new Error(`op-live: the static build for site.json failed\n${run.stdout}\n${run.stderr}`);
        const client = fileURLToPath(dir);
        const assets = path.join(out, "_astro");
        let copied = 0;
        for (const f of await readdir(assets).catch(() => [])) {
          if (!f.endsWith(".css")) continue;
          const to = path.join(client, "_astro", f);
          if (await access(to).then(() => true, () => false)) continue;
          await copyFile(path.join(assets, f), to);
          copied += 1;
        }
        logger.info(`staging rendered on demand; pages read from a static build (${STATIC_DIR}, ${Date.now() - started} ms, ${copied} stylesheets copied)`);
      },
    },
  };
}
