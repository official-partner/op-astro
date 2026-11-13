# OP System: the branches, the queue, a new site, going live

Read before a publish or a launch, a request from OP System's queue, a new site's setup, or a change to the pages or the tokens OP System shows. CLAUDE.md keeps the rule itself: work goes to `review`, `main` only when someone asks in so many words.

## Branches: review, then live
- `main` is the live site. Cloudflare builds and deploys it on every push: never push work to `main` directly.
- `review` is what the team and the client see in OP System. Cloudflare builds it at its own address
  (`review-<name>.<account>.workers.dev`, `<name>` being `name` in wrangler.jsonc). Work goes there: on `review`, or on
  a branch of its own merged into `review`.
- `review` goes to `main` (the site goes live, or a change reaches the live site) only when someone asks in so many
  words: « publie », « mets en ligne », « publish ». The team's « Mettre en ligne » in OP System is that ask: it comes
  from the queue as a request of kind `publish` (a change reaches the live site) or `launch` (the site goes live).
- OP System's « Mettre en ligne » does it itself, through its GitHub App, when the App is installed on this
  repository: `main` moved to the version the team saw on the staging, a fast-forward only; the launch writes
  `"domain"` and `"live": true` in op.config.json on `review` first. No request reaches Claude then.
- A request of kind `publish` or `launch` means the App could not: do it as the OP System connector's
  `get_guide("astro")` says (Live), the one source of these steps: the commits only (no clone, no npm, no build), the
  version the request names (`versions.review`), a fast-forward only, never forced; if `main` has a commit `review`
  lacks, stop, change nothing and say so in plain words. Then `add_journal`, one `reply` in one sentence, `finish_work`.
  Cloudflare builds `main` in about a minute and OP System checks the site itself: do not wait for it.
- Before the launch, op.config.json says `"live": false` and every build tells search engines to stay out
  (`dist/_headers`, noindex); `SITE_URL` (src/consts.ts) reads op.config.json's `domain`, a stand-in until it has one.

## OP System
- After each build, `integrations/op-system.mjs` writes `dist/site.json`: the project (op.config.json), the pages (their
  title and description, from the built HTML), the screens, the Web System (the tokens of `src/styles/base.css`, a
  fluid value as its two ends, at `--viewport-min` and `--viewport-max`; the `.text-style-*` classes) and the themes
  (their roles, as colour variables). OP System reads
  it through its proxy; it adds its own bridge to the pages, never this site. The build's last line says what it found
  (`site.json: N pages, N variables, N themes`): check it after a change to the pages or the tokens.
- A new page: a file in `src/pages/`, its title and description given to the layout. It shows in OP System at the next
  build of `review`. A page kept out of search engines: `NOINDEX_ROUTES` in src/consts.ts. The components page
  (`composantes`) and the team's own pages (op.config.json `systemPages`, « * » for any characters: a test page,
  a style sheet) are the system's: OP System shows them under Système. Keep those out of search engines too.
- A new token: in `system/site.json`, then `npm run system` (system/README.md), which writes `src/styles/base.css`
  as Lumos names them (`--x-min` and `--x-max` for a fluid one, a hex for a colour in `:root`, a theme's roles in its
  `.theme-*` class). Edits made in OP System's Variables come back as requests: change the system file, never
  base.css by hand, never `dist/`.
- Requests from OP System's queue come through the OP System connector: read `get_guide("queue")` and follow it. Here
  that means: `git checkout review && git pull --rebase`, the change in `src/`, `npm run check` and `npm run build`
  (both clean, the site.json line as expected), the pages looked at (Check what you changed), a line in PROJECT.md,
  commit, `git push` (Cloudflare builds `review` in about a minute), then `add_journal` for each change,
  `settle_comment` for each comment, one `reply` per request, and `finish_work` with `published: true`. Never `main`
  from the queue, except a request of kind `publish` or `launch` (Branches, above).
- A request of kind `setup` prepares a site OP System just made (« Un nouveau site »: Cloudflare's Deploy button copied
  this starter into the studio's GitHub, made the Worker and wrote its name in wrangler.jsonc). On `main`:
  op.config.json (`id`, `name`, `client`, `studio`, `description`), src/consts.ts (`SITE_NAME`, `SITE_DESCRIPTION`,
  `SITE_LOCALE`), `name` in wrangler.jsonc checked against the Worker's (set to it if it differs); `npm ci`, `npm run
  check`, `npm run build`, commit, push `main`. Then the branch `review` from `main`, pushed: its preview,
  `review-<worker>.<account>.workers.dev`, is what OP System shows. The only push to `main` that is not a publish.
