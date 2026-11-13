// The rules a site holds to stay one system, checked on its sources (Official Partner, Nov 12, 2026; from the checks
// written for Tranter on Nov 10 and what the review of Sani found).
//
//   npm run rules                 what is broken, new failures first; exits 1 when there is a new one
//   npm run rules -- --accept     writes the failures of today in review/data/rules-baseline.json (give each its why)
//   npm run rules -- --all        every file of src/components and src/layouts, the starter's library included
//   npm run rules -- --json       the result as JSON
//
// Every build runs it (integrations/op-system.mjs): on a machine it stops on a new failure, on Cloudflare it warns and
// writes the count in site.json, so the review is never blocked.
//
// What it reads: the site's own styles, which are src/styles/project.css and the <style> of the components made or
// rewritten for the site (src/components/content, src/components/section, and any file of the starter's library the
// site changed: scripts/lib/library.json holds the starter's own, as fingerprints). The rules:
//
//   page-css        a page carries no CSS (<style> or style="…" in src/pages)
//   text-style      a text style lives in the system only: no rule sets two or more of font-size, line-height,
//                   letter-spacing, font-family, font-variation-settings, text-transform
//   column-number   a place across the grid is a rail (a named line) and a span, never a column number (1 and -1, the
//                   edges, are fine; rows are a component's own)
//   copied-block    two rules with the same declarations, or sharing 80 % of them (3 declarations or more): one of
//                   them is a global class, a variant or a token
//   global-class    each class of project.css is used in 3 places or more, there are 15 at most, none takes a name
//                   Lumos uses (patterns.css, utilities.css)
//   raw-value       no px, hex colour, duration or z-index written raw: a token of base.css (z-index -1, 0 and 1, and
//                   0 of anything, are fine)
//   important       no !important
//   fact-twice      an email, a phone number, a postal code or an outside link is written in one file only (a data
//                   file every page reads)
//   no-sample       every component of content/ and section/ has its sample on the components page
//   system-file     src/styles/base.css is what system/site.json gives (npm run system): never edited by hand
//
// A failure the team accepts lives in review/data/rules-baseline.json with its reason: it is listed as known and
// never stops a build. The list only shrinks: `--accept` on a site with debt, then the health review takes them out.
import { createHash } from "node:crypto";
import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fromFiles } from "./system.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = "review/data/rules-baseline.json";
const LIBRARY = path.join(HERE, "lib/library.json");
const TYPE = new Set([
  "font-size",
  "line-height",
  "letter-spacing",
  "font-family",
  "font-variation-settings",
  "text-transform",
]);
const PLACE = new Set([
  "grid-column",
  "grid-column-start",
  "grid-column-end",
  "grid-area",
]);
const MAX_CLASSES = 15;
const MIN_USES = 3;

const exists = (p) => statSync(p, { throwIfNoEntry: false });
const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};
const walk = (dir, keep) => {
  if (!exists(dir)?.isDirectory()) return [];
  return readdirSync(dir, { recursive: true })
    .map((f) => path.join(dir, f))
    .filter((f) => keep(f) && exists(f)?.isFile())
    .sort();
};

/* ------------------------------------------------------------------ the starter's library, by fingerprint */
// A file of the library the site left as it came is the starter's to check; once changed it is the site's own. The
// fingerprint ignores white space, so formatting a file does not make it the site's.
export const fingerprint = (text) =>
  createHash("sha1")
    .update(text.replace(/\s+/g, ""))
    .digest("hex")
    .slice(0, 16);
const LIBRARY_DIRS = ["src/components", "src/layouts"];
const OWN_DIRS = ["src/components/content/", "src/components/section/"];
const libraryFiles = (root) =>
  LIBRARY_DIRS.flatMap((d) =>
    walk(path.join(root, d), (f) => f.endsWith(".astro")),
  )
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .filter((f) => !OWN_DIRS.some((d) => f.startsWith(d)));

