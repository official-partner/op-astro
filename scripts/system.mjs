// The site's system, written from one file (Official Partner, Nov 12, 2026; from the generators written for Tranter on
// Nov 10 and for Curveball on Nov 11, one per site until now).
//
//   npm run system              writes src/styles/base.css from system/site.json
//   npm run system -- --check   says whether base.css is what the system file gives, and exits 1 when it is not
//
// system/site.json holds the values and where they come from; system/reset.css is the reset every site keeps.
// base.css is never edited by hand: a change of the system is a change of the file, then this command. npm run rules
// fails on a base.css that is not what the file gives.
//
// The file, section by section (system/README.md says more):
//
//   scale          { "min": 320, "max": 1440 }: Lumos's one fluid line, each size given as [at min, at max]. Or two
//                  segments, for a site drawn at one computer width: { "phone": 390, "tabletMax": 1023,
//                  "desktopMin": 1024, "reference": 1728 }, each size given as [phone, tablet, computer]. From
//                  desktopMin to the reference width everything scales as one piece (each -min is the computer's
//                  value x desktopMin / reference, computed here, never typed); below, phone to tablet.
//   swatches       the colours, by the names the designer gives them: the only place a hex lives.
//   type           primitives (families, weights), letterSpacing, lineHeight, and styles: each text style with its
//                  size and its properties. A style's "floor" (px) is the size it never goes under.
//   borders, radius, maxWidth, nav          their tokens, as written.
//   motion         durations and eases under OP's names, the same on every site (OP's skill op-motion), plus what
//                  the starter's own components read. "more" adds a site's own.
//   layout         site-margin, site-gutter and the columns per screen [phone, tablet, computer].
//   space, sectionSpace, fluid              the scale of spaces; fluid holds a site's other sizes (a logo, a marker).
//   roles          a relation the design repeats, pointing at a step: { "space-media": { "ref": "space-3",
//                  "job": "an image and its first text", "phone": "space-2" } }.
//   groups         a site's own tokens, as written: [{ "title": "Tones", "set": { "tone-muted": "50%" } }].
//   themes         each theme: its selectors, its colour scheme, its roles in groups.
//   decisions      what the team decided, each with its date and who: kept here, not written in the CSS.
//
// A value may carry where it comes from: "ink": { "value": "#141413", "from": "brand guide" }.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = "system/site.json";
const RESET = "system/reset.css";
const SHEET = "src/styles/base.css";

const num = (x) => String(Number(Number(x).toFixed(3)));
const valueOf = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? v.value : v;
const clamp = (n) =>
  `clamp(var(--${n}-min) / 16 * 1rem, ((var(--${n}-min) - ((var(--${n}-max) - var(--${n}-min)) / (var(--viewport-max) - var(--viewport-min)) * var(--viewport-min))) / 16 * 1rem + ((var(--${n}-max) - var(--${n}-min)) / (var(--viewport-max) - var(--viewport-min))) * 100vw), var(--${n}-max) / 16 * 1rem)`;
const STYLE_ORDER = [
  "text-main",
  "text-small",
  "text-large",
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];
const STYLE_PROPS = [
  ["font-family", "font-family"],
  ["font-size", null],
  ["font-weight", "font-weight"],
  ["line-height", "line-height"],
  ["letter-spacing", "letter-spacing"],
  ["text-transform", "text-transform"],
  ["text-wrap", "text-wrap"],
  ["font-variation-settings", "font-variation"],
  ["font-feature-settings", "font-feature"],
];

