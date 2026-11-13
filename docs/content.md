# Content: the collections, Contenu and the live staging

Read before adding or changing a collection, a field, a list the team edits on the canvas, or anything of the live staging.

## Content: the collections, Contenu and the live staging
- A site's editable content is its Astro content collections: one folder per collection in `src/content/<name>/`, one
  file per item named by its slug (the item's id), JSON (Markdown when the item has a text of its own). OP System's
  « Contenu » edits them, and the team creates collections and fields there too: the app writes
  `src/content.config.ts` and the folders itself, through OP's GitHub App, on `review`.
- A collection only where a CMS is needed (Sam, Oct 28): items with a page of their own (a template: a blog's
  articles, a project's case study) or the same items listed on several pages and managed as data (questions shown on
  two pages). Everything else is a block of its page, never a collection: a section's cards, offers, values, prices,
  partners, logos, a team on one page. A block's list is written in the page or in a data file (`src/data/`) and
  marked for OP System's Modifier: `data-op-list="<name>"`, `data-op-source` the file it is written in (`page`, or
  `src/data/offers.ts`), `data-op-item` on each item (op-system's `docs/bridge.md`, Lists); the team and the client
  duplicate, delete and move its items on the canvas, as a Webflow component's slots, with no collection to create
  or link. Before adding a collection, say which page or pages show its items and why they need one; when in doubt,
  a block. A site redone from Webflow brings its CMS collections that have a template page as collections, and its
  static lists as blocks.
- `src/content.config.ts` keeps the simple form the app reads and writes: one `defineCollection` per collection with a
  `glob()` loader, its `schema` a `z.object({ ... })` (or `({ image }) => z.object(...)` when it has a picture) with a
  `.describe("…")` on each field and on the object, `export const collections = { ... }`. Names are code (English
  camelCase), labels are words for people in the client's language. Nothing else goes in it: no helper, no exported
  schema, no import but `astro:content`, `astro/loaders`, `astro/zod`. The live machinery lives elsewhere and picks a
  collection up by itself.
- Fields: every one optional (`.optional()`) but the name (`name`, `title` or `question`: the item's title), and the
  slug is the file's name, so an item with a page always has both. `visible: z.boolean().default(true)` hides an item
  everywhere; `draft: z.boolean().default(false)` keeps one on the staging only (OP System's « Draft », Nov 12: the
  live site's build leaves it out of every list, its own page with it, until someone sets it to « On the site »;
  `npm run dev` shows it; site.json says `content.drafts` so the app offers the state); `order: z.number().optional()`
  sorts them (Contenu writes 1, 2, 3; an item without one comes last).
- A page reads a collection through `getItems("<name>")` and `getItem("<name>", id)` (`src/utils/content.ts`), never
  `getCollection`: the visible items, in their order, `{ id, data }` the same way on every build. A picture field gives
  a `Picture`: pass it to `<Img {...img(data.photo)} alt="…" />`. A collection added to content.config.ts works by its
  name at once, on the files and on the staging, with nothing written anywhere else.
- A field shown in a page: `data-op-field="<field>"` on the element that holds its text; a field that may be empty (all
  but the name) inside `<When field="<field>" value={data.<field>} as="p" class="…">` (`src/components/system/When.astro`),
  which renders the element only when the value is there (a text not blank, a list not empty, a picture, a number, true)
  and marks it `data-op-when="<field>"` for OP's bridge; its `else` slot (marked `data-op-empty`) holds what shows in
  its place, when the layout needs one (the initials of `CardTeam` without a photo). A list of items is marked
  `data-op-list="<name>" data-op-source="astro:<name>"` and each item `data-op-item={id}` (op-system's `docs/bridge.md`, Lists).
  `src/components/content/CardTeam.astro` on `src/pages/test-contenu.astro` is the sample: a new site keeps it as the
  model, or removes the `team` collection, its files, its pictures, the card, the page and its entries in consts.ts and
  op.config.json together.
- The staging is live: Cloudflare's build of `review` (`WORKERS_CI_BRANCH`, or `OP_LIVE=1` by hand) renders every page
  but the 404 on demand in the Worker (`@astrojs/cloudflare` 14.3.4, pinned for Astro 7.3; `integrations/op-live.mjs`),
  and `getItems` reads OP's working copy of each collection (`src/live.config.ts`, made from content.config.ts's own
  schemas; `src/utils/content-loader.ts`): `GET <OP_CONTENT_URL>?p=<project>&c=<collection>` with
  `Authorization: Bearer <OP_CONTENT_TOKEN>`, kept 2 s (`OP_CONTENT_TTL`), read again at once when the request names a
  newer version (`?op-v=<version>` or `x-op-content-version`, OP System after a save). An error, a timeout (1.5 s) or no
  `OP_CONTENT_URL`: the committed files (a failure is remembered 5 s). An item the schema refuses: its committed file.
  A picture not committed yet is a URL in OP's storage, shown only from a host of `OP_STORAGE_ORIGINS` (build time,
  default `https://*.supabase.co`). `main` and every other branch build static, as before.
- What the staging reads is what is published (OP System, Oct 28): every change made in OP System's Contenu is a
  draft until someone presses « Publier » there, so the client's link never shows one. OP System's own frame shows the
  drafts: its proxy asks for each page with a header `x-op-draft` (a short proof OP signs for the project and the
  person looking); `src/middleware.ts` renders the page within it (`src/utils/draft.ts`, AsyncLocalStorage: the
  `nodejs_als` flag in wrangler.jsonc) and the loader hands it on with its read, keeping that answer apart, keyed by
  the proof. OP gives the drafts only for a good proof of someone who may change the content. Never read the header
  anywhere else, never put it in a page, a link or a cookie; a page that carries drafts is `no-store` like every page
  of the staging.
- The Worker's secrets on Cloudflare (Settings › Variables and Secrets, type Secret; they apply to the review
  preview): `OP_CONTENT_URL` (OP's content address) and `OP_CONTENT_TOKEN` (the project's read token, given by OP
  System). Optional variables: `OP_PROJECT` (default op.config.json's `id`), `OP_CONTENT_TTL` (ms). Never in the
  repository, op.config.json or `src/`. The staging's pages carry the static files' headers (noindex always, the secure
  headers) and `Cache-Control: private, no-store` (src/middleware.ts).
- Check a change to this machinery: `npm run check`, `npm run build` (static: the pages as before) and `OP_LIVE=1 npm
  run build` (the Worker in `dist/server`, site.json read from a static build in `.op-static`); to see the staging
  locally, `npx wrangler dev` after the live build, with `--var OP_CONTENT_URL:<a stand-in>`.
- A CMS (Sanity) only when the client must edit the site alone, decided with the team and logged in PROJECT.md.
