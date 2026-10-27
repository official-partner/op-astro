// The staging rendered on demand (OP_LIVE): every .astro page of src/pages/ but the 404 is rendered per request by
// the Worker, so a page reads OP's working copy of the collections (src/live.config.ts) as it is now; endpoints
// (robots.txt) and the 404 stay prerendered.
// OP System's site.json reads the pages' HTML (integrations/op-system.mjs): a live build first builds the site
// statically into STATIC_DIR (OP_LIVE=0), where op-system reads them (its pagesDir), and copies that build's
// stylesheets beside its own so the ones site.json names are served.
// The Worker's generated config (dist/server/wrangler.json) loses wrangler.jsonc's assets.not_found_handling: with it,
// Cloudflare answers a browser's navigation to a path that is not a file with the 404 page, before the Worker runs
// (wrangler dev: « Sec-Fetch-Mode: navigate header present - using not_found_handling behavior »), so no page rendered
// on demand would ever show. Without it, the Worker renders the page, and Astro its 404.
// Without OP_LIVE the site is static as before, and a live build's redirect of wrangler to its generated config
// (.wrangler/deploy/config.json) is removed so a deploy stays assets-only.
import { rm, readdir, copyFile, access, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const STATIC_DIR = ".op-static";

// src/live.config.ts validates OP's working copy with the schemas of src/content.config.ts, which stays as Contenu
// reads and writes it. Imported as it is, it would bring its loaders (node's fs, in a Worker) and astro:content (which
// imports the live config: a cycle). From the live config it is read with those imports replaced by stand-ins
// (defineCollection returns its argument, glob() and file() nothing), so only its schemas are left.
const SCHEMAS = "?op-schemas";
const STUB = "\0op-content-stub";
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
      if (id === STUB) return "export const defineCollection = (c) => c; export const glob = () => ({}); export const file = () => ({});";
      if (id !== config + SCHEMAS) return;
      const code = await readFile(config, "utf8");
      return code.replace(/(import\s+(?!type\b)[^;]*?from\s*)["'](astro:content|astro\/loaders|astro\/content\/config)["']/g, `$1"${STUB}"`);
    },
  };
}

export default function opLive({ live }) {
  let root = "";
  let server = "";
  return {
    name: "op-live",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        updateConfig({ vite: { plugins: [schemasPlugin(fileURLToPath(config.root))] } });
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
        logger.info(`pages read from a static build (${STATIC_DIR}, ${Date.now() - started} ms, ${copied} stylesheets copied)`);
      },
    },
  };
}
