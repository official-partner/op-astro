// A page measured against its design, element by element (Official Partner, Nov 12, 2026; from the measure written for
// Tranter on Nov 10).
//
//   npm run measure -- <page> [--only <band>] [--height <px>] [--hover <selector>] [--json]
//   npm run measure -- accueil            npm run measure -- concerns-melasma --only stone
//
// It needs two files the design's reading wrote (OP's skill op-web-system, The design as data and The target):
//
//   review/data/<page>-figma.json    the design as data: its frame's width, every text and every shape with its box
//     { "frame": "1:55", "width": 1728, "height": 7650,
//       "texts":  [{ "id": "1:64", "x": 40, "y": 22, "w": 207, "h": 24, "size": 27.5, "lineHeight": 23.7,
//                    "align": "left", "text": "…" }],
//       "shapes": [{ "id": "1:61", "name": "band hero", "x": 0, "y": 0, "w": 1728, "h": 928 }] }
//   review/data/<page>-target.json   the design corrected by the system: each expected difference, with its reason
//     { "1:76": { "d": [-0.5, 1.75], "why": "image on 4 columns, 5:6" },        moved by dx, dy from the design
//       "1:65": { "abs": [24, 24], "why": "logo at the margin" },               or at this place in its band
//       "1:90": { "size": 14, "why": "Sam, Nov 10: button text at 14" },        or its text at this size
//       "_window": [1728, 928] }                                                the window to measure in
//
// In the page, an element says which node of the design it is with data-figma="<node id>". A section says it is a band
// of the design with data-figma-band="<name>" and data-band-top="<its top in the frame>": its elements are then placed
// from the band's top, so a section that grew does not move every section under it.
//
// What is compared, at the design's width: a shape by its box's left and top; a text by where its first line starts
// and by the middle of that line (the design gives a text's box, the browser sets its letters: the middle of the line
// is the same in both), and by its size. Within 2 px of the target for a place, 1 px for a size. A text set to the
// right or centred is compared by that edge.
//
// It prints each element, a « !! » on one that is off its target, then the count: how many are within 2 px of the raw
// design, how many within 2 px of the target. It exits 1 when a visible element is off its target.
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ROOT,
  SETTLE,
  buildIfStale,
  fail,
  launch,
  nameOf,
  opening,
  prepare,
  pagesOf,
  serve,
  stat,
} from "./lib/site.mjs";

const PLACE = 2; // px, a place
const SIZE = 1; // px, a text's size
const DATA = path.join(ROOT, "review/data");

const args = process.argv.slice(2);
const opt = (name) => {
  const at = args.indexOf(name);
  if (at < 0) return undefined;
  const value = args[at + 1];
  args.splice(at, 2);
  return value;
};
const only = opt("--only");
const hover = opt("--hover");
const heightAsked = Number(opt("--height")) || 0;
const designFile = opt("--design");
const targetFile = opt("--target");
const json = args.includes("--json");
const words = args.filter((a) => !a.startsWith("--"));
if (words.length !== 1)
  fail(
    "Which page? npm run measure -- <page> [--only <band>] [--height <px>] [--hover <selector>]\n  npm run measure -- accueil",
  );
const name = nameOf(words[0]);

/* ------------------------------------------------------------------ the design and its target */
const firstFile = (given, names) => {
  if (given) return path.resolve(given);
  return names.map((n) => path.join(DATA, n)).find((f) => stat(f)?.isFile());
};
const aliases = name === "accueil" ? ["accueil", "home", "index"] : [name];
const designPath = firstFile(
  designFile,
  aliases.map((n) => `${n}-figma.json`),
);
if (!designPath)
  fail(
    `No design to measure ${name} against: review/data/${name}-figma.json is missing.\n` +
      "The design's reading writes it (OP's skill op-web-system, The design as data). A page built without a design is not measured.",
  );
