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

## Branches: review, then live
- `main` is the live site. Cloudflare builds and deploys it on every push: never push work to `main` directly.
- `review` is what the team and the client see in OP System. Cloudflare builds it at its own address
  (`review-<name>.<account>.workers.dev`, `<name>` being `name` in wrangler.jsonc). Work goes there: on `review`, or on
  a branch of its own merged into `review`.
- `review` goes to `main` (the site goes live, or a change reaches the live site) only when someone asks in so many
  words: « publie », « mets en ligne », « publish ». Then: `git checkout main && git pull --rebase && git merge --ff-only
  review && git push`, and say what went live.
- Before the launch, op.config.json says `"live": false` and every build tells search engines to stay out
  (`dist/_headers`, noindex). At the launch, with the team: the client's domain added to the Worker in Cloudflare's
  dashboard, `SITE_URL` in src/consts.ts, `"live": true` in op.config.json, all in one commit on `review`, then
  published.

## OP System
- After each build, `integrations/op-system.mjs` writes `dist/site.json`: the project (op.config.json), the pages (their
  title and description, from the built HTML), the screens, the Web System (the tokens of `src/styles/base.css`, a
  fluid value as its two ends, at 320 and 1440 px) and the themes (their roles, as colour variables). OP System reads
  it through its proxy; it adds its own bridge to the pages, never this site. The build's last line says what it found
  (`site.json: N pages, N variables, N themes`): check it after a change to the pages or the tokens.
- A new page: a file in `src/pages/`, its title and description given to the layout. It shows in OP System at the next
  build of `review`. A page kept out of search engines: `NOINDEX_ROUTES` in src/consts.ts. The components page
  (`example-components`) is the system's: OP System shows it under Système.
- A new token: in `src/styles/base.css`, as Lumos names them (`--x-min` and `--x-max` for a fluid one, a hex for a
  colour in `:root`, a theme's roles in its `.theme-*` class). Edits made in OP System's Variables come back as
  requests: change the token here, never `dist/`.
- Requests from OP System's queue come through the OP System connector: read `get_guide("queue")` and follow it. Here
  that means: `git checkout review && git pull --rebase`, the change in `src/`, `npm run check` and `npm run build`
  (both clean, the site.json line as expected), a line in PROJECT.md, commit, `git push` (Cloudflare builds `review`
  in about a minute), then `add_journal` for each change, `settle_comment` for each comment, one `reply` per request,
  and `finish_work` with `published: true`. Never `main` from the queue.

## Build and check
- `npm ci` once, then `npm run dev` (http://localhost:4321), `npm run check` (types), `npm run build` (`dist/` and its
  site.json). Node 22.19 or newer.
- A page or a component changed: `npm run build`, then open the page built (`npm run preview`) at 1440 and 390 px.
- Content lives in files by default: in the page, or in an Astro content collection (`src/content/`). A CMS (Sanity)
  only when the client must edit the site alone, decided with the team and logged in PROJECT.md.

## Lumos
- Lumos for Astro is not Lumos for Webflow: its conventions are LUMOS.md's. New CSS is the last resort (LUMOS.md, New
  style checklist).
- Lumos for Astro is MIT, © 2026 Timothy Ricks (LICENSE): keep LICENSE as it is. An upgrade of Lumos goes through the
  `lumos-upgrade-version` skill.

@AGENTS.md
