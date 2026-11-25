# The source markers (OP v2)

A site reviewed in OP v2 builds its staging with source markers: every element a page shows carries the file and the
place it was written in, and every page carries a stamp, its file and the checksum of the exact bytes it was built
from. OP reads them to change the site's own files: no selector, no `data-op-*` mark written by hand.

- On for a staging, with nothing to set in Cloudflare: its build of any branch but `main` (`WORKERS_CI_BRANCH`), so
  `review` and a trial branch have them. By hand, `OP_MARKERS=1`; `OP_MARKERS=0` turns them off on a branch. The live
  site (`main`) never has them, whatever is set (`markersOn` in the integration): it builds exactly as before
  (checked: the same files byte for byte on this branch and on `main`, site.json apart).
- `integrations/op-markers.mjs` hands Astro a marked copy of each `.astro` file as Vite loads it. Nothing is written
  to the project.
- `integrations/op-markers/stacki-markers.cjs` is Stacki's own marking (MIT, © 2026 Timothy Ricks, its licence beside
  it), bundled by `official-partner/op-v2` (`scripts/build-markers.mts`). Never edit it here: bring a newer one from
  there. It needs `typescript`, which the starter already has.
- What a marked page holds: `<!--avb-s:PLACE-->` and `<!--avb-e:PLACE-->` around each node, `data-avb-p` on each
  element (its place in the page, and in each component that renders it, as `file|place`), and `data-avb-d`, the
  stamp `avb-d:<sha256>:<file>`.
- Every marked page also says the commit it was built from (`window.opBuild`, one inline line in its head:
  Cloudflare's `WORKERS_CI_COMMIT_SHA`, else git's): OP states a change against that commit's files.
- What it costs (measured Nov 24, 2026): 0.6 s on an 18-page site, 3.5 s on a 56-page one; the HTML is about four
  times larger before compression, under twice after.

This branch (`v2`) is where the starter changes for OP v2. `main` stays as OP v1's sites need it until each one moves.