// base.css, as the system file gives it
export function generate(system, reset) {
  const two = system.scale?.reference !== undefined; // two segments: phone to tablet, then the computer as one piece
  const scale = system.scale ?? { min: 320, max: 1440 };
  const out = [];
  const w = (line = "") => out.push(line);
  const set = (object, name = (k) => k) => {
    for (const [k, v] of Object.entries(object ?? {}))
      w(`  --${name(k)}: ${valueOf(v)};`);
  };
  // every size with two or three values: its token, then its two ends on the first segment
  const sizes = [];
  const fluid = (name, values) => {
    const v = valueOf(values);
    if (two && v.length !== 3)
      throw new Error(
        `${FILE}: ${name} needs three values on a two-segment scale (phone, tablet, computer), it has ${v.length}`,
      );
    if (!two && v.length !== 2)
      throw new Error(
        `${FILE}: ${name} needs two values (at ${scale.min} and at ${scale.max}), it has ${v.length}`,
      );
    sizes.push([name, v]);
    w(`  --${name}: ${clamp(name)};`);
    w(`  --${name}-min: ${num(v[0])};`);
    w(`  --${name}-max: ${num(v[1])};`);
  };
  const type = system.type ?? {};
  const styles = Object.entries(type.styles ?? {});
  const motion = system.motion ?? {};

  w("/* Design tokens */");
  w(":root {");
  w("  /* Swatches */");
  set(system.swatches);
  w();
  w("  /* Typography primitives */");
  set(type.primitives);
  w();
  w("  /* Letter spacing */");
  set(type.letterSpacing, (k) => `letter-spacing-${k}`);
  w();
  w("  /* Line height */");
  set(type.lineHeight, (k) => `line-height-${k}`);
  w();
  w("  /* Borders & focus */");
  set(system.borders);
  w();
  w(
    "  /* Motion: OP's named durations and curves, the same on every site (OP's skill op-motion). What answers the",
  );
  w(
    "     person (a hover, a press, a menu) is on the out curve; what is watched (a heading, a reveal, a page) on the",
  );
  w(
    "     arrive curve. A component names one of these, never a raw duration or curve. */",
  );
  for (const [k, v] of Object.entries(motion.durations ?? {}))
    w(`  --${k}-duration: ${num(valueOf(v))}ms;`);
  for (const [k, v] of Object.entries(motion.eases ?? {}))
    w(`  --ease-${k}: ${valueOf(v)};`);
  w();
  w(
    "  /* What the starter's own components read: a hover, an opening, the loading screen, a page leaving and the next",
  );
  w("     one arriving */");
  w("  --hover-ease: var(--ease-out);");
  w("  --open-ease: var(--ease-out);");
  w(`  --loader-duration: ${num(motion.loader ?? 600)}ms;`);
  w("  --loader-ease: var(--ease-arrive);");
  w(`  --page-leave-duration: ${num(motion.pageLeave ?? 450)}ms;`);
  w("  --page-leave-ease: var(--ease-out);");
  w(`  --page-arrive-duration: ${num(motion.pageArrive ?? 800)}ms;`);
  w("  --page-arrive-ease: var(--ease-arrive);");
  set(motion.more);
  w();
  w("  /* Radius */");
  set(system.radius);
  w();
  w(
    two
      ? "  /* Fluid scale range: a phone to a tablet here, the computer in the media block below */"
      : "  /* Fluid scale range */",
  );
  w(`  --viewport-min: ${num(two ? scale.phone : scale.min)};`);
  w(`  --viewport-max: ${num(two ? scale.tabletMax : scale.max)};`);
  w();
  w("  /* Max width */");
  set(system.maxWidth);
  w();
  w("  /* Nav */");
  set(system.nav);
  for (const group of system.groups ?? []) {
    w();
    w(`  /* ${group.title} */`);
    set(group.set);
  }
  w();
  w("  /* Typography styles */");
  styles.forEach(([name, style], i) => {
    if (i) w();
    fluid(name, style.size);
    for (const [k, v] of Object.entries(style))
      if (!["size", "floor", "from", "why"].includes(k))
        w(`  --${name}-${k}: ${valueOf(v)};`);
  });
  w();
  w("  /* Site layout */");
  const layout = system.layout ?? {};
  for (const name of ["site-margin", "site-gutter"]) {
    if (layout[name] === undefined) continue;
    fluid(name, layout[name]);
    w();
  }
  w("  --site-width: calc(100% - var(--site-margin) * 2);");
  w();
  w(
    "  /* The layout grid's columns, one value per screen: a phone here, a tablet and a computer in the media blocks below.",
  );
  w(
    "     The grid's only name: OP System's « Grille » draws it, a page's grid uses it (repeat(var(--site-columns), …)). */",
  );
  const columns = layout.columns ?? [4, 8, 12];
  w(`  --site-columns: ${columns[0]};`);
  w();
  w("  /* Spacing */");
  for (const [k, v] of Object.entries(system.space ?? {})) fluid(k, v);
  if (Object.keys(system.sectionSpace ?? {}).length) w();
  for (const [k, v] of Object.entries(system.sectionSpace ?? {}))
    fluid(`section-space-${k}`, v);
  if (Object.keys(system.fluid ?? {}).length) {
    w();
    w("  /* Sizes */");
    for (const [k, v] of Object.entries(system.fluid)) fluid(k, v);
  }
  const roles = Object.entries(system.roles ?? {});
  if (roles.length) {
    w();
    w(
      "  /* Role tokens: one relation each, pointing at a step of the scale (change the step, every use follows) */",
    );
    for (const [k, r] of roles) w(`  --${k}: var(--${r.ref});`);
  }
  const floors = styles.filter(([, s]) => s.floor !== undefined);
  if (floors.length) {
    w();
    w(
      "  /* Floors: a text read stops shrinking here (max() in its text style) */",
    );
    for (const [k, s] of floors)
      w(`  --${k}-floor: ${num(valueOf(s.floor) / 16)}rem;`);
  }
  w("}");
  w();

  const phoneRoles = roles.filter(([, r]) => r.phone);
  if (phoneRoles.length) {
    w(
      "/* A phone: the role tokens that point at another step under the tablet */",
    );
    w("@media (width < 48rem) {");
    w("  :root {");
    for (const [k, r] of phoneRoles) w(`    --${k}: var(--${r.phone});`);
    w("  }");
    w("}");
    w();
  }
  w(
    "/* The grid's columns on a tablet (from 48rem) and a computer (from 64rem): Lumos's Grid breakpoints */",
  );
  w("@media (width >= 48rem) {");
  w("  :root {");
  w(`    --site-columns: ${columns[1]};`);
  w("  }");
  w("}");
  w();
  if (two)
    w(
      `/* The computer, ${scale.desktopMin} to ${scale.reference}: everything scales with the grid. Each -min is its -max x ${scale.desktopMin} / ${scale.reference}. */`,
    );
  w("@media (width >= 64rem) {");
  w("  :root {");
  w(`    --site-columns: ${columns[2]};`);
  if (two) {
    w(`    --viewport-min: ${num(scale.desktopMin)};`);
    w(`    --viewport-max: ${num(scale.reference)};`);
    for (const [name, v] of sizes) {
      w(
        `    --${name}-min: ${num((v[2] * scale.desktopMin) / scale.reference)};`,
      );
      w(`    --${name}-max: ${num(v[2])};`);
    }
  }
  w("  }");
  w("}");
  w();

  w("/* Color themes */");
  for (const theme of system.themes ?? []) {
    w(`${theme.selectors.join(",\n")} {`);
    if (theme.scheme) {
      w(`  color-scheme: ${theme.scheme};`);
      w();
    }
    theme.roles.forEach((group, i) => {
      if (i) w();
      set(group);
    });
    w("}");
    w();
  }
  w(":root,");
  w('[class*="theme-"] {');
  w("  background-color: var(--background);");
  w("  color: var(--text);");
  w("}");
  w();
  w(reset.replace(/\s+$/, ""));
  w();

  w("/* Text styles */");
  const ordered = [
    ...STYLE_ORDER.filter((n) => type.styles?.[n]),
    ...styles.map(([n]) => n).filter((n) => !STYLE_ORDER.includes(n)),
  ];
  for (const name of ordered) {
    const style = type.styles[name];
    const cls = name.replace(/^text-/, "");
    if (name === "text-main") w("body,");
    if (/^h[1-6]$/.test(name)) w(`${name},`);
    w(`.text-style-${cls} {`);
    for (const [prop, key] of STYLE_PROPS) {
      if (key === null)
        w(
          style.floor !== undefined
            ? `  font-size: max(var(--${name}-floor), var(--${name}));`
            : `  font-size: var(--${name});`,
        );
      else if (style[key] !== undefined) w(`  ${prop}: var(--${name}-${key});`);
    }
    w(`  --_margin-top: var(--${name}-margin-top);`);
    w(`  --_margin-bottom: var(--${name}-margin-bottom);`);
    w("}");
    w();
  }
  w("/* Text trim */");
  w("h1,");
  w("h2,");
  w("h3,");
  w("h4,");
  w("h5,");
  w("h6,");
  w("p,");
  w('[class*="text-style-"] {');
  w("  text-box: trim-both cap alphabetic;");
  w("}");
  return `${out.join("\n")}\n`;
}

