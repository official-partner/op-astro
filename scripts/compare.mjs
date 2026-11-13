// A site compared with itself, before and after a change that must change nothing people see: a clean-up, a
// refactoring, an upgrade of the starter (Official Partner, Nov 12, 2026; from the scripts written for the review of
// Sani).
//
//   npm run compare -- save [page...] [width...]     keeps the site as it is now: the « before »
//   (the change)
//   npm run compare [-- page...]                     compares the site as it is now with the « before »
//
//   npm run compare -- save                          every page, at 1440 and 390
//   npm run compare -- save accueil coachs 1440      two pages at one width
//   npm run compare -- --no-interactions             the HTML and the pictures only (the quick one)
//
// Three things are compared, page by page:
//
//   the HTML        the built page, the names Astro gives its files aside. A page that differs shows its first lines.
//   the pictures    each page at each width, pixel by pixel. The « before » is taken twice: what differs between the
//                   two (a video, a ticker, a clock) is left out of the comparison and counted. A page that changed
//                   gets a picture in .compare/diff/, the changed pixels in red: look at it.
//   what answers    every button, summary, toggle and link to a place in the page is pressed, one at a time, and what
//                   it does is noted: a window that opens, a panel, the focus, where the page went, how much moved.
//                   The same press must do the same thing after. A form is never sent, a link out is never followed.
//                   The site's frame (the nav, the footer, what is outside <main>) is pressed on the first page only.
//
// Everything is kept in .compare/ (git-ignored). It exits 1 when something differs: a difference that was meant is
// said in the reply and in PROJECT.md, then `save` again.
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { PNG } from "pngjs";
import {
  DIST,
  ROOT,
  asked,
  buildIfStale,
  fail,
  launch,
  open,
  pagesOf,
  seconds,
  serve,
  shown,
  stat,
} from "./lib/site.mjs";

const STORE = path.join(ROOT, ".compare");
const BEFORE = path.join(STORE, "before");
const AFTER = path.join(STORE, "after");
const DIFF = path.join(STORE, "diff");
const TOLERANCE = 24; // a channel's difference under this is the same pixel (a font's edge drawn again)
const PRESSES = 40; // triggers pressed on a page, at most
const started = Date.now();

const args = process.argv.slice(2);
const saving = args[0] === "save";
if (saving) args.shift();
const interactions = !args.includes("--no-interactions");

buildIfStale({ env: { OP_RULES: "warn" } });
const pages = pagesOf();

/* ------------------------------------------------------------------ what is compared */
let plan;
if (saving) {
  const { names, widths } = asked(
    args.length ? args : ["all"],
    pages,
    [1440, 390],
  );
  // the home first: the site's frame is pressed there
  const home = (a, b) => (b === "accueil") - (a === "accueil");
  plan = {
    names: (names.length ? names : [...pages.keys()].sort()).sort(home),
    widths,
  };
} else {
  if (!stat(path.join(BEFORE, "plan.json")))
    fail(
      "Nothing to compare with yet: npm run compare -- save, before the change.",
    );
  const kept = JSON.parse(readFileSync(path.join(BEFORE, "plan.json"), "utf8"));
  const { names, widths } = asked(
    args,
    new Map(kept.names.map((n) => [n, pages.get(n) ?? ""])),
    kept.widths,
  );
  plan = { ...kept, names: names.length ? names : kept.names, widths };
}