/* ------------------------------------------------------------------ CSS, read as rules */
// Every rule of a sheet, nested ones included: its path of selectors and its declarations (comments and strings out)
export function cssRules(text) {
  const clean = text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/url\([^)]*\)/g, "url()")
    .replace(/"[^"\n]*"|'[^'\n]*'/g, '""');
  const out = [];
  const stack = [];
  let buf = "";
  for (const ch of clean) {
    if (ch === "{") {
      const parts = buf.split(";");
      const selector = parts.pop().trim().replace(/\s+/g, " ");
      if (stack.length)
        stack.at(-1).decls.push(...parts.map((p) => p.trim()).filter(Boolean));
      stack.push({ selector, decls: [] });
      buf = "";
    } else if (ch === "}") {
      const rest = buf
        .split(";")
        .map((p) => p.trim())
        .filter(Boolean);
      const rule = stack.pop();
      if (rule) {
        rule.decls.push(...rest);
        const decls = rule.decls
          .filter((d) => d.includes(":"))
          .map((d) => {
            const i = d.indexOf(":");
            return [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()];
          });
        out.push({
          path: [...stack.map((s) => s.selector), rule.selector].join(" >> "),
          selector: rule.selector,
          decls,
        });
      }
      buf = "";
    } else buf += ch;
  }
  return out;
}
const stylesOf = (file, text) =>
  file.endsWith(".css")
    ? text
    : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((m) => m[1])
        .join("\n");
// @keyframes steps, @font-face and @property hold no look to share
const isLook = (rule) =>
  !/@(keyframes|font-face|property|counter-style)/.test(rule.path) &&
  !/^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/.test(
    rule.selector,
  );

/* ------------------------------------------------------------------ the facts written in the sources */
const QUIET_HOSTS =
  /(^|\.)(w3\.org|schema\.org|example\.(com|org)|localhost|127\.0\.0\.1|googleapis\.com|gstatic\.com|astro\.build|workers\.dev|mozilla\.org|web\.dev)$/;
function factsOf(text, ownHost) {
  const body = text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/(^|[\s;{}(,])\/\/[^\n]*/g, "$1");
  const found = new Map();
  const add = (kind, value, shownAs) => {
    if (!found.has(`${kind} ${value}`)) found.set(`${kind} ${value}`, shownAs);
  };
  for (const m of body.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)) {
    const email = m[0].toLowerCase().replace(/^\.+|\.+$/g, "");
    if (/\.(png|jpe?g|webp|avif|svg|gif)$/.test(email) || /@\d/.test(email))
      continue;
    if (
      /^(nom|name|vous|you|courriel|email|prenom)@|@(domaine|domain|exemple|example)\./.test(
        email,
      )
    )
      continue; // a placeholder
    add("email", email, email);
  }
  for (const m of body.matchAll(/https?:\/\/[^\s"'`<>)}\]\\]+/g)) {
    let url;
    try {
      url = new URL(m[0].replace(/[.,;:!?]+$/, ""));
    } catch {
      continue;
    }
    const host = url.hostname.toLowerCase();
    if (QUIET_HOSTS.test(host) || (ownHost && host === ownHost)) continue;
    if (m[0].includes("${")) continue; // built from a value: the value is the fact
    const value = `${host}${url.pathname.replace(/\/+$/, "")}${url.search}`;
    add("link", value, value);
  }
  for (const m of body.matchAll(
    /(?:tel:\+?[\d\s().-]{7,}|(?<![\w.-])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d))/g,
  )) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) continue;
    add("phone", digits.slice(-10), m[0].replace(/^tel:/, "").trim());
  }
  for (const m of body.matchAll(
    /(?<![\w-])[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][  ]?\d[ABCEGHJ-NPRSTV-Z]\d(?![\w-])/g,
  ))
    add("postal code", m[0].replace(/\s/g, ""), m[0]);
  return found;
}

