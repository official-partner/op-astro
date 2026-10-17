# Decisions

One line per decision: the date, who asked, what was decided and why. The newest at the top.

- 2026-10-17, Sam (« un loading screen par projet et un langage de transition entre les pages, comme Barba, intégré
  dans l'UX de l'app »): every site has a loading screen and page transitions ready, both off until the team turns
  them on in op.config.json (`loader`, `transitions`), so OP System can show and replay them. The loading screen wears
  the site's mark on its ground, once per tab session; the transitions are Astro's view transitions (the page lifts
  away, the next one rises in, on the site's eases), a crossfade with reduced motion. Each is restyled per client.

- 2026-10-17, Sam: the starter wears OP System's look, not Lumos's (no Lumos logo, colours, cover or showcase page;
  the credit in README.md and LICENSE only). The swatches, themes and first page are replaced with the client's.
- 2026-10-17, Sam: the site starts from OP's starter `official-partner/op-astro` (Lumos for Astro 1.0.0). `main` is
  the live site, `review` the one OP System shows; content in files until a CMS is decided.