// What the site's files give, or null when the site has no system file (a site made before it)
export function fromFiles(root) {
  let text;
  try {
    text = readFileSync(path.join(root, FILE), "utf8");
  } catch {
    return null;
  }
  const reset = readFileSync(path.join(root, RESET), "utf8");
  return generate(JSON.parse(text), reset);
}

const main = () => {
  const root = path.resolve(process.env.OP_SITE || path.join(HERE, ".."));
  let css;
  try {
    css = fromFiles(root);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (css === null) {
    console.error(`No ${FILE}: this site's base.css is still written by hand.`);
    process.exit(1);
  }
  const sheet = path.join(root, SHEET);
  let now = "";
  try {
    now = readFileSync(sheet, "utf8");
  } catch {}
  if (process.argv.includes("--check")) {
    if (now === css) {
      console.log(`${SHEET} is what ${FILE} gives.`);
      return;
    }
    const [a, b] = [now.split("\n"), css.split("\n")];
    const at = a.findIndex((line, i) => line !== b[i]);
    console.error(
      `${SHEET} is not what ${FILE} gives (from line ${at + 1}):\n  - ${a[at] ?? ""}\n  + ${b[at] ?? ""}\nA change of the system goes in ${FILE}, then npm run system.`,
    );
    process.exit(1);
  }
  writeFileSync(sheet, css);
  console.log(
    `${SHEET} written from ${FILE}: ${css.split("\n").length - 1} lines${now === css ? " (no change)" : ""}.`,
  );
};
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
