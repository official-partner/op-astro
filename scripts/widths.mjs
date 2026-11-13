// A page checked at the other widths: what the measure at the design's width cannot see (Official Partner, Nov 12,
// 2026; from the checks written for Tranter on Nov 10: its grid, rail, media and line-break checks).
//
//   npm run widths -- <page...> [width...] [--verbose]
//   npm run widths -- accueil            npm run widths -- all            npm run widths -- a-propos 1100 1280
//
// Nine widths unless given: 320, 390, 768, 1024, 1280, 1440, 1536, 1728 and 1920, and the system's reference width
// (--viewport-max) when it is none of them. At each one:
//
//   overflow      nothing makes the page scroll sideways, from 320 px. The elements that stick out are named.
//   grid          every page grid (.site-grid, the one grid a site declares in project.css) sits on the site's margin
//                 and width: a section that redeclares the grid, or loses its margin at some widths, shows here.
//   media         every image frame (.media) starts and ends on a column of its grid.
//   proportion    on a two-segment scale (--viewport-min at 1024 or so: the computer segment scales as one piece),
//                 every element tied to the design (data-figma) and every child of a page grid keeps its place of the
//                 reference width, times the width over the reference width. Only a text held at its floor size may
//                 differ, and it must not move its neighbours.
//   line breaks   on that same segment, the large headings (h1, h2, the display style) break on the same words as at
//                 the reference width. A last line of one word is listed, without failing.
//
// A check a page has nothing for is left out and said (a site without .site-grid, a page without data-figma). It
// exits 1 when one fails.
import {
  SETTLE,
  asked,
  buildIfStale,
  fail,
  launch,
  opening,
  pagesOf,
  seconds,
  serve,
} from "./lib/site.mjs";

const WIDTHS = [320, 390, 768, 1024, 1280, 1440, 1536, 1728, 1920];
const started = Date.now();
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
if (!args.some((a) => !a.startsWith("--")))
  fail(
    "Which page? npm run widths -- <page...> [width...] [--verbose]\n  npm run widths -- accueil\n  npm run widths -- all",
  );
buildIfStale({ env: { OP_RULES: "warn" } });
const pages = pagesOf();
const { names, widths } = asked(args, pages, []);
const server = await serve();
const browser = await launch(server.close);

