# The finishing touches: loading screen, page transitions, smooth scroll

Read before turning one on, changing one, making a custom one, or writing a component's script (the transitions change when a script runs).

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
