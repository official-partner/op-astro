# review/: what the checks read

The files a site's checks read, written while the design is read and as the team decides (OP's skill op-web-system,
The design as data and The target). They are the memory of a build: a session restarts from them, never from what it
remembers. The pictures and the comparison a check produces stay out of git (`shots/`, `.compare/`).

## review/data/<page>-figma.json: the design as data

One file per designed page, named as `npm run shot` names the page (`accueil`, `a-propos`, `concerns-melasma`; `home`
is read for `accueil` too). Written by script from what the Figma connector gives, never typed: the frame's width and
every text and shape with its box, in the frame's own pixels.

```json
{
  "frame": "1:55",
  "width": 1728,
  "height": 7650,
  "texts": [
    {
      "id": "1:64",
      "x": 40,
      "y": 22,
      "w": 207,
      "h": 24,
      "size": 27.5,
      "lineHeight": 23.7,
      "align": "left",
      "family": "Tranter Mix",
      "weight": 420,
      "letterSpacing": -0.28,
      "text": "Tranter Aesthetics"
    }
  ],
  "shapes": [
    {
      "id": "1:61",
      "name": "band hero",
      "x": 0,
      "y": 0,
      "w": 1728,
      "h": 928,
      "fill": "#2c0f0a",
      "radius": 0
    }
  ]
}
```

`npm run measure` reads `id`, `x`, `y`, `w`, `h`, and for a text `size`, `lineHeight` (in px) and `align` (`left`,
`right`, `center`); every other field is for the survey (families, weights, fills, radii). Tranter's first form (rows
`T` and `S` with `T_fields`, `S_fields` and `keys`) is still read.

## review/data/<page>-target.json: the design corrected by the system

The corrections list and the target are one object: each expected difference between the build and the raw design,
with its reason. A slip of the design brought back to the system, or a decision of the team with its date and who
asked. An element that is not here is expected where the design has it.

```json
{
  "_window": [1728, 928],
  "1:76": {
    "d": [-0.5, 1.75],
    "why": "image on 4 columns at 5:6, band height kept"
  },
  "1:65": { "abs": [24, 24], "why": "logo as an SVG: its box at the margin" },
  "1:90": { "size": 14, "why": "Sam, Nov 10: the buttons' text at 14" }
}
```

- `d`: moved by `[dx, dy]` px from the design. `abs`: at `[x, y]` in its band. `abs_x`: its x only.
- `size`: a text's size, when the team decided another than the design's.
- `why`: always. `npm run measure` lists the entries without one.
- `_window`: the window the page is measured in, when it matters (an opening that fills the screen).

## In the page

- `data-figma="<node id>"` on an element: it is that node of the design. Left in the built page: it weighs a few bytes
  and it is what lets a correction be measured months later.
- `data-figma-band="<name>"` and `data-band-top="<y in the frame>"` on a section: its elements are placed from its top,
  so a section that grew does not move every section under it.

## review/data/rules-baseline.json: the failures the team accepts

Written by `npm run rules -- --accept` on a site that has debt, then by hand: each failure of `npm run rules` the team
accepts, with its `why` and its date. A build stops on a failure that is not in it. The list only shrinks.
