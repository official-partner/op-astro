// @ts-check
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE_NAME, SITE_URL, SITE_LOCALE } from "./src/consts.ts";
import { isNoindexRoute } from "./src/utils/seo.ts";
import opSystem from "./integrations/op-system.mjs";
import opLive, { STATIC_DIR } from "./integrations/op-live.mjs";

// The staging (branch review) is rendered on demand by a Worker and reads OP's working copy of the collections;
// main, and any build without it, stays static. OP_LIVE=1 or 0 decides; unset, Cloudflare's build of review is live.
const LIVE = process.env.OP_LIVE ? process.env.OP_LIVE === "1" : process.env.WORKERS_CI_BRANCH === "review";
const cloudflare = LIVE ? (await import("@astrojs/cloudflare")).default : null;
// where OP keeps a picture added in Contenu until it is committed: the staging may show it (OP_STORAGE_ORIGINS, a
// comma-separated list of origins; by default OP's Supabase Storage)
const STORAGE = (process.env.OP_STORAGE_ORIGINS || "https://*.supabase.co").split(",").map((o) => {
  const u = new URL(o.trim().replace("*.", "wildcard."));
  return { protocol: u.protocol.slice(0, -1), hostname: u.hostname.replace(/^wildcard\./, "**."), ...(u.port ? { port: u.port } : {}) };
});

export default defineConfig({
  site: SITE_URL,
  ...(cloudflare
    ? {
        // images: the build's own files as they are on the staging (no Images binding); main optimizes them
        adapter: cloudflare({ imageService: "passthrough" }),
        // no sessions: no KV namespace to provision for the staging
        session: false,
        image: { remotePatterns: STORAGE },
      }
    : {}),
  // OP's working copy, read by the staging at runtime (src/utils/content-loader.ts): « secret » is astro:env's
  // runtime kind (a « public » server variable is written into the build); the Worker's vars and secrets give them
  env: {
    schema: {
      OP_CONTENT_URL: envField.string({ context: "server", access: "secret", optional: true }),
      OP_PROJECT: envField.string({ context: "server", access: "secret", optional: true }),
      OP_CONTENT_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
      OP_CONTENT_TTL: envField.number({ context: "server", access: "secret", default: 500 }),
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !isNoindexRoute(new URL(page).pathname),
    }),
    opLive({ live: LIVE }),
    // site.json for OP System, beside the pages (integrations/op-system.mjs)
    opSystem({ siteName: SITE_NAME, siteUrl: SITE_URL, locale: SITE_LOCALE, pagesDir: LIVE ? STATIC_DIR : undefined }),
  ],
  vite: {
    define: { __OP_LIVE__: JSON.stringify(LIVE) },
    build: { cssTarget: "safari15.4" },
  },
});
