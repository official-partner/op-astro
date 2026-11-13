// Full-page pictures of the built site, to look at what a change did (Official Partner, Oct 18, 2026).
//
//   npm run shot -- <page...> [width...] [--build] [--parts]
//   npm run shot -- coachs-fitness 1300 390      npm run shot -- / composantes      npm run shot -- all 390
//
// A page is named by its route: accueil (or /) for the home, a-propos, coachs-fitness, 404, or all. The widths are
// 1440 and 390 unless given. Each picture is shots/<page>-<width>.png (git-ignored): the window at that width and 900
// high, the whole page taken by the browser's full-page screenshot, with reduced motion asked (the reveals in their
// final state), once the fonts are loaded, the loading screen gone, the lazy images in and the page settled. With
// --parts, the page also in parts 1800 px high, <page>-<width>-<n>.png: a long picture is shrunk when it is read, its
// parts are not.
//
// With --loader, the loading screen instead, frame by frame, without reduced motion and with ?op-loader (Oct 27): every
// frame the browser paints, shots/loader/<page>-<width>/<n>-<ms>.jpg, a contact sheet of them,
// shots/loader-<page>-<width>.png, and its timeline (when it covers, leaves and is gone, its ground, any layout shift).
//
// It builds first when dist/ is missing or older than the sources, or with --build; serves dist/ itself as Cloudflare
// does (a folder's index.html, 404.html for what is missing); and fails, saying why, on a page that is not in dist/ or
// an error in the browser's console. No browser is downloaded: SHOT_BROWSER (a Chrome or Chromium executable), else
// the browsers Playwright already installed (PLAYWRIGHT_BROWSERS_PATH, or its own cache), else the installed Chrome.
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ROOT,
  SETTLE,
  asked,
  buildIfStale,
  fail,
  launch,
  opening,
  pagesOf,
  seconds,
  serve,
  shown,
} from "./lib/site.mjs";

const OUT = path.join(ROOT, "shots");
const HEIGHT = 900; // the window's height; the picture is the whole page
const PART = 1800; // --parts: each part's height
const started = Date.now();

const args = process.argv.slice(2);
const USAGE =
  "Which page? npm run shot -- <page...> [width...] [--build] [--parts] [--loader]\n  npm run shot -- coachs-fitness 1300 390\n  npm run shot -- all 390";
if (!args.some((a) => !a.startsWith("--"))) fail(USAGE);

// a picture is taken whatever the rules say: one looks at the pages while fixing them
buildIfStale({ force: args.includes("--build"), env: { OP_RULES: "warn" } });
const pages = pagesOf();
const { names, widths } = asked(args, pages, [1440, 390]);
if (!names.length) fail(USAGE);
const server = await serve();
const base = server.base;
const browser = await launch(server.close);