// Runs in the page: what the checks need, at this width
const read = () => {
  const root = document.documentElement;
  const vw = root.clientWidth;
  const probe = (value) => {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;visibility:hidden;width:${value}`;
    document.body.appendChild(d);
    const w = d.getBoundingClientRect().width;
    d.remove();
    return w;
  };
  const number = (name) =>
    parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  const shows = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return (
      cs.visibility !== "hidden" &&
      cs.display !== "none" &&
      r.width > 0 &&
      r.height > 0
    );
  };
  const named = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${[...el.classList]
      .slice(0, 2)
      .map((c) => `.${c}`)
      .join("")}`;

  // overflow: what sticks out on the right and is not cut by a parent
  const over = root.scrollWidth - vw;
  const sticking = [];
  if (over > 0) {
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right <= vw + 0.5 || !shows(el)) continue;
      let cut = false;
      for (
        let p = el.parentElement;
        p && p !== document.body;
        p = p.parentElement
      )
        if (getComputedStyle(p).overflowX !== "visible") {
          cut = true;
          break;
        }
      if (cut || getComputedStyle(el).position === "fixed") continue;
      sticking.push({ el: named(el), by: r.right - vw });
    }
    sticking.sort((a, b) => b.by - a.by);
  }

  // the page grids: on the site's margin and width
  const margin = probe("var(--site-margin)");
  const maxWidth = probe("var(--max-width-main)");
  const width = Math.min(vw - 2 * margin, maxWidth || Infinity);
  const left = (vw - width) / 2;
  const grids = [
    ...document.querySelectorAll(".site-grid:not(.review-grid)"),
  ].filter((g) => !g.parentElement.closest(".site-grid") && shows(g));
  const offGrid = grids
    .map((g) => [g, g.getBoundingClientRect()])
    .filter(
      ([, r]) =>
        Math.abs(r.left - left) > 0.5 || Math.abs(r.width - width) > 0.5,
    )
    .map(
      ([g, r]) =>
        `${named(g.closest("section, header, footer, main > *") ?? g)}: left ${r.left.toFixed(1)} for ${left.toFixed(1)}, width ${r.width.toFixed(1)} for ${width.toFixed(1)}`,
    );

  // the image frames: on a column of their grid
  const columns = (g) => {
    const cs = getComputedStyle(g);
    const tracks = cs.gridTemplateColumns
      .split(" ")
      .filter((s) => s.endsWith("px"))
      .map(parseFloat);
    const gap = parseFloat(cs.columnGap) || 0;
    const starts = [];
    const ends = [];
    let x =
      g.getBoundingClientRect().left +
      (parseFloat(cs.paddingLeft) || 0) +
      (parseFloat(cs.borderLeftWidth) || 0);
    for (const t of tracks) {
      starts.push(x);
      ends.push(x + t);
      x += t + gap;
    }
    return { starts, ends };
  };
  const media = [];
  for (const m of document.querySelectorAll(".media")) {
    const g = m.closest(".site-grid");
    if (!g || !shows(m)) continue;
    const { starts, ends } = columns(g);
    const r = m.getBoundingClientRect();
    const s = starts.findIndex((v) => Math.abs(v - r.left) < 1);
    const e = ends.findIndex((v) => Math.abs(v - r.right) < 1);
    media.push({
      name:
        m.dataset.figma ||
        (m.querySelector("img")?.getAttribute("src") || "")
          .split("/")
          .pop()
          .split("?")[0] ||
        named(m),
      on: s >= 0 && e >= 0,
      left: r.left,
      right: r.right,
    });
  }

  // what must keep its place in proportion: the elements tied to the design, and the page grids' children
  const places = {};
  document.querySelectorAll("[data-figma]").forEach((el, i) => {
    if (!shows(el)) return;
    const r = el.getBoundingClientRect();
    places[`${el.dataset.figma}#${i}`] = {
      left: r.left,
      right: r.right,
      what:
        (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 26) ||
        named(el),
    };
  });
  grids.forEach((g, i) =>
    [...g.children].forEach((el, j) => {
      if (!shows(el) || el.hasAttribute("data-figma")) return;
      const r = el.getBoundingClientRect();
      places[`grid ${i + 1} child ${j + 1}`] = {
        left: r.left,
        right: r.right,
        what: named(el),
      };
    }),
  );

  // the large headings, line by line
  const headings = [];
  document
    .querySelectorAll(
      'h1, h2, [class*="text-style-display"], [class*="text-style-h1"], [class*="text-style-h2"]',
    )
    .forEach((el, i) => {
      if (!shows(el) || el.closest("dialog:not([open]), template")) return;
      const lines = [];
      let line = [];
      let last = null;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (const m of n.data.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const box = range.getClientRects()[0];
          if (!box) continue;
          if (last !== null && box.top - last > box.height * 0.5) {
            lines.push(line.join(" "));
            line = [];
          }
          line.push(m[0]);
          last = box.top;
        }
      }
      if (line.length) lines.push(line.join(" "));
      if (lines.length) headings.push({ key: `${named(el)}#${i}`, lines });
    });

  return {
    vw,
    over,
    sticking: sticking.slice(0, 5),
    grids: grids.length,
    offGrid,
    media,
    places,
    headings,
    min: number("--viewport-min"),
    max: number("--viewport-max"),
  };
};

// The window's height: a screen of that width (a phone and a tablet upright, a computer at 16:10, 900 at least), so
// what fills the screen (an opening at 100svh) is as tall as people see it
const heightFor = (width) =>
  width < 600
    ? Math.round(width * 2.16)
    : width < 1024
      ? Math.round(width * 1.333)
      : Math.max(900, Math.round(width * 0.625));
const load = async (name, width) => {
  const page = await browser.newPage({
    viewport: { width, height: heightFor(width) },
    reducedMotion: "reduce",
  });
  await page.goto(server.base + pages.get(name), { waitUntil: "load" });
  await page.evaluate(opening);
  await page.waitForTimeout(SETTLE);
  const result = await page.evaluate(read);
  await page.close();
  return result;
};