const targetPath = firstFile(
  targetFile,
  aliases.map((n) => `${n}-target.json`),
);
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${path.relative(ROOT, file)} is not valid JSON: ${error.message}`);
  }
};
const raw = readJson(designPath);
const target = targetPath ? readJson(targetPath) : {};

// The design, whichever way its file is written: the form above, or Tranter's first one (rows T and S, their fields
// named in T_fields and S_fields, the text styles in keys as « family|size|line height|tracking »)
const design = { width: raw.width ?? raw.w, elements: new Map() };
if (!design.width)
  fail(`${path.relative(ROOT, designPath)} gives no width for its frame.`);
if (Array.isArray(raw.T) || Array.isArray(raw.S)) {
  const keys = raw.keys ?? {};
  for (const r of raw.T ?? []) {
    const key = String(r[7]).match(/k\d+/)?.[0];
    if (!key || !keys[key]) continue;
    const [, size, lh] = keys[key].split("|");
    const S = Number(size);
    const L = lh.endsWith("px") ? parseFloat(lh) : (parseFloat(lh) / 100) * S;
    design.elements.set(r[0], {
      kind: "text",
      x: r[1],
      y: r[2],
      w: r[3],
      h: r[4],
      size: S,
      lineHeight: L,
      align: "left",
      label: String(r[8] ?? ""),
    });
  }
  for (const r of raw.S ?? [])
    design.elements.set(r[0], {
      kind: "shape",
      x: r[3],
      y: r[4],
      w: r[5],
      h: r[6],
      label: String(r[2] ?? ""),
    });
} else {
  for (const t of raw.texts ?? [])
    design.elements.set(t.id, {
      kind: "text",
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      size: t.size,
      lineHeight: t.lineHeight ?? t.h,
      align: t.align ?? "left",
      label: String(t.text ?? t.name ?? ""),
    });
  for (const s of raw.shapes ?? [])
    design.elements.set(s.id, {
      kind: "shape",
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      label: String(s.name ?? ""),
    });
}
if (!design.elements.size)
  fail(`${path.relative(ROOT, designPath)} holds no text and no shape.`);

/* ------------------------------------------------------------------ the page, measured */
buildIfStale({ env: { OP_RULES: "warn" } });
const pages = pagesOf();
if (!pages.has(name))
  fail(
    `Not in dist/: ${name}.\nThe pages: ${[...pages.keys()].sort().join(", ")}.`,
  );
const server = await serve();
const browser = await launch(server.close);
const width = Math.round(design.width);
const height = heightAsked || target._window?.[1] || 900;

// Runs in the page: every element tied to the design, placed from its band's top
const read = () => {
  const out = [];
  for (const el of document.querySelectorAll("[data-figma]")) {
    const band = el.closest("[data-figma-band]");
    const r = el.getBoundingClientRect();
    const top = band ? band.getBoundingClientRect().top : -scrollY;
    const cs = getComputedStyle(el);
    // the first letter the element shows at its own size (a small label before a large title is not its first
    // line): where that line starts, and its middle
    const own = parseFloat(cs.fontSize);
    let glyph = null;
    let first = null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n && !glyph; n = walker.nextNode()) {
      const at = n.data.search(/\S/);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(n, at);
      range.setEnd(n, at + 1);
      const box = range.getClientRects()[0];
      if (!box || !box.height) continue;
      const found = {
        left: box.left,
        middle: box.top + box.height / 2 - top,
        size: parseFloat(getComputedStyle(n.parentElement).fontSize),
      };
      first ??= found;
      if (Math.abs(found.size - own) < 0.05) glyph = found;
    }
    glyph ??= first;
    const size = glyph ? glyph.size : own;
    out.push({
      id: el.dataset.figma,
      band: band ? band.dataset.figmaBand : "",
      bandTop: band ? parseFloat(band.dataset.bandTop || "0") : 0,
      left: r.left,
      right: r.right,
      top: r.top - top,
      w: r.width,
      h: r.height,
      glyph,
      size,
      visible: cs.visibility !== "hidden" && r.width > 0 && r.height > 0,
    });
  }
  return out;
};

const page = await browser.newPage({
  viewport: { width, height },
  reducedMotion: "reduce",
});
const logged = [];
page.on("pageerror", (e) => logged.push(e.message));
await prepare(page, { name, width });
await page.goto(server.base + pages.get(name), { waitUntil: "load" });
await page.evaluate(opening);
// down and back: what waits to be seen (a lazy image, a reveal) is in
await page.evaluate(async () => {
  scrollTo(0, document.body.scrollHeight);
  await new Promise((done) => setTimeout(done, 400));
  scrollTo(0, 0);
});
await page.waitForTimeout(SETTLE);
if (hover) {
  await page.hover(hover);
  await page.waitForTimeout(200);
}
const built = await page.evaluate(read);
await browser.close();
server.close();

/* ------------------------------------------------------------------ each element against the design and the target */
const rows = [];
for (const e of built) {
  const f = design.elements.get(e.id);
  if (!f) continue;
  if (only && e.band !== only) continue;
  const text = f.kind === "text" && e.glyph;
  // the design's place, in its band; a text by its first line's middle
  const fy = (text ? f.y + f.lineHeight / 2 : f.y) - e.bandTop;
  const by = text ? e.glyph.middle : e.top;
  let fx = f.x;
  let bx = text ? e.glyph.left : e.left;
  if (f.align === "right") [fx, bx] = [f.x + f.w, e.right];
  if (f.align === "center") [fx, bx] = [f.x + f.w / 2, (e.left + e.right) / 2];
  const [dx, dy] = [bx - fx, by - fy];
  const t = target[e.id] ?? {};
  let [ex, ey] = t.d ?? [0, 0];
  if (t.abs) [ex, ey] = [t.abs[0] - fx, t.abs[1] - fy];
  if (t.abs_x !== undefined) ex = t.abs_x - fx;
  const [rx, ry] = [dx - ex, dy - ey];
  // a text of the design the page shows as a picture (a logo) has a place, no size
  const sizeOff = text ? e.size - (t.size ?? f.size) : 0;
  rows.push({
    id: e.id,
    band: e.band,
    kind: f.kind,
    label: f.label.replace(/\s+/g, " ").slice(0, 26),
    visible: e.visible,
    x: [bx, fx, dx],
    y: [by, fy, dy],
    left: [rx, ry],
    size: text ? [e.size, t.size ?? f.size] : null,
    box: text ? null : [e.w, f.w, e.h, f.h],
    onDesign:
      Math.abs(dx) <= PLACE &&
      Math.abs(dy) <= PLACE &&
      (!text || Math.abs(e.size - f.size) <= SIZE),
    onTarget:
      Math.abs(rx) <= PLACE &&
      Math.abs(ry) <= PLACE &&
      Math.abs(sizeOff) <= SIZE,
    decided: Boolean(target[e.id]),
    why: t.why ?? "",
  });
}
const linked = new Set(built.map((e) => e.id));
const unlinked = [...design.elements.keys()].filter((id) => !linked.has(id));
const unknown = [...linked].filter((id) => !design.elements.has(id));
const seen = rows.filter((r) => r.visible);
const off = seen.filter((r) => !r.onTarget);
const noWhy = Object.entries(target)
  .filter(([k, v]) => !k.startsWith("_") && !v.why)
  .map(([k]) => k);
const summary = {
  page: name,
  width,
  height,
  elements: seen.length,
  onDesign: seen.filter((r) => r.onDesign).length,
  onTarget: seen.length - off.length,
  decided: seen.filter((r) => r.decided).length,
  hidden: rows.length - seen.length,
  designElements: design.elements.size,
  notLinked: unlinked.length,
};

if (json) {
  console.log(JSON.stringify({ summary, off, rows }, null, 2));
  process.exit(off.length ? 1 : 0);
}
const n = (v, w = 7) => v.toFixed(1).padStart(w);
const signed = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`.padStart(6);
let band = null;
for (const r of rows) {
  if (r.band !== band) {
    band = r.band;
    console.log(`\n== ${band || "(no band)"}`);
  }
  const extra = r.size
    ? ` size ${r.size[0].toFixed(2)}/${Number(r.size[1]).toFixed(2)}`
    : ` w ${r.box[0].toFixed(1)}/${r.box[1].toFixed(1)} h ${r.box[2].toFixed(1)}/${r.box[3].toFixed(1)}`;
  console.log(
    `${r.onTarget || !r.visible ? "  " : "!!"} ${r.id.padStart(7)} ${r.label.padEnd(26)} x ${n(r.x[0])}/${n(r.x[1])} (${signed(r.x[2])})  y ${n(r.y[0])}/${n(r.y[1])} (${signed(r.y[2])})${extra}${r.visible ? "" : " (hidden)"}`,
  );
}
console.log(
  `\nMEASURE ${name} at ${width} x ${height}: ${summary.elements} visible elements | within ${PLACE} px of the raw design ${summary.onDesign} | within ${PLACE} px of the target ${summary.onTarget}${targetPath ? ` (${summary.decided} with an expected difference)` : " (no target file: the raw design is the target)"}`,
);
for (const r of off)
  console.log(
    `  off target: ${r.id} ${r.label}  ${signed(r.left[0])} ${signed(r.left[1])}${r.size && Math.abs(r.size[0] - r.size[1]) > SIZE ? `  size ${r.size[0].toFixed(2)} for ${r.size[1]}` : ""}`,
  );
if (summary.hidden)
  console.log(`  ${summary.hidden} hidden at this width, not counted`);
console.log(
  `  ${design.elements.size - unlinked.length} of the design's ${design.elements.size} elements are tied to the page (data-figma)`,
);
if (unknown.length)
  console.log(
    `  data-figma names ${unknown.length} node${unknown.length === 1 ? "" : "s"} the design file does not have: ${unknown.slice(0, 8).join(", ")}`,
  );
if (noWhy.length)
  console.log(
    `  ${noWhy.length} expected difference${noWhy.length === 1 ? "" : "s"} without a reason (why): ${noWhy.slice(0, 8).join(", ")}`,
  );
for (const line of logged) console.log(`  error in the page: ${line}`);
process.exit(off.length ? 1 : 0);
