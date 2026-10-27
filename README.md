# OP Astro

Official Partner's starter for a website in [Lumos for Astro](https://lumosframework.com), reviewed in
[OP System](https://app.officialpartner.work). A new site starts as a copy of this repository: Lumos for Astro 1.0.0 as
its authors publish it, plus what OP System needs to show the site to the team and the client.

What this repository adds to Lumos for Astro (Oct 17, 2026; Sam: « allons-y avec tes recommandations »):

- `integrations/op-system.mjs`: after each build, `dist/site.json`, the manifest OP System reads (its contract:
  op-system's README, site.json). The pages come from the built HTML; the Web System from `src/styles/base.css` (each
  fluid token as its value at 320 px and at 1440 px, each colour, each theme's roles); the project from
  `op.config.json`. Nothing of it runs in the browser: OP System adds its own bridge to the pages through its proxy.
  Its `motion` says what OP System can show of the site's finishing touches (Oct 27, 2026): `{ loader: { name,
  preset } | null, transition: { name, kind: "view-transitions", preset } | null, smoothScroll: { name, library:
  "lenis", intensity, touch } | null, presets: { loader, transition, smoothScroll } }`, each `null` unless
  op.config.json turns it on (`loader`, `transition`, `smoothScroll`; the transition also when the built pages carry
  Astro's router), `presets` what the site has (the starter's three of each, and `custom` when the site has its own
  file). OP System's « Expérience » shows them and replays them: the loading screen by loading the home page with
  `?op-loader`, the transition by following a link of the page, the smooth scroll with `op:glide`. Beside it: the tints the themes use (each
  colour's `derived`, with the CSS it is written with), the layout grid (`grid`: `--site-margin`, `--site-gutter`, and
  `--site-columns` per screen when the site names them, else 12, 8 and 4), the curves (`eases`, from `--ease-*`), the
  libraries the site loads (`libraries`: its packages, the GSAP plugins it imports or loads from a CDN, Astro's
  router), its favicon (`favicon`). OP System's settings list the libraries and the favicon (Technique) and turn a
  change into a request to Claude. The same integration writes `dist/_headers` and stops a build that holds a secret
  key (Security, below; Oct 17, 2026, Sam).
- `op.config.json`: the project's id, name, client, studio and description, its staging link if it has one,
  `brandColor` (the ground of the favicon until the site has its logo's mark; OP's ink by default), `systemPages`
  (the team's pages, shown under Système in OP System), `designWidth` (the width the design is drawn at, when values
  follow the screen's width; 1440 by default), `domain` (the client's domain, empty until the launch: `SITE_URL` reads
  it) and `live` (false until the launch: every build is kept out of search engines until then, `dist/_headers`; OP
  System's « Lancer le site » sets both), `loader`, `transition` and `smoothScroll` (the finishing touches, each
  false or a preset until the team turns it on: CLAUDE.md, The finishing touches).
- The finishing touches, each ready to turn on with a preset and to restyle per client (Oct 17, 2026; Sam: « un loading
  screen par projet et un langage de transition entre les pages (comme Barba), intégré dans l'UX de l'app »; presets
  and the smooth scroll Oct 27, 2026, Sam): `src/components/system/Loader.astro` (from the first paint until the fonts
  and the first image in view are ready, 600 ms to 2.5 s, once per tab session, `?op-loader` to replay it: the site's
  mark, a count to 100, or a curtain in the brand's colour), `src/components/system/PageTransitions.astro` (Astro's
  `<ClientRouter />`, never Barba: a fade, a short slide, or a curtain that covers the page while the next one loads;
  a crossfade or a cut with reduced motion) and `src/components/system/SmoothScroll.astro` (Lenis 1.3, MIT, loaded
  only where it runs: never with reduced motion, not on a touch screen unless asked; `src/utils/smooth-scroll.ts` for
  a script that needs it and for GSAP's ScrollTrigger). A custom loader or transition is the site's own file
  (`LoaderCustom.astro`, `TransitionCustom.astro`) that Claude makes from the team's words. Every script of the
  components runs again after a page change through `src/utils/page.ts` (`onPage`).
- Tokens per screen: Lumos's fluid tokens (`--x-min`, `--x-max`) show as their two ends; a site whose values change by
  screen instead writes them in `@media (width >= Xrem) { :root { … } }` blocks of `src/styles/base.css` (a tablet's,
  then a computer's), and each shows per screen in OP System, its screens' widths taken from those blocks.
- `wrangler.jsonc`: an assets-only Worker on Cloudflare, its workers.dev address, and a preview address for every
  branch but `main` (Worker Previews). `main` is the live site; `review` is the one OP System shows.
- `CLAUDE.md`: how Claude works here (the review branch, publishing only when asked, OP System's queue, the checks).
- French by default: `SITE_LOCALE` fr-CA, the page's `lang`, the menu, the 404 page and the skip link.
- OP System's look until the client's (Oct 17, 2026; Sam: « aucune trace de Lumos, à part pour donner le crédit… tout
  devrait être relié à OP System et au langage graphique de l'app »): the tokens of `src/styles/base.css` are the
  app's (its canvas, surfaces, ink, one blue accent, hairlines, regular weight, the system's type, its radii and
  eases), the first page says what the site is and where things are (`src/components/system/StarterHome.astro`), and
  the components page shows only the site's own components (`src/pages/composantes.astro`). A new site replaces the
  swatches, the themes and the first page with the client's; Lumos's code (components, utilities, conventions, skills)
  stays as it is.
- `scripts/favicon.mjs` (`npm run favicon`, and `prebuild` for what is missing): `public/favicon.svg`, `favicon.ico`,
  `apple-touch-icon.png` and `og-image.jpg` from the logo's mark (`src/assets/logo/mark.svg`), or from the site's
  initial on `brandColor` until there is one (CLAUDE.md, Logo and favicon).

## Start a site

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/official-partner/op-astro)

The button works once this repository is public: Cloudflare's Deploy button only copies a public repository
(Cloudflare's docs, Deploy buttons, Limitations). Until then, start a site by hand (below).

From OP System, the first way (Oct 17, 2026; Sam):

1. OP System, « Un nouveau site »: the app opens Cloudflare's Deploy button for this repository. On Cloudflare's page,
   the person names the new repository and the Worker after the project (its id, in lowercase letters, digits and
   dashes: `client-web`). Cloudflare copies the starter into the studio's GitHub as a new repository, writes the
   Worker's name in its `wrangler.jsonc`, sets up Workers Builds and deploys `main` a first time. Its build command
   comes from package.json's `build` script (`npm run build`); with no `deploy` script, the deploy command is
   `npx wrangler deploy`; a branch other than `main` is built with `npx wrangler preview`.
2. OP System links the site to the project and asks the person's Claude to prepare it (a request of kind `setup`:
   CLAUDE.md, OP System): op.config.json and src/consts.ts filled in, the Worker's name checked, `npm ci`,
   `npm run check`, `npm run build`, a commit on `main`, then the branch `review` from it, both pushed. Its preview
   (`review-<name>.<account>.workers.dev`) is the address OP System shows. If the push of `review` gives no preview,
   turn on « Enable Preview Builds » in the Worker's Settings › Build › Branch control.

By hand:

1. GitHub: on this repository, « Use this template » › « Create a new repository », in `official-partner`, named after
   the client (`client-web`, private). Or ask Claude to copy it into an empty repository.
2. Claude, in a session with the new repository: the project's id and names in `op.config.json`, the Worker's `name`
   in `wrangler.jsonc` (the id), `SITE_NAME` and `SITE_DESCRIPTION` in `src/consts.ts` (the favicon follows the name at
   the next build); `npm ci`, `npm run check`, `npm run build`; a commit on `main`, then the branch `review` from it,
   both pushed.
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
| `npm run shot`    | Full-page PNGs of built pages, in `shots/`       |

Node 22.19 or newer is required (Cloudflare's build image runs Node 24 by default). `npm run build` runs `prebuild`
first (`scripts/favicon.mjs --if-missing`: the icons from the repository's own files, no network and no secret; without
`sharp` it skips the rasters and says so). There is no `deploy` script on purpose: Cloudflare deploys with
`npx wrangler deploy`, and nobody deploys the live site by typing `npm run deploy`. Wrangler is 4.135 or newer, which
`npx wrangler preview` needs.

## Security

Every build serves the site with secure headers (`dist/_headers`, written by `integrations/op-system.mjs`):
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(),
microphone=(), geolocation=()`, `X-Frame-Options: SAMEORIGIN` and `Strict-Transport-Security: max-age=31536000`
(without `includeSubDomains` or `preload`, so the client's other subdomains are not bound by this site). OP System's
proxy drops the frame and HSTS headers, so the review still shows in the app. A site that needs one of them otherwise
names that header in `public/_headers` (a value, or `! Name` to drop it), and the build leaves it to the site.

Every build is checked for secret keys: after the build, the text files of `dist/` (HTML, JS, CSS, JSON, XML, text,
source maps, SVG, `_headers`, `_redirects`, any `.env` file) are scanned for private key blocks, AWS access keys,
GitHub tokens, Stripe live secret and restricted keys, Slack tokens, OpenAI, Anthropic, Resend and Supabase secret keys,
and JWTs that carry Supabase's `service_role`. One found fails the build, naming the file, the line and the kind, never
the value, so Cloudflare deploys nothing. A Google API key only warns (a browser key is public by design; restrict it to
the site's domain). A key the site needs lives in Cloudflare, in the Worker's Variables and Secrets, never in the
repository.

## Lumos for Astro

Built with [Astro](https://astro.build) (MIT) and Lumos for Astro by Timothy Ricks. The components, the styles,
`LUMOS.md`, `AGENTS.md` and the skills in `.agents/skills/` are Lumos for Astro's, MIT licensed, © 2026 Timothy Ricks
(LICENSE). Its documentation: [lumosframework.com](https://lumosframework.com). Taken
from `lumosframework/lumos-for-astro` at 1.0.0 (commit 04795f8); an upgrade goes through the `lumos-upgrade-version`
skill. What OP changed in Lumos's own files, so an upgrade keeps it:

- `astro.config.mjs`: the OP System integration; no font of its own (Lumos's Inter is removed: the system's stack,
  `--primary-family`, until the site has its fonts).
- `src/consts.ts`: French placeholders, `SITE_LOCALE` fr-CA, the components page (`/composantes`) out of search
  engines.
- `src/layouts/BaseLayout.astro`: `lang` from `SITE_LOCALE`; the finishing touches (`Loader`, its head part and its
  cover; `PageTransitions`, its head part and its curtain; `SmoothScroll`), each rendered only when op.config.json
  turns it on, and `data-page-transition` on `<html>` for the transition's preset.
- `Slider`: it answers OP System's `op:reveal` (`src/utils/op-reveal.ts`): the review points at an element in a slide,
  the row goes to that slide (Oct 27, 2026).
- The scripts of `Nav`, `Footer`, `Form`, `Range`, `Accordion`, `Dropdown`, `Marquee`, `Modal`, `Slider` and `Tabs`:
  their body in `onPage((signal) => { … })` (`src/utils/page.ts`, added), so they run again after a page change when
  the transitions are on, `signal` on their listeners to `document`, `window` and media queries, their observers and
  timers stopped with it. What each does is unchanged.
- `src/styles/base.css`: OP System's swatches (`--canvas`, `--sunken`, `--surface`, `--ink`, `--ink-2`, `--ink-3`,
  `--grey-dark`, `--grey-light`, `--accent`, `--accent-light`, `--accent-text`) in place of Lumos's light, dark and
  brand ones, and the three themes on them (light on the canvas, dark on the ink, brand on the accent); Lumos's token
  names, roles and fluid structure kept. Headings in regular weight at -0.02em, radii 10 and 14 px, hover 140 ms and
  opening 240 ms on `--ease-smooth`, OP's three eases (`--ease-smooth`, `--ease-osmo`, `--ease-rebound`), the nav
  3.5rem high, a `--focus` role (the outline's colour), `--mono-family` for code, and the page motion
  (`--loader-duration` 600 ms and `--loader-ease`, `--page-leave-duration` 320 ms and `--page-leave-ease`,
  `--page-arrive-duration` 560 ms and `--page-arrive-ease`).
- `src/components/utility/BaseHead.astro`: no font preload; `favicon.ico`, `favicon.svg` and `apple-touch-icon.png`.
- `src/components/global/Nav.astro`, `Footer.astro`: the site's name set in type until `src/assets/logo/logo.svg`
  exists (then the logo); the menu's links as the app's tiles, the footer in one row; the nav named for view
  transitions (`view-transition-name: site-nav`), so it holds still while the page changes.
- `src/components/global/SkipLink.astro`, `src/pages/404.astro`: their words in French; the 404 page on the grid's
  left edge.
- `src/pages/index.astro`: the starter's first page in place of Lumos's style guide cover.
- `src/pages/example-components.astro` removed (Lumos's own components shown): `src/pages/composantes.astro` shows
  the site's components only.
- Removed: Lumos's logo (`src/assets/logo/`), `src/assets/graphics/lumos-background.svg`, the Inter file, Lumos's
  favicon and social image (`public/`).
- `wrangler.jsonc`: no custom domain, workers.dev and Worker Previews.
- `.github/`: Lumos's publishing workflows and README assets removed; Dependabot on `review`, monthly.
- `.gitattributes`: `wrangler.jsonc`, `.github` and `.gitattributes` kept in an archive of the starter (a site copied from
  it needs them).