let failures = 0;
for (const name of names) {
  // the system's own widths, read from the page
  const first = await load(name, 1440);
  const reference = Math.round(first.max) || 1440;
  const twoSegments = first.min >= 960; // the computer segment scales as one piece
  const list = widths.length
    ? widths
    : [...new Set([...WIDTHS, reference])].sort((a, b) => a - b);
  const ref = twoSegments ? await load(name, reference) : null;
  console.log(
    `\n== ${name}  (reference width ${reference}${twoSegments ? `, computer segment from ${first.min}` : ", one fluid line: no proportion check"})`,
  );
  const skipped = [];
  if (!first.grids) skipped.push("no .site-grid");
  if (!first.media.length) skipped.push("no .media in a page grid");
  if (twoSegments && !Object.keys(ref.places).length)
    skipped.push("nothing tied to the design");
  for (const width of list) {
    const r =
      width === 1440
        ? first
        : width === reference && ref
          ? ref
          : await load(name, width);
    const lines = [];
    const parts = [`overflow ${r.over > 0 ? `${r.over} px` : "0"}`];
    if (r.over > 0) {
      failures++;
      lines.push(
        ...(r.sticking.length
          ? r.sticking.map(
              (s) => `sticks out by ${s.by.toFixed(0)} px: ${s.el}`,
            )
          : ["the page scrolls sideways; no element found sticking out"]),
      );
    }
    if (r.grids) {
      parts.push(`grids ${r.grids} off ${r.offGrid.length}`);
      failures += r.offGrid.length;
      lines.push(...r.offGrid.map((g) => `off the site grid: ${g}`));
    }
    if (r.media.length) {
      const off = r.media.filter((m) => !m.on);
      parts.push(`media ${r.media.length} off ${off.length}`);
      failures += off.length;
      lines.push(
        ...off.map(
          (m) =>
            `off its columns: ${m.name} (${m.left.toFixed(1)} to ${m.right.toFixed(1)})`,
        ),
      );
    }
    if (
      ref &&
      width >= first.min &&
      width <= reference &&
      width !== reference
    ) {
      const k = r.vw / ref.vw;
      const off = [];
      for (const [key, e] of Object.entries(ref.places)) {
        const c = r.places[key];
        if (!c) continue;
        const [dl, dr] = [c.left - e.left * k, c.right - e.right * k];
        if (Math.abs(dl) > 1 && Math.abs(dr) > 1)
          off.push(
            `out of proportion: ${key.split("#")[0]} ${e.what}  left ${c.left.toFixed(1)} for ${(e.left * k).toFixed(1)}`,
          );
      }
      parts.push(
        `proportion ${Object.keys(ref.places).length} off ${off.length}`,
      );
      failures += off.length;
      lines.push(
        ...off.slice(0, 20),
        ...(off.length > 20 ? [`and ${off.length - 20} more`] : []),
      );
      const before = new Map(ref.headings.map((h) => [h.key, h.lines]));
      const changed = r.headings.filter(
        (h) =>
          before.has(h.key) &&
          before.get(h.key).join("|") !== h.lines.join("|"),
      );
      parts.push(`headings ${r.headings.length} changed ${changed.length}`);
      failures += changed.length;
      lines.push(
        ...changed.map(
          (h) =>
            `breaks differently: ${h.key.split("#")[0]}  ${h.lines.join(" / ")}  (at ${reference}: ${before.get(h.key).join(" / ")})`,
        ),
      );
    }
    const orphans = r.headings.filter(
      (h) => h.lines.length > 1 && h.lines.at(-1).split(" ").length === 1,
    );
    if (orphans.length) parts.push(`one-word last lines ${orphans.length}`);
    if (verbose)
      lines.push(
        ...orphans.map(
          (h) =>
            `one-word last line: ${h.key.split("#")[0]}  ${h.lines.join(" / ")}`,
        ),
      );
    console.log(`${String(width).padStart(5)} px  ${parts.join("  |  ")}`);
    for (const line of lines) console.log(`          ${line}`);
  }
  if (skipped.length) console.log(`  left out: ${skipped.join("; ")}`);
}
await browser.close();
server.close();
console.log(
  `\nWIDTHS: ${failures} failure${failures === 1 ? "" : "s"} on ${names.length} page${names.length === 1 ? "" : "s"} in ${seconds(started)} s`,
);
process.exit(failures ? 1 : 0);
