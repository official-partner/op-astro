# The look, the logo and the favicon

Read before replacing the starter's look with a client's, or touching the logo, the mark or the favicon.

## The look, the logo and the favicon
- The starter wears OP System's look (README.md, What this repository adds): a new site replaces the swatches and the
  themes of `system/site.json` with the client's (same token names; `npm run system` writes base.css), and `src/pages/index.astro` with its own home
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
- A site redone keeps the current site's icons (Oct 27, Sam): at a « same » or « redo » project's setup OP System
  copies them from the export into `public/` on `review` (favicon.ico, apple-touch-icon.png, favicon.svg when the site
  has one, else the starter's favicon.svg goes) and writes `"favicon": "site"` in op.config.json; `scripts/favicon.mjs`
  then never writes those three files, and BaseHead links favicon.svg only when it is there. Webflow's default « W » is
  never taken: the starter's stays. site.json says where the favicon comes from (`faviconFrom`: site, generated, hand).
