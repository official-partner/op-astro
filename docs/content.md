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

## Lists as data (Nov 19; Sam: « oui pour les deux »)
- A block's list (a section's cards, offers, values, prices, partners, logos: everything that is not a collection)
  is kept in `src/data/<name>.json`, never in a .ts file nor in the page: `{ "items": [ { "id": "…", … } ] }`, each
  item with an `id` of its own (lowercase letters, digits, hyphens), its other keys plain values (a text, a number, a
  boolean, a list of words, a picture as its path under `src/assets/`). The words are the client's, in the file.
- The page reads it with `listFrom(data, schema, file)` (src/utils/data-list.ts): a zod schema per list, so a wrong
  entry stops the build and says which; a picture through `picture(path, file)`, optimised as any import. What is
  code stays code: a link built from another file, a component per kind, a default.
- The page marks it: `{...listMarks("<name>", "src/data/<name>.json")}` on the list, `data-op-item={item.id}` on each
  of its direct children (`data-op-min`, `data-op-max` as before). src/pages/test-contenu.astro has one.
- Why: OP System writes that file itself when someone copies, deletes or moves an item on the canvas (a commit
  « Edit: … (OP) » on review, a copy under the id `<id>-copy`): no request to Claude, no wait. A list written in a
  .ts file or in the page still works on the canvas, but each change waits for Claude. When a change touches such a
  list, move it to a data file in the same commit; `npm run compare` around the move (it must change nothing).
- A text of an item changed on the canvas is written in that item of the file (a copy's words too, right after the
  copy). An option of an item (`data-op-options` on the item or inside it) whose value is one of the item's keys
  names it, `"field": "<key>"` (a card's colour: `"field": "theme"`), and the app writes the choice there; an option
  without `field` waits for Claude. A page may show a part of a file (the first six): the others keep their place.
  A list inside an item (a plan's prices) is that item's own array under a key, each line an object with its `id`;
  its list on the page says its place, `data-op-source="src/data/<name>.json#<item id>.<key>"`, each line
  `data-op-item={line.id}`, and the app writes it in its item.
- Never rename an item's `id` without a reason: the app's saved changes name it.

## A list's rule (Nov 19; the app's plan, lot 3; Sam, Nov 18: « une liste se règle sur la page »)

A list of a collection's items says which ones it shows, in what order and how many in a rule, written in
`src/data/lists.json` under the list's name, never in the page's code. OP System's Options panel writes that file
itself (the app's lot 3: a commit « Edit: … (its rule) (OP) » on review).

```json
{ "lists": { "projets-accueil": {
  "collection": "projects",
  "shows": "some",
  "where": [{ "field": "wood", "op": "is", "value": ["Walnut", "White oak"] }, { "field": "year", "op": "after", "value": 2022 }],
  "order": [{ "by": "year", "dir": "desc" }, { "by": "title" }],
  "limit": 6, "start": 1, "out": [], "skipSelf": false
} } }
```

- `shows`: `all` (every visible item), `some` (those every condition of `where` keeps), `chosen` (the ids of `chosen`,
  in that order: picked by hand).
- `where`: a field, how (`is`, `not`, `after`, `before`, `has`, `set`, `unset`), a value. `is` and `not` take one value
  or several (one of them); a reference is its id; `after` and `before` read a number or a date; `has` looks in a text
  or a list of words.
- `order`: the fields that sort, the first first, each `asc` (by default) or `desc`; the empty ones last. `"hand"`: the
  ids of `chosen` first, in their order, then the others as the collection has them (a card moved on the page).
  Nothing: the collection's own order (`order`, then the id).
- `limit` (at most; 0 or nothing: all), `start` (the first one shown, from 1), `out` (ids left aside), `skipSelf` (on
  an item's page, that item left out).

A page reads it with `listed("<name>", self?)` and marks it with `ruleMarks("<name>")` (src/utils/lists.ts):
`data-op-list`, `data-op-source="astro:<collection>"`, `data-op-rule="src/data/lists.json"` and `data-op-rule-is`
(the rule as the build read it, JSON: what the app's Options panel shows and changes from), each item
`data-op-item={id}`. The bounds a layout has stay on the list (`data-op-min`, `data-op-max`). A name the file does not
have stops the build. The rule itself is src/utils/list-rule.ts, with nothing of Astro in it: `npm run test:rules`
after any change to it. A list with no rule reads its collection whole with `getItems`, as before.

site.json says the lists of a collection's items the pages show (`lists`: each one's name, collection, page and, when
it has one, its rule as built, and `items`, the ids it shows as built; integrations/op-system.mjs, read from the built pages, the team's own pages left out):
OP System reads it to say where an item shows (Contenu, « Shows in »).

## Sections: a page built in typed blocks (Nov 19; the app's plan, lot 4, its first part)

An item's page can be built in sections the client adds, fills, moves and removes: a field `sections`, a list of
blocks, each of a kind the site has. It is the one list of objects a collection may hold (every other field stays of
the kinds Contenu edits). In `src/content.config.ts` the field is `z.array(z.discriminatedUnion("type", [ … ]))`,
each kind a `z.object` with:

- `type: z.literal("<kind>")`, what tells the kinds apart;
- `id: z.string()`, a slug of its own in the item (what the page marks, what a move or a change names);
- `name` (optional: the team's own name for the section, never on the site) and `hidden` (optional: left out of the
  page, kept in the item);
- its own fields, each with its `.describe("…")`; the object's `.describe("…")` is the kind's name where people pick it.

Each kind is a component of the site: `src/components/content/Sections.astro` draws an item's sections, a branch per
kind, and marks the list for OP System (`data-op-list="sections"`, `data-op-source="astro:<collection>/<item>#sections"`,
each section `data-op-item={id}` and `data-op-kind`, its fields `data-op-field`). A new kind is a z.object in the
schema and a branch there, with its sample on the components page. The starter's example is the collection `notes`
(a text, a quote), shown on the test page.

Not there yet: a kind with a picture (how a picture inside a list goes through the live staging is not verified), and
the app's side (Contenu reads the field; adding, moving and filling a section from the app is the next part).
