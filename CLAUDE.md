# A site in Lumos for Astro, reviewed in OP System

This repository is a website built by a studio with Lumos for Astro and reviewed in OP System
(https://app.officialpartner.work). It starts as a copy of Official Partner's starter, `official-partner/op-astro`
(README.md, Start a site). The site's own decisions are in PROJECT.md: search it before changing anything it may
cover. How to build with Lumos: AGENTS.md and LUMOS.md, and the skills in `.agents/skills/` (loaded from
`.claude/skills/`).

## Working here
- Answer in the studio's language (French at Official Partner). Code, comments and the docs are in English; the site's
  copy is in the client's language.
- Never write the dollar sign in a reply: write "dollars" or "k".
- Be direct and back opinions with numbers or checks. Say what you did not verify.
- Never write to Webflow, Figma, Sanity or any client system unless asked in so many words. Read only.
- The site's copy: plain, written like a person: no slogans, no rhythmic triplets, no exclamation marks, no em dashes.
  The client's copy is kept word for word unless it has an error; flag errors in PROJECT.md.
- Log every decision in PROJECT.md with the date and who asked.
- Grep a long file (PROJECT.md, README.md, base.css, a large component) before reading it whole; read the part the
  change touches.
- Craft (Sam, Oct 17): design and motion follow OP's craft, the Craft section of the OP System connector's guides and
  its guides `direction` and `critique` (`get_guide`), or OP's skills op-design-direction, op-motion and op-critique
  when the session has them. Anything that builds or changes a page, a section or a component follows it; a new page
  gets a critique pass (`get_guide("critique")`) before the team sees it.

## Branches: review, then live
- `main` is the live site. Cloudflare builds and deploys it on every push: never push work to `main` directly.
- `review` is what the team and the client see in OP System. Cloudflare builds it at its own address
  (`review-<name>.<account>.workers.dev`, `<name>` being `name` in wrangler.jsonc). Work goes there: on `review`, or on
  a branch of its own merged into `review`.
- `review` goes to `main` (the site goes live, or a change reaches the live site) only when someone asks in so many
  words: « publie », « mets en ligne », « publish ». The team's « Mettre en ligne » in OP System is that ask: it comes
  from the queue as a request of kind `publish` (a change reaches the live site) or `launch` (the site goes live).
- Since Oct 18, OP System's « Mettre en ligne » does it itself, through its GitHub App, when the App is installed on
  this repository: `main` moved to the version the team saw on the staging, a fast-forward only; the launch writes
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
- A new token: in `src/styles/base.css`, as Lumos names them (`--x-min` and `--x-max` for a fluid one, a hex for a
  colour in `:root`, a theme's roles in its `.theme-*` class). Edits made in OP System's Variables come back as
  requests: change the token here, never `dist/`.
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

## The look, the logo and the favicon
- The starter wears OP System's look (README.md, What this repository adds): a new site replaces the swatches and the
  themes of `src/styles/base.css` with the client's (same token names), and `src/pages/index.astro` with its own home
  page (then `src/components/system/StarterHome.astro` goes). Nothing of Lumos's own look comes back: no Lumos logo,
  colour or showcase page; its credit stays in README.md and LICENSE only.
- The client's logo goes in `src/assets/logo/logo.svg`: the nav and the footer show it in place of the site's name.
- Logo and favicon: when a client's logo is added, draw `src/assets/logo/mark.svg` from the logo's first letter: that
  letter's own path cut out of the logo's SVG (never a letter set in a font), centred on a square of the brand's main
  colour (a `viewBox` square, the colour edge to edge, the letter about 42 % of the square's height, as OP System's own
  mark: 13.5 of 32), in the colour the logo uses on that ground. Set `brandColor` in op.config.json to the same colour,
  run `npm run favicon` (it writes `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png` and, unless one was
  made by hand, `og-image.jpg`), look at the result, commit them with the mark. A site with no logo yet: its initial
  (SITE_NAME) on OP's ink, which `prebuild` keeps up to date when the name or `brandColor` changes. A favicon or a
  social image made by hand is never replaced by the build.

## Loading screen and page transitions
- Both are off in the starter. In op.config.json, `"loader": true` turns on the loading screen
  (`src/components/system/Loader.astro`) and `"transitions": true` the page transitions
  (`src/components/system/PageTransitions.astro`, Astro's `<ClientRouter />`: a page change no longer reloads the
  page). The next build carries them; OP System reads them from site.json (`motion`): its « Chargement » replays the
  loading screen, and the transition shows when moving between pages. Turn one on only when the team asks for it, and
  log it in PROJECT.md.
- The loading screen covers the page from its first paint (its styles and a short script inline in the head, before
  the stylesheets), holds until the fonts are loaded and the first image in view is decoded (600 ms at least, 2.5 s at
  most: `MIN` and `MAX` in its script), then leaves. Once per tab session; `?op-loader` in the address plays it every
  time (OP System's replay). With reduced motion it does not play, unless asked with `?op-loader` (then it cuts).
  Without JS it never shows; if its script fails, its CSS takes it away after 3.5 s. While it covers the page,
  `<html>` has `data-loader="play"`, then `"leave"` as it goes: a page's opening waits for `op:loader-leave` on
  `document` when that attribute says `play`.
- For a client, restyle it in place: the cover's markup and CSS in Loader.astro (its ground is the page's
  `--background`, a theme class on `.loader_wrap` changes it; the mark is `src/assets/logo/mark.svg`, else the
  favicon), its timing in `src/styles/base.css` (`--loader-duration`, `--loader-ease`). The transition: its keyframes
  in PageTransitions.astro, its timing in base.css (`--page-leave-duration`, `--page-leave-ease`,
  `--page-arrive-duration`, `--page-arrive-ease`). The durations show in OP System's Variables, under Mouvement.
- With the transitions on, a module script runs once per visit, not once per page. A component's script goes in
  `onPage((signal) => { … })` (`src/utils/page.ts`), never at the top level or on `DOMContentLoaded`; `signal` goes on
  its listeners to `document`, `window` or a media query, and stops its timers and observers. Every component's script
  does it already. After a page change, focus goes to `<main>` and Astro announces the page's title. A link that must
  load the page in full: `data-astro-reload`.

## Lists for OP System's Modifier
- OP System's tool Modifier lets the team and the client duplicate, delete and move a list's items on the review
  (op-system's README, Lists, Oct 20). It only touches the lists the site marks, never guessed: mark a list of
  content where it is used, never in the base components. On the list, `data-op-list="<name>"` and
  `data-op-source="<where the items come from>"` (`astro:<collection>` for a content collection, `page` for items
  written in the page, a file's path for a data file); on each item, `data-op-item` (empty, or the entry's id). The
  items are the list's direct children. Optional: `data-op-min` (1 by default: the last item is never deleted),
  `data-op-max`, `data-op-label` (its name in the Journal).
- `<Grid>` and `<Accordion>` pass these attributes to their root: `<Grid data-op-list="coachs"
  data-op-source="astro:coachs">`, with `data-op-item` on each `<Card>` or `<AccordionItem>`.
- Mark lists of content only (cards, team members, questions, testimonials, offers). Never a layout or the site's
  frame: tabs, a marquee, the nav, the footer. A `<Slider>` is not marked until its script reads its slides again
  after a change (a duplicated slide would not slide).
- What Modifier changed is published in OP System and comes back as requests from its queue: carry it into the
  source (the collection's entry, the page, the file) as the request says.

## The components page
- `src/pages/composantes.astro` (« Composantes », under Système in OP System) shows the components made for this site,
  never Lumos's base ones: every file of `src/components/content/` and `src/components/section/` is listed by
  itself. Each custom component gets its sample there when it is made, in the same commit:
  `<ComponentSample file="content/HeroBlog.astro" note="…"><HeroBlog …sample props /></ComponentSample>` inside
  `<ComponentList>`, with the client's copy or a plausible stand-in, never lorem ipsum. A component without one shows
  under « Sans exemple ».

## Security (every build, `integrations/op-system.mjs`)
- The build fails when `dist/` holds a secret key (a private key; an AWS, GitHub, Stripe live, Slack, OpenAI,
  Anthropic, Resend or Supabase secret key; a service_role JWT), naming the file and the kind, never the value:
  Cloudflare then deploys nothing. Never commit a key or put one in `src/`, `public/` or op.config.json: a key the site
  needs lives in Cloudflare (the Worker's Variables and Secrets), read by server code only. A Google API key only warns
  (a browser key, public by design: restricted to the site's domain).
- `dist/_headers` gives every file nosniff, a referrer policy, no camera, microphone or location, frames from the same
  site only and HSTS for a year (no subdomains). A page that needs one otherwise (a map asking for the location, a site
  framed elsewhere): that header in `public/_headers`, which the build then leaves to it. OP System's proxy drops the
  frame and HSTS headers for the review.

## Build and check
- `npm ci` once, then `npm run dev` (http://localhost:4321), `npm run check` (types), `npm run build` (`dist/` and its
  site.json). Node 22.19 or newer.
- A page or a component changed: look at it (Check what you changed, below).
- Content lives in files by default: in the page, or in an Astro content collection (`src/content/`). A CMS (Sanity)
  only when the client must edit the site alone, decided with the team and logged in PROJECT.md.

## Check what you changed
- `npm run shot -- <page...> [width...]` (Sam, Oct 18) takes each page at each width as a full-page PNG,
  `shots/<page>-<width>.png` (git-ignored): `accueil` (or `/`) for the home, another page by its route (`a-propos`,
  `coachs-fitness`), `404`, or `all`; 1440 and 390 when no width is given. It builds first when `dist/` is older than
  the sources (`--build` forces it), serves `dist/` itself, asks for reduced motion (the reveals in their final state)
  and waits for the fonts, the loading screen and the lazy images. It fails on a page missing from `dist/` or an error
  in the console, and prints them. About a second a shot. `--parts` adds the page in parts 1800 px high
  (`<page>-<width>-<n>.png`): a long PNG is shrunk when it is read, its parts are not.
- After a change: the page at the comment's width (else 1440) and at 390, `npm run shot -- coachs-fitness 1300 390`.
- Which pages, by what changed: a page's own section or copy, that page; a shared component, the nav, the footer, a
  token or a theme, the home and two other pages that show it, plus `composantes`; the layout (`src/layouts/`,
  `BaseHead`, the loading screen, the transitions), `404` too.
- Look at the PNGs (Read them; the parts for a detail) before saying it is done, and say in the reply which pages, at
  which widths, were looked at.
- No browser is downloaded: `SHOT_BROWSER` (a Chrome or Chromium executable), else Playwright's browsers already
  installed (`PLAYWRIGHT_BROWSERS_PATH`: /opt/pw-browsers in Claude's cloud sessions), else Google Chrome. Without any,
  it says what to install.

## Lumos
- Lumos for Astro is not Lumos for Webflow: its conventions are LUMOS.md's. New CSS is the last resort (LUMOS.md, New
  style checklist).
- Lumos for Astro is MIT, © 2026 Timothy Ricks (LICENSE): keep LICENSE as it is. An upgrade of Lumos goes through the
  `lumos-upgrade-version` skill.

@AGENTS.md
