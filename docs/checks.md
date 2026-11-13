# Looking at a change, and the four checks

Read once before the first change, then when a check's result is not clear.

## Check what you changed
- `npm run shot -- <page...> [width...]` takes each page at each width as a full-page PNG,
  `shots/<page>-<width>.png` (git-ignored): `accueil` (or `/`) for the home, another page by its route (`a-propos`,
  `coachs-fitness`), `404`, or `all`; 1440 and 390 when no width is given. It builds first when `dist/` is older than
  the sources (`--build` forces it), serves `dist/` itself, asks for reduced motion (the reveals in their final state)
  and waits for the fonts, the loading screen and every image, whole (Nov 12: a lazy image with `sizes="auto"` was
  missing from three shots in four). It fails on a page missing from `dist/` or an error in the console, and prints
  them. About a second a shot. `--parts` adds the page in parts 1800 px high
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

## The checks
- Four commands close a step (OP's skill op-web-system, Checks). Each prints what it found and exits 1 on a failure:
  - `npm run rules`: the rules a site holds to stay one system, on its sources. No CSS in a page; no text style
    outside the system; a place across the grid is a rail and a span, never a column number; no copied block; each
    global class of project.css used in 3 places, 15 at most, none under a name Lumos uses; no raw px, hex, duration
    or z-index; no `!important`; no fact (an email, a phone, a postal code, an outside link) written in two files;
    every component with its sample. It reads project.css and the components made or changed for the site: the
    starter's library as it came is not the site's to fix.
  - `npm run measure -- <page>`: each element tied to the design (`data-figma="<node id>"`) against the design
    corrected by the system, at the design's width: 2 px for a place, 1 px for a text's size. review/README.md says
    the two files it reads and how a section is a band of the design.
  - `npm run widths -- <page>`: at nine widths, nothing overflows from 320 px, every page grid (`.site-grid`) sits on
    the site's margin and every image frame (`.media`) on its columns; on a two-segment scale (`--viewport-min` at
    1024) every element keeps its place in proportion and the large headings break on the same words.
  - `npm run compare -- save`, the change, then `npm run compare`: the HTML, the pictures and what every button and
    link to a place does, before and after a change that must change nothing people see (a clean-up, an upgrade of
    the starter). Its pictures of what differs are in `.compare/diff/`: look at them.
- Which, by what changed: a component or a style, `rules`; a designed page or a correction on one, `measure` and
  `widths`; a clean-up, `compare` around it. Say the numbers in the reply (« 92 sur 92 dans la cible, aucune règle
  brisée ») and what was not run.
- Every build runs the rules (integrations/op-system.mjs): on a machine it stops on a failure the team has not
  accepted, so no session pushes without seeing it; on Cloudflare it warns and site.json carries the count
  (`system.rules`), so the review is never blocked. `npm run shot` and the other checks build whatever the rules say;
  `OP_RULES=warn npm run build` does too.
- A failure the team accepts lives in `review/data/rules-baseline.json` with its reason and its date (`npm run rules --
  --accept` writes today's failures there, on a site that has debt; then each gets its `why`). The list only shrinks:
  never accept a failure a change just made, fix it in the system.
- `OP_SITE=<folder> npm run widths -- accueil` looks at another site with this copy of the scripts (a site not brought
  up to date yet). In op-astro only: after a change to a library component, `npm run rules -- --library`
  (scripts/lib/library.json holds a fingerprint of every version of the library's files, which is how a site knows
  the ones it changed).
