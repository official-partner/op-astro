# Decisions

One line per decision: the date, who asked, what was decided and why. The newest at the top.

- 2026-10-27, Sam (23:01, « vas-y », after Amélie Haeck: the « Grille » drew 12, 8 and 4 on a site of 7, the favicon
  and the SEO of the current site lost): `--site-columns` is the grid's only name, declared per screen in base.css
  (4, 8 and 12, Lumos's Grid breakpoints) beside the margin and the gutter; without it site.json's `grid.columns` is
  null (OP System says the site declares no grid), and the build warns on a page grid laid on another variable. A
  redo keeps the current site's icons (op.config.json `"favicon": "site"`, favicon.mjs leaves them), its SEO word for
  word (`seoTitle` on a layout, `seoTitle`, `seoDescription` and `ogImage` written in a collection's schema), its verification metas (`verification`) and
  its addresses (`redirects` written as 301s in dist/_redirects, `addresses` checked at the build).

- 2026-10-27, Sam (« Contenu » wave 1, GO; from the spike `live-staging-spike`, its report in op-system): the staging is
  live. Cloudflare's build of `review` (`WORKERS_CI_BRANCH`, or `OP_LIVE=1`) uses `@astrojs/cloudflare` 14.3.4 (pinned:
  14.4 asks for Astro 7.4; Astro stays 7.3.8 so main's output and Sani's version stay as they are; both move together
  later) and renders every page but the 404 on demand (integrations/op-live.mjs); main and every other branch build
  static, their files byte for byte as before (checked against main: index, 404, CSS, _headers, robots, sitemap).
  Pages read collections through `getItems()`/`getItem()` (src/utils/content.ts): OP's working copy on the staging
  (src/live.config.ts, made from content.config.ts's own `collections`, so a collection the app adds needs no other
  edit), the files elsewhere and whenever OP does not answer in 1.5 s; visible items only, sorted by `order`. Answers
  kept 2 s, read again at once on `?op-v` or `x-op-content-version`; a failure remembered 5 s; a wrong version costs
  one read; an item the schema refuses shows its file. Pictures in OP's storage only from `OP_STORAGE_ORIGINS`, with
  their size so nothing is fetched at render. The staging's pages get the static files' headers (noindex, the secure
  headers) and no-store. `<When>` (src/components/system/When.astro) for a field that may be empty, `data-op-when` and
  `data-op-field` for OP's bridge. The sample collection `team` (every field optional but `name`, `visible`, `order`,
  labels in French), its card `CardTeam` and the page `test-contenu` (out of search engines, under Système).
  Sam, 21:25: the app writes content.config.ts and the folders itself when the team adds a collection or a field, so
  content.config.ts keeps the simple form its parser reads and nothing else goes in it. `keep_vars` in wrangler.jsonc.

- 2026-10-27, Sam (15:28: « le nouveau site Astro peut créer ses propres global classes… pour la scalabilité »; OP's
  skills rewritten for Lumos for Astro the same day, op-system's docs/DECISIONS.md): a site's own global classes live
  in `src/styles/project.css`, imported in the patterns layer after Lumos's `patterns.css`, so a component's own CSS and
  the utilities still win over them and an upgrade of Lumos never touches them; each has a one-line comment that the
  build gives OP System (site.json `system.classes`: the components' classes by prefix, then the global ones, the
  project's first with their comment and their uses). Empty in the starter.

- 2026-10-27, Sam (night plan, Bloc 8d: « optimiser les documents pour Claude, sans perdre l'info importante »;
  decided by Claude overnight, Sam asleep): CLAUDE.md says each rule once and without its history: the dates and who
  asked left the rules whose date does not serve them (their history is in this file), « How to build with Lumos » and
  « Lumos for Astro is not Lumos for Webflow » point to AGENTS.md, which every session loads with CLAUDE.md and says
  both, and the pointer to op-system's README follows its move to `docs/` (`docs/bridge.md`, `op:reveal`). No rule
  changed: a script found every rule-like line of CLAUDE.md and AGENTS.md before in the two after (op-system's night
  report). AGENTS.md is Lumos's own file, as its authors publish it: unchanged.

- 2026-10-27, Sam (Oct 26: Lenis, page transitions with three simple presets or one Claude makes from an idea, a
  loading screen, each per project; decided by Claude overnight, Sam asleep): the finishing touches are op.config.json
  keys, each `false` or a preset: `loader` mark, counter or curtain (`true` stays the mark), `transition` fade, slide or
  curtain on Astro's own router (never Barba, which would fight it; `transitions: true` stays the slide),
  `smoothScroll` light, medium or strong (Lenis, loaded only where it runs: not with reduced motion, not on a touch
  screen unless `smoothScrollTouch`), and `custom` for the site's own file Claude makes. site.json announces each with
  the presets the site has, so OP System's « Expérience » can show, replay and ask for them. The curtain wears
  `.theme-brand`; the counter counts toward 90 while the page loads, then to 100. site.json no longer announces a
  transition only because PageTransitions.astro holds `<ClientRouter />`: the built pages say whether the router is on,
  and Lenis is listed among the libraries only where it runs. The Slider answers OP System's `op:reveal`.

- 2026-10-18, Sam (« est-ce que ça pourrait être plus rapide… aussi seamless que Webflow », then « go pour tout »): OP
  System's « Mettre en ligne » puts the site live itself through its GitHub App (main moved to the version seen on the
  staging, a fast-forward only), with a bar to the site itself; a request to Claude only when the App is not on the
  repository, done from the connector's guide (`get_guide("astro")`, Live), the one source of those steps. The launch
  writes `domain` and `live` in op.config.json, and `SITE_URL` reads `domain` from it.

- 2026-10-18, Sam: `npm run shot` (scripts/shot.mjs) takes the built pages as full-page PNGs at the widths asked, with
  no browser downloaded, and CLAUDE.md (Check what you changed) says which pages to look at by what changed, at the
  comment's width and at 390, before a change is called done. A session had lost three turns on its own screenshots
  (Playwright missing, a wrong first picture, a window too tall) and had not looked at the phone width.

- 2026-10-17, Sam (« je te fais confiance pour les décisions »): a new site starts from OP System's « Un nouveau site »
  (Cloudflare's Deploy button on this repository, which must be public for it; by hand until then), then a request of
  kind `setup` to Claude. The team's « Mettre en ligne » in OP System is the ask to publish (requests `publish` and
  `launch`, the only queue work that reaches `main`). Every build serves secure headers and fails when `dist/` holds a
  secret key, so a key never reaches the published site. Design and motion follow OP's craft (the connector's guides
  `direction` and `critique`, or OP's skills). Wrangler 4.135 at least, for `wrangler preview`.

- 2026-10-17, Sam (« un loading screen par projet et un langage de transition entre les pages, comme Barba, intégré
  dans l'UX de l'app »): every site has a loading screen and page transitions ready, both off until the team turns
  them on in op.config.json (`loader`, `transitions`), so OP System can show and replay them. The loading screen wears
  the site's mark on its ground, once per tab session; the transitions are Astro's view transitions (the page lifts
  away, the next one rises in, on the site's eases), a crossfade with reduced motion. Each is restyled per client.

- 2026-10-17, Sam: the starter wears OP System's look, not Lumos's (no Lumos logo, colours, cover or showcase page;
  the credit in README.md and LICENSE only). The swatches, themes and first page are replaced with the client's.
- 2026-10-17, Sam: the site starts from OP's starter `official-partner/op-astro` (Lumos for Astro 1.0.0). `main` is
  the live site, `review` the one OP System shows; content in files until a CMS is decided.
