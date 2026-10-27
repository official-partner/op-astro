# A site in Lumos for Astro, reviewed in OP System

This repository is a website built by a studio with Lumos for Astro and reviewed in OP System
(https://app.officialpartner.work). It starts as a copy of Official Partner's starter, `official-partner/op-astro`
(README.md, Start a site). The site's own decisions are in PROJECT.md: search it before changing anything it may
cover. How to build with Lumos: AGENTS.md, below.

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
- Craft: design and motion follow OP's craft, the Craft section of the OP System connector's guides and
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

## The finishing touches: loading screen, page transitions, smooth scroll
- All three are off in the starter, each turned on per project. Each is one key of op.config.json, `false` or a
  preset, read by `src/utils/finishes.ts`:
  - `"loader"`: `"logo"` (the default: the site's logo revealed on the brand's ground, below), `"mark"` (the site's
    square mark on the page's ground), `"counter"` (a count to 100 at the foot of the screen, a line filling under
    it), `"curtain"` (the brand's ground lifting away whole), `"custom"`; `true` is `"logo"`
    (src/components/system/Loader.astro);
  - `"transition"`: `"fade"` (the page fades out, the next fades in), `"slide"` (the page lifts away a little, the
    next rises into place), `"curtain"` (the brand's ground rises over the page while the next one loads, then lifts
    away), `"custom"`; the older `"transitions": true` is `"slide"` (src/components/system/PageTransitions.astro, on
    Astro's `<ClientRouter />`: a page change no longer reloads the page; never Barba, which would fight Astro's router);
  - `"smoothScroll"`: `"light"`, `"medium"` or `"strong"` (how long the page glides after the wheel: Lenis's lerp,
    0.16, 0.1 and 0.065), `true` is `"medium"`; `"smoothScrollTouch": true` smooths a touch screen too, off by default
    (src/components/system/SmoothScroll.astro, Lenis, MIT).
  The next build carries them and site.json announces them (`motion`: each one's preset, and the presets the site
  has). OP System's « Expérience » (Web, under Système) shows them, replays them and asks Claude for a change. Turn
  one on only when the team asks for it, and log it in PROJECT.md.
- The logo loader (Sam, Oct 27: « prends le logo du site en SVG et anime-le », never the favicon's square mark):
  - the logo is `src/assets/logo/logo.svg`, inlined by Loader.astro, never `mark.svg` nor the favicon. Draw it in
    `fill="currentColor"` (or `stroke`) wherever it has the one colour, so it takes the ground's text colour; a logo of
    several colours keeps them, and its ground is then one they read on. No logo yet: the site's name rises instead.
  - the ground is a theme of base.css: op.config.json `"loaderTheme"` names it (the theme that carries the logo on the
    brand's colour, the one the nav or the footer uses on that ground), else `.theme-brand`, else the theme whose
    `--background` is the swatch of `brandColor`, else `.theme-dark`. Never the page's own ground by default: a white
    cover over a dark hero flashes.
  - the reveal: each shape of the SVG (`path`, `rect`, `polygon`...) is a part that rises into place through the
    logo's own box (a mask, never a fade), left to right by where it starts, `--loader-duration` x 1.2 on
    `--loader-ease`, 60 ms apart (the whole stagger 360 ms at most, however many shapes). It holds 150 ms once the last
    part is in, and until the page is ready; then the parts rise out and the ground lifts away whole
    (`--loader-duration` x 1.2), the page already in place under it: nothing under the cover moves. Its size is
    `--loader-logo-width` (default `clamp(8rem, 6rem + 10vw, 14rem)`), set in base.css when the logo needs another.
  - a logo whose shapes are many small pieces (a pictogram, outlined letters with counters) still reads: the parts are
    ordered by their first point, and the stagger shrinks to fit. A logo that should move otherwise (drawn as a line,
    its symbol before its name) is a `"custom"` loader, the team's words in the request.
- The loading screen covers the page from its first paint (its styles and a short script inline in the head, before
  the stylesheets), holds until the fonts are loaded and the first image in view and shown is decoded (an image in a
  closed menu is not waited for; 600 ms at least, 2.5 s at most: `MIN` and `MAX` in its script; the logo's reveal ends
  first; the counter reaches 100 then), then leaves. Once per tab session; `?op-loader`
  in the address plays it every time (OP System's replay). With reduced motion it does not play, unless asked with
  `?op-loader` (then it cuts). Without JS it never shows; if its script fails, its CSS takes it away after 3.5 s. While
  it covers the page, `<html>` has `data-loader="play"`, then `"leave"` as it goes: a page's opening waits for
  `op:loader-leave` on `document` when that attribute says `play`.
- The transitions: the nav holds still (`view-transition-name: site-nav`); with reduced motion fade and slide become a
  short crossfade and the curtain a cut; back and forward cut with the curtain (op-motion: they can be instant). The
  curtain keeps its element across pages (`transition:persist`) and swaps the page under it, at its top.
- The smooth scroll: never with reduced motion (it stops when the setting changes), and on a touch screen Lenis is not
  even loaded unless `smoothScrollTouch` says so; the browser's own scroll stays underneath (find in page, anchors,
  the keyboard). It starts once per visit and lives across pages with the transitions. A script that needs it waits
  for it with `onLenis((lenis) => …)` (`src/utils/smooth-scroll.ts`), never a global; a site that adds GSAP's
  ScrollTrigger calls `scrollTriggerWithLenis(gsap, ScrollTrigger)` once where it registers the plugin (GSAP from a CDN,
  `window.gsap` and `window.ScrollTrigger`, is found on its own). OP System's « Voir » sends `op:glide` on `document`:
  the page glides most of a screen down at the site's intensity.
- A custom one, made from the team's words (a request from « Expérience », « Demander à Claude »), follows OP's motion
  skill (`get_skill("op-motion")`: one job, transform and opacity, the named durations and eases of base.css, reduced
  motion, no layout shift) and lives in its own file, never in place of the presets:
  - `"loader": "custom"`: `src/components/system/LoaderCustom.astro`, the cover's content (inside `.loader_wrap.custom`,
    whose timing and states stay Loader.astro's), its styles in `<style is:global>` under `@layer components`, keyed on
    `html[data-loader="play"]` and `html[data-loader="leave"]`; its exit as CSS transitions or Web Animations on the
    cover's elements (the cover goes once they end, 2 s at most), started by `data-loader="leave"` or
    `op:loader-leave`; the site's logo from `src/assets/logo/logo.svg` when it shows one, never the favicon;
  - `"transition": "custom"`: `src/components/system/TransitionCustom.astro`, its styles scoped to
    `html[data-page-transition="custom"]` (`::view-transition-old(root)`, `::view-transition-new(root)`, the page
    tokens), and a script on Astro's router events when it covers the page (the curtain's way:
    `astro:before-preparation` and its `loader`, `astro:after-swap`), with a crossfade or a cut under reduced motion.
  Without its file a custom one falls back to the first preset (logo, slide). The timing of all of them is in
  `src/styles/base.css` (`--loader-duration`, `--loader-ease`, `--page-leave-duration`, `--page-leave-ease`,
  `--page-arrive-duration`, `--page-arrive-ease`): they show in OP System's Variables, under Mouvement.
- Check one: `npm run build` (its site.json `motion`), `npm run shot` on the home and another page (reduced motion: the
  page as it ends), and the motion itself frame by frame without reduced motion. The loader: `npm run shot -- / <a
  page> 1440 390 --loader` (every painted frame in `shots/loader/<page>-<width>/`, a contact sheet
  `shots/loader-<page>-<width>.png`, and its timeline: when it covers, on which ground, when it leaves and is gone, the
  layout shift). Read the sheets: the ground from the first painted frame (no white flash), the logo whole and sharp
  at its size, every part in before it leaves, it leaves well before 2.5 s on a fast page, the page under it already
  in place when it lifts (nothing moves after). The transition: a link followed, frame by frame. Nothing blocking
  the first paint.
- With the transitions on, a module script runs once per visit, not once per page. A component's script goes in
  `onPage((signal) => { … })` (`src/utils/page.ts`), never at the top level or on `DOMContentLoaded`; `signal` goes on
  its listeners to `document`, `window` or a media query, and stops its timers and observers. Every component's script
  does it already. After a page change, focus goes to `<main>` and Astro announces the page's title. A link that must
  load the page in full: `data-astro-reload`.
- OP System's review points at an element in a slide with `op:reveal` (op-system's `docs/bridge.md`): the starter's
  Slider goes to the slide that holds it (`src/utils/op-reveal.ts`). A component of the site's that hides content (a
  carousel, custom tabs) does the same on its own root.

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
- `npm run shot -- <page...> [width...]` takes each page at each width as a full-page PNG,
  `shots/<page>-<width>.png` (git-ignored): `accueil` (or `/`) for the home, another page by its route (`a-propos`,
  `coachs-fitness`), `404`, or `all`; 1440 and 390 when no width is given. It builds first when `dist/` is older than
  the sources (`--build` forces it), serves `dist/` itself, asks for reduced motion (the reveals in their final state)
  and waits for the fonts, the loading screen and the lazy images. It fails on a page missing from `dist/` or an error
  in the console, and prints them. About a second a shot. `--parts` adds the page in parts 1800 px high
  (`<page>-<width>-<n>.png`): a long PNG is shrunk when it is read, its parts are not. `--loader` takes the loading
  screen instead, frame by frame (The finishing touches, Check one).
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
- New CSS is the last resort (LUMOS.md, New style checklist).
- A treatment several of the site's components share (two declarations or more seen in three places: the same gap
  between an image and its caption, a rule with its space) is one of the project's global classes, in
  `src/styles/project.css` (the patterns layer), named for its job (no `_`, no `u-`, no `is-`), a one-line comment above
  it, its values from base.css's tokens; never a copy of the same rules in two components, never an edit of Lumos's
  `patterns.css` or `utilities.css`. OP's skill op-global-classes (`get_skill`) says when and how; site.json's
  `system.classes` shows each with its uses in OP System's Web System. Log each in PROJECT.md and DESIGN.md.
- Lumos for Astro is MIT, © 2026 Timothy Ricks (LICENSE): keep LICENSE as it is. An upgrade of Lumos goes through the
  `lumos-upgrade-version` skill.

@AGENTS.md
