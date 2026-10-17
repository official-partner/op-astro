// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE_NAME, SITE_URL, SITE_LOCALE } from "./src/consts.ts";
import { isNoindexRoute } from "./src/utils/seo.ts";
import opSystem from "./integrations/op-system.mjs";

export default defineConfig({
  site: SITE_URL,
  integrations: [
    sitemap({
      filter: (page) => !isNoindexRoute(new URL(page).pathname),
    }),
    // site.json for OP System, beside the pages (integrations/op-system.mjs)
    opSystem({ siteName: SITE_NAME, siteUrl: SITE_URL, locale: SITE_LOCALE }),
  ],
  fonts: [
    {
      name: "Inter",
      cssVariable: "--font-inter",
      provider: fontProviders.local(),
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/inter-regular.woff2"],
          },
        ],
      },
    },
  ],
  vite: { build: { cssTarget: "safari15.4" } },
});
