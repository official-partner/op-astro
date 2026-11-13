// What the scripts that look at the built site share (shot, measure, widths, compare): the build when dist/ is behind,
// the pages dist/ holds, dist/ served as Cloudflare does, a browser already on the machine, and the wait for a page to
// be whole (its fonts, its loading screen gone, its lazy images in).
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

// The site: this repository, or another one's folder given as OP_SITE (a site not yet brought up to date, looked at
// with this copy of the scripts: OP_SITE=../other-site npm run widths -- accueil)
export const ROOT = path.resolve(
  process.env.OP_SITE ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."),
);
export const DIST = path.join(ROOT, "dist");
const SOURCES = ["src", "public", "astro.config.mjs", "op.config.json"];

export const seconds = (since) => ((Date.now() - since) / 1000).toFixed(1);
export const fail = (message) => {
  console.error(message);
  process.exit(1);
};
export const stat = (p) => statSync(p, { throwIfNoEntry: false });
export const shown = (file) => path.relative(process.cwd(), file);

/* ------------------------------------------------------------------ the build, when dist/ is behind */
const newest = (p) => {
  const s = stat(p);
  if (!s) return 0;
  if (!s.isDirectory()) return s.mtimeMs;
  return Math.max(
    s.mtimeMs,
    ...readdirSync(p).map((f) => newest(path.join(p, f))),
  );
};
// Builds when dist/ is missing or older than the sources, or when forced. The site.json line of the build is printed.
// `env` goes to the build (OP_RULES=warn: a script that only looks at the pages never stops on a rule).
export function buildIfStale({ force = false, env = {} } = {}) {
  const built = stat(path.join(DIST, "site.json"))?.mtimeMs ?? 0; // written last by every build
  if (
    !force &&
    Math.max(...SOURCES.map((p) => newest(path.join(ROOT, p)))) <= built
  )
    return false;
  const since = Date.now();
  process.stdout.write(
    built
      ? "Building (dist/ is older than the sources)... "
      : "Building (no build yet)... ",
  );
  const run = spawnSync("npm", ["run", "build"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  const log =
    `${run.error?.message ?? ""}${run.stdout ?? ""}${run.stderr ?? ""}`.replace(
      /\x1b\[[\d;]*m/g,
      "",
    );
  if (run.status !== 0) fail(`the build failed.\n\n${log}`);
  console.log(
    `done in ${seconds(since)} s. ${log.match(/site\.json: .*/)?.[0] ?? ""}`,
  );
  return true;
}

/* ------------------------------------------------------------------ the pages a build holds */
// accueil -> /, a-propos -> /a-propos/, 404 -> /404 (404.html), blog/un-article -> blog-un-article
export function pagesOf(dist = DIST) {
  const pages = new Map();
  if (!stat(dist)?.isDirectory()) return pages;
  for (const file of readdirSync(dist, { recursive: true }).map((f) =>
    f.split(path.sep).join("/"),
  )) {
    if (!file.endsWith(".html")) continue;
    const route = file.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
    pages.set(
      route ? route.replaceAll("/", "-") : "accueil",
      /(^|\/)index\.html$/.test(file)
        ? `/${route}${route && "/"}`
        : `/${route}`,
    );
  }
  return pages;
}
// what someone typed (/, a-propos/, blog/un-article.html) as a page's name
export const nameOf = (a) =>
  a
    .replace(/^\/+|\/+$|\.html$/g, "")
    .replaceAll("/", "-")
    .replace(/^(index)?$/, "accueil");

// The pages and the widths asked on a command line: a number is a width, unless it names a page (404); `all` is every
// page. Fails, naming the pages there are, on one that is not in the build.
export function asked(args, pages, defaults) {
  const isWidth = (a) => /^\d+$/.test(a) && !pages.has(a);
  const widths = args.filter(isWidth).map(Number);
  const words = args.filter((a) => !a.startsWith("--") && !isWidth(a));
  if (!widths.length) widths.push(...defaults);
  if (widths.some((w) => w < 240 || w > 3840))
    fail(`A width between 240 and 3840, please (${widths.join(", ")}).`);
  const names = words.includes("all")
    ? [...pages.keys()].sort()
    : [...new Set(words.map(nameOf))];
  const missing = names.filter((n) => !pages.has(n));
  if (missing.length)
    fail(
      `Not in dist/: ${missing.join(", ")}.\nThe pages: ${[...pages.keys()].sort().join(", ")}.`,
    );
  return { names, widths };
}

/* ------------------------------------------------------------------ a build served as Cloudflare does */
const TYPES = {
  html: "text/html; charset=utf-8",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  xml: "application/xml",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp4: "video/mp4",
  webm: "video/webm",
  webmanifest: "application/manifest+json",
};
// A folder's index.html, 404.html for what is missing. Returns its address and how to close it.
export async function serve(dist = DIST) {
  const fileFor = (url) => {
    let p;
    try {
      p = path.join(
        dist,
        decodeURIComponent(new URL(url, "http://x").pathname),
      );
    } catch {
      return null;
    }
    if (path.relative(dist, p).startsWith("..")) return null;
    return (
      [p, path.join(p, "index.html"), `${p}.html`].find((f) =>
        stat(f)?.isFile(),
      ) ?? null
    );
  };
  const server = createServer((req, res) => {
    const found = fileFor(req.url);
    const file = found ?? path.join(dist, "404.html");
    res.writeHead(found ? 200 : 404, {
      "content-type":
        TYPES[path.extname(file).slice(1)] ?? "application/octet-stream",
    });
    createReadStream(file)
      .on("error", () => res.end())
      .pipe(res);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => server.close(),
  };
}

/* ------------------------------------------------------------------ a browser already there */
const NAMES = [
  "chrome",
  "chrome.exe",
  "Chromium",
  "Google Chrome for Testing",
  "headless_shell",
  "headless_shell.exe",
  "chrome-headless-shell",
  "chrome-headless-shell.exe",
];
const installed = () => {
  const cache =
    { darwin: "Library/Caches", win32: "AppData/Local" }[process.platform] ??
    ".cache";
  for (const root of [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), cache, "ms-playwright"),
  ]) {
    if (!root || !stat(root)?.isDirectory()) continue;
    // a full Chromium before a headless shell, the newest first
    const dirs = readdirSync(root)
      .filter((d) => /^chromium(_headless_shell)?-\d+$/.test(d))
      .sort(
        (a, b) =>
          a.includes("headless") - b.includes("headless") ||
          b.split("-")[1] - a.split("-")[1],
      );
    for (const dir of dirs) {
      const exe = readdirSync(path.join(root, dir), { recursive: true }).find(
        (f) =>
          NAMES.includes(path.basename(f)) &&
          stat(path.join(root, dir, f))?.isFile(),
      );
      if (exe) return path.join(root, dir, exe);
    }
  }
};
// No browser is downloaded: SHOT_BROWSER (a Chrome or Chromium executable), else the browsers Playwright already
// installed (PLAYWRIGHT_BROWSERS_PATH, or its own cache), else the installed Chrome. `onFail` runs before it gives up.
export async function launch(onFail = () => {}) {
  const executablePath = process.env.SHOT_BROWSER || installed();
  try {
    return await chromium.launch(
      executablePath ? { executablePath } : { channel: "chrome" },
    );
  } catch (error) {
    onFail();
    fail(
      `No browser to look at the site with (${executablePath ?? "no Playwright browser, no Google Chrome"}).\n` +
        "Install Google Chrome (https://www.google.com/chrome/), or set SHOT_BROWSER to a Chrome or Chromium executable.\n" +
        error.message.split("\n")[0],
    );
  }
}

/* ------------------------------------------------------------------ a page, whole */
// Runs in the page: its fonts, its loading screen leaving or gone (html[data-loader], docs/finishes.md) and a
// cover of its own gone (html[data-loading]), then every lazy image loaded now, so the whole page has them.
export const opening = async () => {
  const root = document.documentElement;
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const covered = () =>
    root.dataset.loader === "play" || root.hasAttribute("data-loading");
  await document.fonts.ready;
  for (let t = 0; covered() && t < 5000; t += 50) await wait(50);
  // Every image now, each one whole before the picture is taken. A lazy image with sizes="auto" would pick another
  // file once it is no longer lazy (auto then means the whole window) and show nothing while that one loads: it is
  // given the width it has, so the same file is picked. (Nov 12: one shot in four of the starter's components page
  // had its photo missing.)
  const images = [...document.images];
  for (const image of images) {
    if (/^auto\b/i.test(image.getAttribute("sizes")?.trim() ?? "")) {
      const width = Math.ceil(image.getBoundingClientRect().width);
      if (width) image.sizes = `${width}px`;
    }
    image.decoding = "sync";
    image.loading = "eager";
  }
  const whole = (image) =>
    new Promise((done) => {
      const check = () => (image.complete ? done() : setTimeout(check, 50));
      setTimeout(check, 50);
    }).then(() => image.decode().catch(() => {}));
  await Promise.race([Promise.all(images.map(whole)), wait(10000)]);
  await document.fonts.ready;
};
export const SETTLE = 400; // ms after the opening, for what moves last

// A page of the build opened at a width, whole and settled, reduced motion asked (the reveals in their final state).
// Returns the page and what its console said wrong.
export async function open(
  browser,
  url,
  { width, height = 900, motion = "reduce" } = {},
) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: motion,
  });
  const logged = [];
  page.on("console", (m) => {
    if (m.type() === "error") logged.push(m.text());
  });
  page.on("pageerror", (e) => logged.push(e.message));
  const response = await page.goto(url, { waitUntil: "load" });
  if (!response?.ok()) logged.push(`HTTP ${response?.status()} for ${url}`);
  await page.evaluate(opening);
  await page.waitForTimeout(SETTLE);
  return { page, logged };
}
