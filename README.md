# OP Astro

Official Partner's starter for a website in [Lumos for Astro](https://lumosframework.com), reviewed in
[OP System](https://app.officialpartner.work). A new site starts as a copy of this repository: Lumos for Astro 1.0.0 as
its authors publish it, plus what OP System needs to show the site to the team and the client.

What this repository adds to Lumos for Astro (Oct 17, 2026; Sam: « allons-y avec tes recommandations »):

- `integrations/op-system.mjs`: after each build, `dist/site.json`, the manifest OP System reads (its contract:
  op-system's README, site.json). The pages come from the built HTML; the Web System from `src/styles/base.css` (each
  fluid token as its value at 320 px and at 1440 px, each colour, each theme's roles); the project from
  `op.config.json`. Nothing of it runs in the browser: OP System adds its own bridge to the pages through its proxy.
- `op.config.json`: the project's id, name, client, studio and description, its staging link if it has one,
  `systemPages` (the team's pages, shown under Système in OP System) and `live` (false until the launch: every build
  is kept out of search engines until then, `dist/_headers`).
- `wrangler.jsonc`: an assets-only Worker on Cloudflare, its workers.dev address, and a preview address for every
  branch but `main` (Worker Previews). `main` is the live site; `review` is the one OP System shows.
- `CLAUDE.md`: how Claude works here (the review branch, publishing only when asked, OP System's queue, the checks).
- French by default: `SITE_LOCALE` fr-CA, the page's `lang`, the menu, the 404 page and the skip link.

## Start a site

1. GitHub: on this repository, « Use this template » › « Create a new repository », in `official-partner`, named after
   the client (`client-web`, private). Or ask Claude to copy it into an empty repository.
2. Claude, in a session with the new repository: the project's id and names in `op.config.json`, the Worker's `name`
   in `wrangler.jsonc` (the id), `SITE_NAME` and `SITE_DESCRIPTION` in `src/consts.ts`; `npm ci`, `npm run check`,
   `npm run build`; a commit on `main`, then the branch `review` from it, both pushed.
3. Cloudflare (Workers & Pages › Create › Import a repository): the repository, build command `npm run build`, deploy
   command `npx wrangler deploy`. Then the Worker's Settings › Build › Branch control: « Enable Preview Builds » (the
   preview command stays `npx wrangler preview`). Push to `review` once: its address appears under the Worker's
   Previews (`review-<name>.<account>.workers.dev`).
4. OP System: « Nouveau projet », the site's address being the review address of step 3.

## Scripts

| Script            | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Starts the dev server                            |
| `npm run build`   | Builds the site to `dist/`, with its `site.json` |
| `npm run preview` | Serves the built site                            |
| `npm run check`   | Type-checks every `.astro` file                  |
| `npm run format`  | Formats the project with Prettier                |

Node 22.19 or newer is required.

## Lumos for Astro

The components, the styles, `LUMOS.md`, `AGENTS.md` and the skills in `.agents/skills/` are Lumos for Astro's, MIT
licensed, © 2026 Timothy Ricks (LICENSE). Its documentation: [lumosframework.com](https://lumosframework.com). Taken
from `lumosframework/lumos-for-astro` at 1.0.0 (commit 04795f8); an upgrade goes through the `lumos-upgrade-version`
skill. What OP changed in Lumos's own files, so an upgrade keeps it:

- `astro.config.mjs`: the OP System integration.
- `src/consts.ts`: French placeholders, `SITE_LOCALE` fr-CA, the components page out of search engines.
- `src/layouts/BaseLayout.astro`: `lang` from `SITE_LOCALE`.
- `src/components/global/Nav.astro`, `Footer.astro`, `SkipLink.astro`, `src/pages/404.astro`,
  `src/pages/example-components.astro`: their words in French.
- `wrangler.jsonc`: no custom domain, workers.dev and Worker Previews.
- `.github/`: Lumos's publishing workflows and README assets removed; Dependabot on `review`, monthly.
- `.gitattributes`: `wrangler.jsonc`, `.github` and `.gitattributes` kept in an archive of the starter (a site copied from
  it needs them).