/* ------------------------------------------------------------------ the HTML, the names of Astro's files aside */
const tidy = (html) =>
  html
    .replace(/\/_astro\/([\w.@-]+?)\.[\w-]{8}\.(\w+)/g, "/_astro/$1.HASH.$2")
    .replace(/(astro-island[^>]*?\buid=")[^"]+"/g, '$1"')
    .replace(/>\s*</g, ">\n<")
    .split("\n");
const htmlFile = (dist, route) =>
  [
    path.join(dist, route, "index.html"),
    path.join(dist, `${route.replace(/\/$/, "")}.html`),
  ].find((f) => stat(f)?.isFile());

/* ------------------------------------------------------------------ a page's picture */
const server = await serve();
const browser = await launch(server.close);
const shoot = async (name, width) => {
  const { page } = await open(browser, server.base + pages.get(name), {
    width,
  });
  const png = await page.screenshot({ fullPage: true, animations: "disabled" });
  await page.close();
  return png;
};
// The pixels that differ between two pictures of the same size: their count, their box, and the list as a mask
const differ = (a, b, mask) => {
  const out = new Uint8Array(a.width * a.height);
  let count = 0;
  let box = null;
  for (let i = 0, p = 0; p < out.length; i += 4, p++) {
    if (mask?.[p]) continue;
    if (
      Math.abs(a.data[i] - b.data[i]) > TOLERANCE ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > TOLERANCE ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > TOLERANCE
    ) {
      out[p] = 1;
      count++;
      const [x, y] = [p % a.width, Math.floor(p / a.width)];
      box = box
        ? [
            Math.min(box[0], x),
            Math.min(box[1], y),
            Math.max(box[2], x),
            Math.max(box[3], y),
          ]
        : [x, y, x, y];
    }
  }
  return { count, box, mask: out };
};

/* ------------------------------------------------------------------ what answers a press */
// Runs in the page: the state a press may change, small enough to compare
const state = () => {
  const root = document.documentElement;
  const said = (el) =>
    (
      el.getAttribute("aria-label") ||
      el.textContent ||
      el.getAttribute("href") ||
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  const active = document.activeElement;
  let shown = 0;
  const all = document.body.querySelectorAll("*");
  for (const el of all) if (el.offsetWidth || el.offsetHeight) shown++;
  return {
    address: location.pathname + location.hash,
    windows: [...document.querySelectorAll("dialog[open]")]
      .map((d) => d.dataset.dialog || d.id || d.className.split(" ")[0])
      .join(", "),
    expanded: [...document.querySelectorAll('[aria-expanded="true"]')]
      .map(said)
      .join(" | "),
    details: document.querySelectorAll("details[open]").length,
    focus:
      !active || active === document.body
        ? ""
        : `${active.tagName.toLowerCase()} ${said(active)}`,
    shown,
    scrolled: Math.round(scrollY / 50) * 50,
    marks: [...root.attributes]
      .filter((a) => a.name.startsWith("data-") || a.name === "class")
      .map((a) => `${a.name}=${a.value}`)
      .sort()
      .join(" "),
  };
};
// Runs in the page: what can be pressed, marked so each can be found again
const triggers = (frameToo) => {
  const said = (el) =>
    (
      el.getAttribute("aria-label") ||
      el.textContent ||
      el.getAttribute("href") ||
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  const seen = new Map();
  const list = [];
  for (const el of document.querySelectorAll(
    'button, [role="button"], summary, [aria-expanded], [aria-controls], a[href^="#"]',
  )) {
    if (
      !(el.offsetWidth || el.offsetHeight) ||
      getComputedStyle(el).visibility === "hidden"
    )
      continue;
    if (el.closest("dialog:not([open]), [inert], [hidden]")) continue;
    if (
      el.matches(
        'a[href="#"], [disabled], [aria-disabled="true"], [target="_blank"], [download]',
      )
    )
      continue;
    // a form is never sent
    if (
      el.matches('[type="submit"]') ||
      (el.matches("button:not([type])") && el.closest("form"))
    )
      continue;
    if (!frameToo && !el.closest("main")) continue;
    const key = `${el.tagName.toLowerCase()} « ${said(el)} »`;
    const nth = (seen.get(key) ?? 0) + 1;
    seen.set(key, nth);
    const id = `${key}${nth > 1 ? ` (${nth})` : ""}`;
    el.setAttribute("data-compare-trigger", String(list.length));
    list.push(id);
  }
  return list;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const effectOf = (before, after) => {
  const effect = {};
  for (const key of Object.keys(before))
    if (before[key] !== after[key])
      effect[key] = key === "shown" ? after[key] - before[key] : after[key];
  return effect;
};
const press = async (name, width, frameToo) => {
  const url = server.base + pages.get(name);
  let page;
  // the page loaded and at rest; an alert is dismissed, a new tab closed
  const load = async () => {
    if (page) await page.close();
    ({ page } = await open(browser, url, { width }));
    page.on("dialog", (d) => d.dismiss().catch(() => {}));
    page.context().on("page", (popup) => popup.close().catch(() => {}));
    return page.evaluate(triggers, frameToo);
  };
  let list = await load();
  const rest = await page.evaluate(state);
  // the page's state, without what a press always changes (the focus it takes, the scroll that brings it in view)
  const calm = (s) => ({ ...s, focus: "", scrolled: 0, address: "" });
  const results = [];
  for (let i = 0; i < Math.min(list.length, PRESSES); i++) {
    const id = list[i];
    const trigger = page.locator(`[data-compare-trigger="${i}"]`).first();
    let effect;
    let left = false; // the press led to another page
    try {
      await trigger.evaluate(
        (el) => {
          el.scrollIntoView({ block: "center" });
          el.focus({ preventScroll: true });
          el.click();
        },
        null,
        { timeout: 3000 },
      );
      await page.waitForTimeout(350);
      left = new URL(page.url()).pathname !== new URL(url).pathname;
      if (left) effect = { address: new URL(page.url()).pathname };
      else {
        const now = await page.evaluate(state);
        // where the page scrolled counts only when the press was a link to a place in it
        const moved = now.address !== rest.address;
        effect = effectOf(
          { ...rest, focus: "", scrolled: 0 },
          { ...now, scrolled: moved ? now.scrolled : 0 },
        );
      }
    } catch (error) {
      effect = { failed: error.message.split("\n")[0].slice(0, 80) };
      left = true;
    }
    results.push({ id, effect });
    // back to the page at rest: Escape, then the same press again; else the page is loaded again
    let back = false;
    if (!left) {
      const settle = async () => {
        await page.waitForTimeout(250);
        await page.evaluate(
          (address) => history.replaceState(history.state, "", address),
          rest.address,
        );
        return same(calm(await page.evaluate(state)), calm(rest));
      };
      try {
        await page.keyboard.press("Escape");
        back = await settle();
        if (!back) {
          await trigger.evaluate((el) => el.click(), null, { timeout: 2000 });
          back = await settle();
        }
        if (back)
          await page.evaluate(() => {
            document.activeElement?.blur?.();
            scrollTo(0, 0);
          });
      } catch {
        back = false;
      }
    }
    if (!back) list = await load();
  }
  await page.close();
  return { count: list.length, results };
};

/* ------------------------------------------------------------------ save: the « before » */
const png = (file) => PNG.sync.read(readFileSync(file));
if (saving) {
  rmSync(STORE, { recursive: true, force: true });
  mkdirSync(path.join(BEFORE, "shots"), { recursive: true });
  for (const [name, route] of pages) {
    const file = htmlFile(DIST, route);
    if (!file) continue;
    const to = path.join(BEFORE, "html", `${name}.html`);
    mkdirSync(path.dirname(to), { recursive: true });
    cpSync(file, to);
  }
  const unstable = [];
  for (const name of plan.names)
    for (const width of plan.widths) {
      const [one, two] = [await shoot(name, width), await shoot(name, width)];
      writeFileSync(path.join(BEFORE, "shots", `${name}-${width}.png`), one);
      const [a, b] = [PNG.sync.read(one), PNG.sync.read(two)];
      if (a.width !== b.width || a.height !== b.height) {
        writeFileSync(
          path.join(BEFORE, "shots", `${name}-${width}.unstable`),
          "height",
        );
        unstable.push(
          `${name} at ${width}: its height changes from one load to the next (${a.height} then ${b.height}): not compared`,
        );
        continue;
      }
      const d = differ(a, b);
      if (d.count) {
        writeFileSync(
          path.join(BEFORE, "shots", `${name}-${width}.mask`),
          d.mask,
        );
        unstable.push(
          `${name} at ${width}: ${d.count} pixels move by themselves (rows ${d.box[1]} to ${d.box[3]}): left out`,
        );
      }
    }
  const pressed = {};
  if (interactions)
    for (const [i, name] of plan.names.entries())
      for (const width of plan.widths)
        pressed[`${name} ${width}`] = await press(name, width, i === 0);
  writeFileSync(
    path.join(BEFORE, "pressed.json"),
    JSON.stringify(pressed, null, 1),
  );
  let commit = "";
  try {
    commit = execSync("git rev-parse --short HEAD", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {}
  writeFileSync(
    path.join(BEFORE, "plan.json"),
    JSON.stringify(
      { ...plan, commit, interactions, saved: new Date().toISOString() },
      null,
      1,
    ),
  );
  await browser.close();
  server.close();
  for (const line of unstable) console.log(`  ${line}`);
  const presses = Object.values(pressed).reduce(
    (n, p) => n + p.results.length,
    0,
  );
  console.log(
    `Kept as the « before »${commit ? ` (commit ${commit})` : ""}: ${pages.size} pages of HTML, ${plan.names.length * plan.widths.length} pictures${interactions ? `, ${presses} presses` : ""} in ${seconds(started)} s. Make the change, then npm run compare.`,
  );
  process.exit(0);
}

/* ------------------------------------------------------------------ compare: now against the « before » */
rmSync(AFTER, { recursive: true, force: true });
rmSync(DIFF, { recursive: true, force: true });
mkdirSync(path.join(AFTER, "shots"), { recursive: true });
mkdirSync(DIFF, { recursive: true });
const report = { html: [], pictures: [], presses: [], notes: [] };

// the HTML of every page kept, whatever pages were asked
const keptHtml = readdirSync(path.join(BEFORE, "html"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => f.replace(/\.html$/, ""));
let htmlSame = 0;
for (const name of keptHtml) {
  const file = pages.has(name) ? htmlFile(DIST, pages.get(name)) : null;
  if (!file) {
    report.html.push({ name, lines: ["the page is gone"] });
    continue;
  }
  const [a, b] = [
    tidy(readFileSync(path.join(BEFORE, "html", `${name}.html`), "utf8")),
    tidy(readFileSync(file, "utf8")),
  ];
  if (a.join("\n") === b.join("\n")) {
    htmlSame++;
    continue;
  }
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  )
    tail++;
  const [was, is] = [
    a.slice(head, a.length - tail),
    b.slice(head, b.length - tail),
  ];
  report.html.push({
    name,
    lines: [
      `from line ${head + 1}: ${was.length} line${was.length === 1 ? "" : "s"} became ${is.length}`,
      ...was.slice(0, 4).map((l) => `- ${l.slice(0, 200)}`),
      ...is.slice(0, 4).map((l) => `+ ${l.slice(0, 200)}`),
    ],
  });
}
for (const name of pages.keys())
  if (!keptHtml.includes(name))
    report.html.push({ name, lines: ["a new page"] });

// the pictures
let picturesSame = 0;
for (const name of plan.names)
  for (const width of plan.widths) {
    const before = path.join(BEFORE, "shots", `${name}-${width}.png`);
    if (!stat(before)) {
      report.notes.push(
        `${name} at ${width}: no picture was kept (save it with these pages and widths)`,
      );
      continue;
    }
    if (!pages.has(name)) continue;
    if (stat(before.replace(/\.png$/, ".unstable"))) {
      report.notes.push(
        `${name} at ${width}: its height changes from one load to the next, not compared`,
      );
      continue;
    }
    const now = await shoot(name, width);
    writeFileSync(path.join(AFTER, "shots", `${name}-${width}.png`), now);
    const [a, b] = [png(before), PNG.sync.read(now)];
    if (a.width !== b.width || a.height !== b.height) {
      report.pictures.push({
        name,
        width,
        what: `the page is ${b.height} px high, it was ${a.height}`,
      });
      continue;
    }
    const maskFile = before.replace(/\.png$/, ".mask");
    const mask = stat(maskFile) ? readFileSync(maskFile) : null;
    const d = differ(a, b, mask);
    if (!d.count) {
      picturesSame++;
      continue;
    }
    for (let p = 0; p < d.mask.length; p++)
      if (d.mask[p]) {
        b.data[p * 4] = 255;
        b.data[p * 4 + 1] = 0;
        b.data[p * 4 + 2] = 0;
        b.data[p * 4 + 3] = 255;
      }
    const out = path.join(DIFF, `${name}-${width}.png`);
    writeFileSync(out, PNG.sync.write(b));
    report.pictures.push({
      name,
      width,
      what: `${d.count} pixels (${((d.count / (a.width * a.height)) * 100).toFixed(3)} %) between rows ${d.box[1]} and ${d.box[3]}, columns ${d.box[0]} to ${d.box[2]}: ${shown(out)}`,
    });
  }

// what answers
let pressesSame = 0;
let pressesDone = 0;
if (interactions && plan.interactions !== false) {
  const kept = JSON.parse(
    readFileSync(path.join(BEFORE, "pressed.json"), "utf8"),
  );
  const first = JSON.parse(readFileSync(path.join(BEFORE, "plan.json"), "utf8"))
    .names[0];
  for (const name of plan.names)
    for (const width of plan.widths) {
      const was = kept[`${name} ${width}`];
      if (!was || !pages.has(name)) continue;
      const is = await press(name, width, name === first);
      const now = new Map(is.results.map((r) => [r.id, r.effect]));
      for (const r of was.results) {
        pressesDone++;
        if (!now.has(r.id))
          report.presses.push({
            name,
            width,
            id: r.id,
            what: "is no longer there to press",
          });
        else if (!same(r.effect, now.get(r.id)))
          report.presses.push({
            name,
            width,
            id: r.id,
            what: `did ${JSON.stringify(r.effect)}, now does ${JSON.stringify(now.get(r.id))}`,
          });
        else pressesSame++;
      }
      for (const r of is.results)
        if (!was.results.some((w) => w.id === r.id))
          report.presses.push({ name, width, id: r.id, what: "is new" });
      if (was.count > PRESSES)
        report.notes.push(
          `${name} at ${width}: ${was.count} things to press, the first ${PRESSES} pressed`,
        );
    }
}
await browser.close();
server.close();

/* ------------------------------------------------------------------ the report */
console.log(`\nHTML: ${htmlSame} of ${keptHtml.length} pages the same`);
for (const h of report.html) {
  console.log(`  ${h.name}`);
  for (const line of h.lines) console.log(`     ${line}`);
}
console.log(
  `\nPictures: ${picturesSame} of ${picturesSame + report.pictures.length} the same`,
);
for (const p of report.pictures)
  console.log(`  ${p.name} at ${p.width}: ${p.what}`);
if (interactions && plan.interactions !== false) {
  console.log(`\nPresses: ${pressesSame} of ${pressesDone} do the same`);
  for (const p of report.presses)
    console.log(`  ${p.name} at ${p.width}: ${p.id} ${p.what}`);
}
for (const note of report.notes) console.log(`  note: ${note}`);
const differences =
  report.html.length + report.pictures.length + report.presses.length;
console.log(
  `\nCOMPARE with the « before »${plan.commit ? ` (commit ${plan.commit})` : ""}: ${differences ? `${differences} difference${differences === 1 ? "" : "s"}` : "nothing differs"} in ${seconds(started)} s`,
);
process.exit(differences ? 1 : 0);
