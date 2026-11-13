# system/: the site's system, in one file

`system/site.json` holds every value of the site's system and where it comes from. `npm run system` writes
`src/styles/base.css` from it (and `system/reset.css`, the reset every site keeps). base.css is never edited by hand:
`npm run rules`, which every build runs, fails on a base.css that is not what the file gives.

A change of the system (a comment in OP System, an edit in its Variables, a correction « everywhere ») is one change
here, then `npm run system`, then the checks. What the team decided goes in `decisions`, with its date and who asked.

## The scale

Lumos's one fluid line, for a content site with no design at one computer width. A size is `[at min, at max]`:

```json
"scale": { "min": 320, "max": 1440 },
"space": { "space-3": [14, 16] }
```

Two segments, for a site drawn at one computer width (OP's skill op-web-system, The scale). A size is
`[phone, tablet, computer]`, the computer's being the design's own value:

```json
"scale": { "phone": 390, "tabletMax": 1023, "desktopMin": 1024, "reference": 1728 },
"space": { "space-3": [12, 12, 16] }
```

From 1024 to the reference width everything scales as one piece: each `-min` is the computer's value x 1024 /
reference, computed by the command, never typed. Below 1024, the phone's value grows to the tablet's.

## The sections

- `swatches`: the colours, by the names the designer gives them. The only place a hex lives.
- `type`: `primitives` (families, weights), `letterSpacing`, `lineHeight` and `styles`. A style has its `size` and its
  properties as base.css names them (`line-height`, `letter-spacing`, `text-transform`, `margin-top`, `margin-bottom`,
  `font-family`, `font-weight`, `text-wrap`; `font-variation` and `font-feature` when the font needs them). `floor`
  (px) is the size a text read never goes under. Each style gets its `.text-style-*` class.
- `borders`, `radius`, `maxWidth`, `nav`: their tokens, as written.
- `motion`: `durations` and `eases` under OP's names, the same on every site (`--faster-duration`, `--hover-duration`,
  `--open-duration`, `--base-duration`, `--slow-duration`; `--ease-out`, `--ease-arrive`, `--ease-travel`,
  `--ease-leave`), then `loader`, `pageLeave`, `pageArrive` (ms) and `more` for a site's own. A site changes the
  values, never the names.
- `layout`: `site-margin`, `site-gutter` and `columns` per screen (`[4, 8, 12]`).
- `space`, `sectionSpace`: the steps. `fluid`: a site's other sizes (a logo, a marker).
- `roles`: a relation the design repeats, pointing at a step of the scale:
  `"space-media": { "ref": "space-3", "job": "an image and its first text", "phone": "space-2" }`.
- `groups`: a site's own tokens, as written: `[{ "title": "Tones", "set": { "tone-muted": "50%" } }]`.
- `themes`: each theme's `selectors`, its `scheme` and its `roles`, in groups.
- `decisions`: `[{ "date": "2026-11-10", "who": "Sam", "what": "buttons' text at 14" }]`. Not written in the CSS.

A value may say where it comes from: `"ink": { "value": "#141413", "from": "brand guide, Ink" }`.