/* ------------------------------------------------------------------ --loader: the loading screen, frame by frame */
// The site's loader as a visitor sees it: motion on, ?op-loader so it plays, each painted frame kept (Chromium's
// screencast), the page's state logged at every animation frame, then a contact sheet drawn by the browser itself.
const loaderFrames = async () => {
  const shift = () => {
    window.__opLoader = { log: [], shift: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__opLoader.shift += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    const t0 = performance.now();
    let last = "";
    const tick = () => {
      const root = document.documentElement;
      const cover = document.querySelector(".loader_wrap");
      const main = document.querySelector("main");
      const style = cover && getComputedStyle(cover);
      const state = root?.dataset.loader ?? "";
      const key = `${state}|${style?.backgroundColor}|${main ? Math.round(main.getBoundingClientRect().top) : ""}`;
      if (key !== last)
        window.__opLoader.log.push({
          t: Math.round(performance.now() - t0),
          state,
          ground: style?.display !== "none" ? style?.backgroundColor : "",
          main: main ? Math.round(main.getBoundingClientRect().top) : null,
        });
      last = key;
      if (performance.now() - t0 < 8000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const dir = path.join(OUT, "loader");
  for (const name of names) {
    for (const width of widths) {
      const height = width < 600 ? 844 : HEIGHT;
      const page = await browser.newPage({
        viewport: { width, height },
        reducedMotion: "no-preference",
      });
      const logged = [];
      page.on("pageerror", (e) => logged.push(e.message));
      page.on("console", (m) => m.type() === "error" && logged.push(m.text()));
      await page.addInitScript(shift);
      const cdp = await page.context().newCDPSession(page);
      const frames = [];
      cdp.on("Page.screencastFrame", (f) => {
        frames.push({ t: f.metadata.timestamp, data: f.data });
        cdp
          .send("Page.screencastFrameAck", { sessionId: f.sessionId })
          .catch(() => {});
      });
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: 75 });
      const route = pages.get(name);
      await page.goto(`${base}${route}?op-loader`, { waitUntil: "load" });
      const played = await page
        .waitForFunction(
          () =>
            window.__opLoader.log.some((e) => e.state) &&
            !document.documentElement.dataset.loader,
          null,
          { timeout: 7000, polling: 50 },
        )
        .then(() => true)
        .catch(() => false);
      await page.waitForTimeout(300);
      await cdp.send("Page.stopScreencast");
      const { log, shift: cls } = await page.evaluate(() => window.__opLoader);
      const out = path.join(dir, `${name}-${width}`);
      mkdirSync(out, { recursive: true });
      for (const f of readdirSync(out)) unlinkSync(path.join(out, f));
      frames.sort((a, b) => a.t - b.t);
      const first = frames[0]?.t ?? 0;
      const kept = frames.map((f, i) => {
        const ms = Math.round((f.t - first) * 1000);
        const file = `${String(i).padStart(3, "0")}-${ms}.jpg`;
        writeFileSync(path.join(out, file), Buffer.from(f.data, "base64"));
        return { ms, data: f.data };
      });
      // the sheet: 24 frames at most, evenly taken, in the browser's own page
      const step = Math.max(1, kept.length / 24);
      const picked = [];
      for (let i = 0; i < kept.length && picked.length < 24; i += step)
        picked.push(kept[Math.floor(i)]);
      const cols = width < 600 ? 8 : 6;
      const cell = width < 600 ? 180 : 300;
      const sheet = await browser.newPage({
        viewport: { width: cols * cell, height: 400 },
      });
      await sheet.setContent(
        `<body style="margin:0;font:12px system-ui;display:grid;grid-template-columns:repeat(${cols},${cell}px);background:#fff">${picked
          .map(
            (f) =>
              `<figure style="margin:0"><figcaption style="padding:2px 4px">${f.ms} ms</figcaption><img style="display:block;width:${cell}px" src="data:image/jpeg;base64,${f.data}"></figure>`,
          )
          .join("")}</body>`,
      );
      const png = path.join(OUT, `loader-${name}-${width}.png`);
      await sheet.screenshot({ path: png, fullPage: true });
      await sheet.close();
      await page.close();
      const at = (state) => log.find((e) => e.state === state)?.t;
      const gone = log.findLast?.((e) => !e.state)?.t;
      const ground = log.find((e) => e.state === "play")?.ground ?? "";
      const tops = [
        ...new Set(log.filter((e) => e.state !== "play").map((e) => e.main)),
      ];
      console.log(
        played
          ? `${shown(png)}  ${kept.length} frames in ${shown(out)}\n  covers at ${at("play")} ms on ${ground}, leaves at ${at("leave")} ms, gone at ${gone} ms; layout shift ${cls.toFixed(3)}${tops.length > 1 ? `, the page moved after it left (main at ${tops.join(", ")} px)` : ""}`
          : `${name} at ${width}: no loading screen played (op.config.json "loader" is off, or the page has no layout).`,
      );
      for (const line of logged) console.log(`  error: ${line}`);
      errors += logged.length;
    }
  }
};

/* ------------------------------------------------------------------ the shots */
mkdirSync(OUT, { recursive: true });
let errors = 0;
if (args.includes("--loader")) await loaderFrames();
for (const name of args.includes("--loader") ? [] : names) {
  for (const width of widths) {
    const since = Date.now();
    const page = await browser.newPage({
      viewport: { width, height: HEIGHT },
      reducedMotion: "reduce",
    });
    const logged = [];
    page.on("console", (m) => {
      const where = m.location()?.url?.replace(base, "");
      if (m.type() === "error")
        logged.push(`${m.text()}${where ? ` (${where})` : ""}`);
    });
    page.on("pageerror", (e) => logged.push(e.message));
    try {
      const response = await page.goto(base + pages.get(name), {
        waitUntil: "load",
      });
      if (!response?.ok())
        logged.push(`HTTP ${response?.status()} for ${pages.get(name)}`);
      await page.evaluate(opening);
      await page.waitForTimeout(SETTLE);
      const png = await page.screenshot({
        fullPage: true,
        animations: "disabled",
      });
      const file = path.join(OUT, `${name}-${width}.png`);
      const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
      writeFileSync(file, png);
      console.log(`${shown(file)}  ${w} x ${h}  ${seconds(since)} s`);
      // the parts an earlier run left go; with --parts, new ones
      const prefix = `${name}-${width}-`;
      const isPart = (f) =>
        f.startsWith(prefix) && /^\d+\.png$/.test(f.slice(prefix.length));
      for (const old of readdirSync(OUT).filter(isPart))
        unlinkSync(path.join(OUT, old));
      if (args.includes("--parts")) {
        for (let y = 0, n = 1; y < h; y += PART, n++) {
          const part = path.join(OUT, `${prefix}${n}.png`);
          const clip = { x: 0, y, width: w, height: Math.min(PART, h - y) };
          await page.screenshot({
            path: part,
            fullPage: true,
            clip,
            animations: "disabled",
          });
          console.log(`  ${shown(part)}  ${w} x ${clip.height} from ${y}`);
        }
      }
    } catch (error) {
      console.log(`${name} at ${width}: not taken.`);
      logged.push(error.message.split("\n")[0]);
    }
    await page.close();
    for (const line of logged) console.log(`  error: ${line}`);
    errors += logged.length;
  }
}
const version = browser.version();
await browser.close();
server.close();
const count = names.length * widths.length;
console.log(
  `${count} shot${count > 1 ? "s" : ""} in ${seconds(started)} s (Chromium ${version})${errors ? `, ${errors} error${errors > 1 ? "s" : ""} (above)` : ""}.`,
);
process.exit(errors ? 1 : 0);