/* ------------------------------------------------------------------ the check */
export function checkRules(root, { all = false } = {}) {
  const rel = (f) => path.relative(root, f).split(path.sep).join("/");
  const failures = [];
  const notes = [];
  const fail = (rule, file, where, detail) =>
    failures.push({
      rule,
      file,
      where,
      detail,
      key: [rule, file, where, detail].filter(Boolean).join(" | "),
    });

  // the site's own files
  const library = JSON.parse(read(LIBRARY) || "{}").files ?? {};
  const changed = [];
  const own = [];
  const project = path.join(root, "src/styles/project.css");
  if (exists(project)) own.push("src/styles/project.css");
  for (const f of LIBRARY_DIRS.flatMap((d) =>
    walk(path.join(root, d), (x) => x.endsWith(".astro")),
  ).map(rel)) {
    if (OWN_DIRS.some((d) => f.startsWith(d))) own.push(f);
    else if (all) own.push(f);
    else if (
      library[f] &&
      !library[f].includes(fingerprint(read(path.join(root, f))))
    ) {
      own.push(f);
      changed.push(f);
    } else if (!library[f]) own.push(f); // a file the starter does not have: the site's
  }
  notes.push(
    `${own.length} file${own.length === 1 ? "" : "s"} of the site's own${changed.length ? ` (changed from the starter: ${changed.join(", ")})` : ""}`,
  );

  // page-css (the system's pages aside: the components page and op.config.json's systemPages are the team's tools)
  let conf = {};
  try {
    conf = JSON.parse(read(path.join(root, "op.config.json")) || "{}");
  } catch {}
  const system = ["composantes", ...(conf.systemPages ?? [])].map(
    (p) =>
      new RegExp(
        `^${String(p)
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*")}$`,
      ),
  );
  for (const f of walk(path.join(root, "src/pages"), (x) =>
    x.endsWith(".astro"),
  )) {
    const route = rel(f)
      .replace(/^src\/pages\//, "")
      .replace(/(\/index)?\.astro$/, "");
    if (system.some((r) => r.test(route))) continue;
    const text = read(f).replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
    if (/<style[\s>]/.test(text))
      fail("page-css", rel(f), "", "a <style> block");
    const inline = text.match(/\sstyle\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/);
    if (inline)
      fail(
        "page-css",
        rel(f),
        "",
        `style=… (${inline[0].trim().slice(0, 60)})`,
      );
  }

  // the rules of the site's own styles
  const blocks = [];
  for (const f of own) {
    const rules = cssRules(stylesOf(f, read(path.join(root, f)))).filter(
      isLook,
    );
    for (const rule of rules) {
      const props = new Set(rule.decls.map(([k]) => k));
      const type = [...props].filter((k) => TYPE.has(k));
      if (type.length >= 2)
        fail("text-style", f, rule.path, type.sort().join(", "));
      for (const [k, v] of rule.decls) {
        if (PLACE.has(k)) {
          // grid-area is row / column / row / column: its columns are the second and the fourth
          const parts = v
            .split("/")
            .filter((_, i) => k !== "grid-area" || i % 2 === 1);
          const numbers = parts
            .flatMap((part) => {
              const words = part.trim().split(/\s+/);
              return words.filter(
                (w, i) =>
                  /^-?\d+$/.test(w) &&
                  words[i - 1] !== "span" &&
                  words[i + 1] !== "span",
              );
            })
            .filter((n) => Math.abs(Number(n)) !== 1);
          if (numbers.length) fail("column-number", f, rule.path, `${k}: ${v}`);
        }
        // a unit given to a number in calc() (… * 1s) is no value of the design, nor is the black of a mask
        const value = v
          .replace(/var\(\s*--[\w-]+\s*\)/g, "")
          .replace(/\*\s*1(px|ms|s)\b|(?<![\w.-])1(px|ms|s)\s*\*/g, "");
        const raw = [];
        if (/#[0-9a-f]{3,8}\b/i.test(value) && !/mask/.test(k)) raw.push("hex");
        if (
          /(?<![\w.-])-?(\d*\.)?\d+px\b/.test(value) &&
          !/^0px$/.test(value.trim())
        )
          if (
            (value.match(/(?<![\w.-])-?(\d*\.)?\d+px\b/g) || []).some(
              (x) => parseFloat(x) !== 0,
            )
          )
            raw.push("px");
        if (
          (value.match(/(?<![\w.-])(\d*\.)?\d+m?s\b/g) || []).some(
            (x) => parseFloat(x) !== 0,
          )
        )
          raw.push("duration");
        if (
          k === "z-index" &&
          /^-?\d+$/.test(v.trim()) &&
          Math.abs(Number(v)) > 1
        )
          raw.push("z-index");
        if (raw.length && !k.startsWith("--viewport"))
          fail("raw-value", f, rule.path, `${k}: ${v} (${raw.join(", ")})`);
        if (/!important/.test(v)) fail("important", f, rule.path, `${k}: ${v}`);
      }
      if (rule.decls.length >= 3)
        blocks.push({
          file: f,
          path: rule.path,
          selector: rule.selector,
          set: new Set(
            rule.decls.map(([k, v]) => `${k}:${v.replace(/\s+/g, "")}`),
          ),
        });
    }
  }

  // copied-block: the copies of one look are one failure, however many there are
  const group = blocks.map((_, i) => i);
  const top = (i) => (group[i] === i ? i : (group[i] = top(group[i])));
  const least = new Map();
  for (let i = 0; i < blocks.length; i++)
    for (let j = i + 1; j < blocks.length; j++) {
      const [a, b] = [blocks[i], blocks[j]];
      if (a.file === b.file) {
        // a rule and its own nested states or screens are one look; so is one element in two states (its hover
        // inside a media query, its focus outside)
        if (
          a.path.startsWith(`${b.path} >> `) ||
          b.path.startsWith(`${a.path} >> `)
        )
          continue;
        if (a.selector === b.selector) continue;
      }
      let shared = 0;
      for (const d of a.set) if (b.set.has(d)) shared++;
      const share = shared / Math.max(a.set.size, b.set.size);
      if (share < 0.8) continue;
      const [x, y] = [top(i), top(j)];
      const low = Math.min(least.get(x) ?? 1, least.get(y) ?? 1, share);
      group[Math.max(x, y)] = Math.min(x, y);
      least.set(Math.min(x, y), low);
    }
  const copies = new Map();
  blocks.forEach((_, i) => {
    const t = top(i);
    if (!copies.has(t)) copies.set(t, []);
    copies.get(t).push(blocks[i]);
  });
  for (const [t, members] of copies) {
    if (members.length < 2) continue;
    const [first, ...others] = members;
    const share = least.get(t) ?? 1;
    const names = others.map(
      (b) =>
        `${b.file === first.file ? "" : `${b.file} `}${b.path.split(" >> ").slice(-2).join(" >> ")}`,
    );
    fail(
      "copied-block",
      first.file,
      first.path,
      `${share === 1 ? "the same as" : `${Math.round(share * 100)} % or more shared with`} ${names.slice(0, 4).join("; ")}${names.length > 4 ? `; and ${names.length - 4} more` : ""}`,
    );
  }

  // global-class
  const sheet = read(project).replace(/\/\*[\s\S]*?\*\//g, "");
  const globals = [
    ...new Set([...sheet.matchAll(/^\.([a-z][\w-]*)/gm)].map((m) => m[1])),
  ];
  const lumos = ["patterns.css", "utilities.css"]
    .map((f) =>
      read(path.join(root, "src/styles", f)).replace(/\/\*[\s\S]*?\*\//g, ""),
    )
    .join("\n");
  const markup = walk(path.join(root, "src"), (f) =>
    /\.(astro|ts|tsx|js|mjs|md|mdx)$/.test(f),
  ).map((f) => [rel(f), read(f)]);
  for (const g of globals) {
    const word = new RegExp(
      `(?<![\\w-])${g.replace(/[-]/g, "\\-")}(?![\\w-])`,
      "g",
    );
    let uses = 0;
    for (const [, text] of markup)
      for (const m of text.matchAll(
        /class(?::list)?\s*=\s*("[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})|(?:class(?:Name|es)?|cls)\w*\s*[:=]\s*(`[^`]*`|"[^"]*"|'[^']*'|\[[^\]]*\])/gi,
      ))
        uses += ((m[1] ?? m[2]).match(word) || []).length;
    notes.push(`global class ${g}: ${uses} use${uses === 1 ? "" : "s"}`);
    if (uses < MIN_USES)
      fail(
        "global-class",
        "src/styles/project.css",
        `.${g}`,
        `used ${uses} time${uses === 1 ? "" : "s"} (3 or more, or it is a component's own class)`,
      );
    if (new RegExp(`\\.${g.replace(/[-]/g, "\\-")}(?![\\w-])`).test(lumos))
      fail(
        "global-class",
        "src/styles/project.css",
        `.${g}`,
        "takes a name Lumos uses (patterns.css or utilities.css)",
      );
  }
  if (globals.length > MAX_CLASSES)
    fail(
      "global-class",
      "src/styles/project.css",
      "",
      `${globals.length} global classes (15 at most)`,
    );

  // fact-twice
  const ownHost = String(conf.domain || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  const facts = new Map();
  for (const f of walk(path.join(root, "src"), (x) =>
    /\.(astro|ts|tsx|js|mjs|json|md|mdx)$/.test(x),
  )) {
    const file = rel(f);
    // an item's own fields are data; content.config.ts holds labels and examples for the people who fill them
    if (file.startsWith("src/content/") || file === "src/content.config.ts")
      continue;
    if (!all && library[file]?.includes(fingerprint(read(f)))) continue;
    for (const [key, shownAs] of factsOf(read(f), ownHost)) {
      if (!facts.has(key)) facts.set(key, { shownAs, files: [] });
      facts.get(key).files.push(file);
    }
  }
  for (const [key, { shownAs, files }] of facts)
    if (files.length > 1)
      fail(
        "fact-twice",
        files[0],
        "",
        `${key
          .split(" ")
          .slice(0, key.startsWith("postal") ? 2 : 1)
          .join(" ")} ${shownAs} also in ${files.slice(1).join(", ")}`,
      );

  // no-sample
  const page = read(path.join(root, "src/pages/composantes.astro"));
  if (page) {
    const sampled = new Set(
      [...page.matchAll(/file\s*=\s*["'{`]+([^"'`}]+)/g)].map((m) => m[1]),
    );
    for (const f of own.filter((x) => OWN_DIRS.some((d) => x.startsWith(d)))) {
      const short = f.replace(/^src\/components\//, "");
      if (!sampled.has(short))
        fail(
          "no-sample",
          f,
          "",
          "no sample on the components page (src/pages/composantes.astro)",
        );
    }
  }

  // system-file (a site made before the system file has none: nothing to check)
  try {
    const given = fromFiles(root);
    if (
      given !== null &&
      given !== read(path.join(root, "src/styles/base.css"))
    )
      fail(
        "system-file",
        "src/styles/base.css",
        "",
        "is not what system/site.json gives: the change goes in the system file, then npm run system",
      );
  } catch (error) {
    fail("system-file", "system/site.json", "", error.message.slice(0, 160));
  }

  // what the team accepted
  let accepted = [];
  try {
    accepted =
      JSON.parse(read(path.join(root, BASELINE)) || "{}").accepted ?? [];
  } catch {
    notes.push(`${BASELINE} is not valid JSON: nothing is accepted`);
  }
  const unexplained = accepted.filter((a) => !a.why).length;
  if (unexplained)
    notes.push(
      `${unexplained} accepted failure${unexplained === 1 ? " has" : "s have"} no reason in ${BASELINE}: write each one's why`,
    );
  const known = new Map(accepted.map((a) => [a.key, a]));
  const fresh = failures.filter((f) => !known.has(f.key));
  const settled = failures.filter((f) => known.has(f.key));
  const gone = accepted.filter((a) => !failures.some((f) => f.key === a.key));
  return { failures, fresh, known: settled, gone, notes, files: own.length };
}

/* ------------------------------------------------------------------ the command */
const main = () => {
  const args = process.argv.slice(2);
  // OP_SITE: another site's folder, checked with this copy of the rules (a site not yet brought up to date)
  const root = path.resolve(process.env.OP_SITE || path.join(HERE, ".."));
  if (args.includes("--library")) {
    // the starter's own: run in op-astro when a library component changes, never in a site. Each file keeps every
    // fingerprint the starter ever shipped, so a site made from an older starter still knows its library.
    const before = JSON.parse(read(LIBRARY) || "{}").files ?? {};
    const files = Object.fromEntries(
      libraryFiles(root).map((f) => {
        const now = fingerprint(read(path.join(root, f)));
        const kept = before[f] ?? [];
        return [f, kept.includes(now) ? kept : [...kept, now]];
      }),
    );
    for (const [f, kept] of Object.entries(before))
      if (!files[f]) files[f] = kept; // a file the starter no longer has
    writeFileSync(
      LIBRARY,
      `${JSON.stringify({ note: "The starter's library, a fingerprint per version of each file it ever shipped (white space ignored). Kept up to date in op-astro only: npm run rules -- --library.", files }, null, 1)}\n`,
    );
    console.log(
      `${path.relative(root, LIBRARY)}: ${Object.keys(files).length} files`,
    );
    return;
  }
  const result = checkRules(root, { all: args.includes("--all") });
  if (args.includes("--accept")) {
    let before = [];
    try {
      before =
        JSON.parse(read(path.join(root, BASELINE)) || "{}").accepted ?? [];
    } catch {}
    const why = new Map(before.map((a) => [a.key, a]));
    const today = new Date().toLocaleDateString("en-CA"); // the day here, as 2026-11-12
    const accepted = result.failures.map(
      (f) => why.get(f.key) ?? { key: f.key, why: "", date: today },
    );
    mkdirSync(path.dirname(path.join(root, BASELINE)), { recursive: true });
    writeFileSync(
      path.join(root, BASELINE),
      `${JSON.stringify({ note: "Failures of npm run rules the team accepts, each with its reason and its date. The list only shrinks: a build stops on a failure that is not here.", accepted }, null, 2)}\n`,
    );
    console.log(
      `${BASELINE}: ${accepted.length} accepted (${accepted.filter((a) => !a.why).length} without a reason: write each one's why).`,
    );
    return;
  }
  if (args.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.fresh.length ? 1 : 0);
  }
  for (const note of result.notes) console.log(note);
  const line = (f) =>
    `  ${f.rule.padEnd(14)} ${f.file}${f.where ? `  ${f.where}` : ""}${f.detail ? `\n${" ".repeat(17)}${f.detail}` : ""}`;
  if (result.known.length) {
    console.log(`\nKnown, accepted in ${BASELINE} (${result.known.length}):`);
    const byRule = new Map();
    for (const f of result.known)
      byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);
    console.log(`  ${[...byRule].map(([r, n]) => `${r} ${n}`).join(", ")}`);
  }
  if (result.gone.length)
    console.log(
      `\n${result.gone.length} accepted failure${result.gone.length === 1 ? " is" : "s are"} fixed: take ${result.gone.length === 1 ? "it" : "them"} out with npm run rules -- --accept.`,
    );
  console.log(
    `\nRULES: ${result.fresh.length} failure${result.fresh.length === 1 ? "" : "s"}${result.known.length ? `, ${result.known.length} known` : ""}`,
  );
  for (const f of result.fresh) console.log(line(f));
  process.exit(result.fresh.length ? 1 : 0);
};
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
