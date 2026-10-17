// OP System's half of an Official Partner site in Astro (Official Partner, Oct 17, 2026).
//
// After each build, site.json goes beside the pages: the manifest OP System (https://app.officialpartner.work) reads
// to show this site to its team and its client. It holds the project (op.config.json), the pages (read from the
// built HTML: title, description, whether it is indexed), the screens, the Web System (the tokens of
// src/styles/base.css, a fluid one at both ends of its range, --viewport-min and --viewport-max; the text styles the
// sheets declare) and the themes (their roles). Nothing here runs in the
// browser: the review's bridge is added by OP System's proxy, never by this site.
//
// A build is kept out of search engines (dist/_headers says noindex) until op.config.json says the site is live
// ("live": true), and always on a branch other than main (a preview).
import { readFile, writeFile, readdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const FR = {
  home: "Accueil",
  components: "Composantes",
  site: "Site",
  system: "Système",
  colors: "Couleurs",
  type: "Typographie",
  space: "Espaces",
  radius: "Rayons",
  border: "Bordures",
  size: "Tailles",
  motion: "Mouvement",
  at: (name, w) => `${name}, à ${w} px`,
  desktop: "Bureau",
  tablet: "Tablette",
  mobile: "Mobile",
  sample: "Un titre qui donne le ton",
  about: "Le système du site, lu dans src/styles/base.css : ses couleurs, ses textes et ses espaces, d’un bout à l’autre des écrans.",
};
const EN = {
  home: "Home",
  components: "Components",
  site: "Site",
  system: "System",
  colors: "Colours",
  type: "Type",
  space: "Spacing",
  radius: "Radius",
  border: "Borders",
  size: "Sizes",
  motion: "Motion",
  at: (name, w) => `${name}, at ${w} px`,
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
  sample: "A heading that sets the tone",
  about: "The site's system, read from src/styles/base.css: its colours, its text and its spacing, from the narrowest screen to the widest.",
};

/* the text styles' names in words (a style of the site's own keeps its name) */
const STYLE_LABELS = { display: "Display", h1: "H1", h2: "H2", h3: "H3", h4: "H4", h5: "H5", h6: "H6",
  large: "Text large", main: "Text main", small: "Text small" };

const ROLES_FR = {
  background: "Fond", "background-2": "Fond 2", "background-3": "Fond 3", "background-skeleton": "Fond en chargement",
  text: "Texte", "text-2": "Texte 2", border: "Ligne", "heading-accent": "Accent des titres",
  "selection-background": "Sélection, fond", "selection-text": "Sélection, texte",
  "button-background": "Bouton, fond", "button-border": "Bouton, ligne", "button-text": "Bouton, texte",
  "button-background-hover": "Bouton survolé, fond", "button-border-hover": "Bouton survolé, ligne",
  "button-text-hover": "Bouton survolé, texte",
  "button-2-background": "Bouton 2, fond", "button-2-border": "Bouton 2, ligne", "button-2-text": "Bouton 2, texte",
  "button-2-background-hover": "Bouton 2 survolé, fond", "button-2-border-hover": "Bouton 2 survolé, ligne",
  "button-2-text-hover": "Bouton 2 survolé, texte",
  "link-text": "Lien, texte", "link-border": "Lien, ligne", "link-text-hover": "Lien survolé, texte",
  "link-border-hover": "Lien survolé, ligne",
};

/* the starter's tokens in words (a token of the site's own keeps its name) */
const TOKENS_FR = {
  light: "Clair", dark: "Foncé", brand: "Marque", "brand-text": "Texte sur la marque",
  canvas: "Toile", sunken: "Creux", surface: "Surface", ink: "Encre", "ink-2": "Encre 2", "ink-3": "Encre 3",
  "grey-dark": "Gris foncé", "grey-light": "Gris pâle", accent: "Accent", "accent-light": "Accent pâle",
  "accent-text": "Texte sur l’accent",
  "section-space-small": "Section, petite", "section-space-medium": "Section, moyenne", "section-space-large": "Section, grande",
  "section-space-nav-overlap": "Section sous le menu", "site-margin": "Marge du site", "site-gutter": "Gouttière",
  "radius-small": "Rayon, petit", "radius-main": "Rayon", "border-width": "Épaisseur des lignes", "focus-width": "Contour du focus",
  "max-width-small": "Largeur maximale, petite", "nav-height": "Hauteur du menu", "hover-duration": "Durée du survol",
  "base-duration": "Durée de base", "slow-duration": "Durée lente", "open-duration": "Durée d’ouverture",
  "button-size": "Taille des boutons", "button-size-small": "Taille des boutons, petite", "button-gap": "Espace entre les boutons",
  "icon-size": "Taille des icônes", "logo-width": "Largeur du logo", "tag-height": "Hauteur des étiquettes",
  "ease-smooth": "Doux", "ease-osmo": "Osmo", "ease-rebound": "Rebond", "ease-spring": "Ressort", "ease-arrive": "Arrivée",
  "ease-leave": "Départ", "ease-travel": "Trajet", "ease-flip": "Bascule", "ease-in-out": "Entrée et sortie",
  "ease-out": "Sortie", "ease-in": "Entrée",
};
const tokenLabel = (lang, id) => {
  const ease = /^ease-(.+)$/.exec(id);   // a curve by its own word (--ease-smooth: Smooth, Doux)
  if (lang !== "fr") return words(ease ? ease[1] : id);
  if (TOKENS_FR[id]) return TOKENS_FR[id];
  if (ease) return words(ease[1]);
  const space = /^space-(\d+)$/.exec(id);
  if (space) return `Espace ${space[1]}`;
  const swatch = /^([a-z]+)-(\d+)$/.exec(id);
  if (swatch && TOKENS_FR[swatch[1]]) return `${TOKENS_FR[swatch[1]]} ${swatch[2]}`;
  return words(id);
};

/* the custom properties of a block of CSS, in order: [name, value] */
const declarations = (css) => [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]);
const num = (v) => (v !== undefined && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null);
const remOf = (v) => { const m = /^(-?\d+(?:\.\d+)?)rem$/.exec(v || ""); return m ? Number(m[1]) : null; };
const msOf = (v) => { const m = /^(\d+(?:\.\d+)?)ms$/.exec(v || ""); return m ? Number(m[1]) : null; };
const words = (id) => id.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/* the tokens of :root, and each theme's roles */
function readTokens(css) {
  const root = /:root\s*\{([\s\S]*?)\n\}/.exec(css);
  const vars = new Map(root ? declarations(root[1]) : []);
  // a screen's own values: @media (width >= Xrem) { :root { … } }, the narrowest first
  const screens = [...css.matchAll(/@media \((?:width >= |min-width: ?)([\d.]+)rem\) \{\s*:root \{([\s\S]*?)\n  \}\n\}/g)]
    .map((m) => ({ rem: Number(m[1]), vars: new Map(declarations(m[2])) })).sort((a, b) => a.rem - b.rem);
  const themes = [];
  for (const m of css.matchAll(/((?:[^{}]*\.theme-[\w-]+[^{}]*))\{([^{}]*--background[^{}]*)\}/g)) {
    const selectors = m[1].split(",").map((s) => s.trim());
    const own = selectors.find((s) => /^\.theme-[\w-]+$/.test(s));
    if (own) themes.push({ cls: own.slice(1), roles: declarations(m[2]) });
  }
  return { vars, screens, themes };
}

/* a length as the Web System edits it: the first rem, px or vw number of the value, the rest kept around it; a vw is
   shown in px of the design (`ref` wide) */
function measure(value, ref = 1440) {
  const m = /(-?\d*\.?\d+)(rem|px|vw)/.exec(value || "");
  if (!m) return null;
  const n = Number(m[1]), at = (css) => value.slice(0, m.index) + css + value.slice(m.index + m[0].length);
  if (m[2] === "rem") return { value: Math.round(n * 16 * 100) / 100, css: at("calc({v} * 0.0625rem)"), unit: "px" };
  if (m[2] === "px") return { value: n, css: at("calc({v} * 0.0625rem)"), unit: "px" };
  return { value: Math.round((n * ref) / 100 * 100) / 100, css: at(`calc({v} * ${Number((100 / ref).toFixed(6))}vw)`), unit: "px" };
}

async function htmlFiles(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith("_")) out.push(...await htmlFiles(full, base)); }
    else if (e.name.endsWith(".html")) out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out.sort();
}

const git = (cmd, cwd) => { try { return execSync(`git ${cmd}`, { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } };

/**
 * @param {{ siteName: string, siteUrl: string, locale: string }} site src/consts.ts's SITE_NAME, SITE_URL, SITE_LOCALE
 */
export default function opSystem(site) {
  let root = "";
  return {
    name: "op-system",
    hooks: {
      "astro:config:done": ({ config }) => { root = fileURLToPath(config.root); },
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const read = (p) => readFile(path.join(root, p), "utf8").catch(() => "");
        const conf = JSON.parse((await read("op.config.json")) || "{}");
        const siteUrl = site.siteUrl || "";
        const siteName = site.siteName || conf.name || "";
        const lang = String(site.locale || "fr").split("-")[0];
        const t = lang === "en" ? EN : FR;
        const branch = process.env.WORKERS_CI_BRANCH || git("branch --show-current", root) || "main";
        const sha = [process.env.WORKERS_CI_COMMIT_SHA, git("rev-parse HEAD", root)].find((s) => /^[0-9a-f]{7,40}$/.test(s || ""));
        const commit = sha ? sha.slice(0, 7) : "";
        const today = new Date().toISOString().slice(0, 10);

        // the pages, as they were built
        const pages = [];
        const sheets = new Set();
        let inline = "";   // the home page's own <style> that loads the fonts and names them (Astro's <Font>)
        for (const file of await htmlFiles(out)) {
          if (/(^|\/)404\.html$/.test(file)) continue;
          const html = await readFile(path.join(out, file), "utf8");
          const route = file === "index.html" ? "./" : file.replace(/(\/index)?\.html$/, "");
          const full = ((/<title>([^<]*)<\/title>/.exec(html) || [])[1] || "").replace(/&amp;/g, "&").replace(/&#39;/g, "’").trim();
          const own = full.endsWith(` | ${siteName}`) ? full.slice(0, -(siteName.length + 3)) : (route === "./" ? t.home : full);
          const description = ((/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] || "").replace(/&amp;/g, "&");
          const index = !/<meta name="robots" content="[^"]*noindex/.test(html);
          for (const s of html.matchAll(/<link rel="stylesheet" href="\/?([^"]+\.css)"/g)) sheets.add(s[1]);
          if (route === "./") inline = [...html.matchAll(/<style>([^<]*)<\/style>/g)].map((s) => s[1]).filter((css) => /@font-face|--font-/.test(css)).join("\n");
          const components = /example-components|composantes|components/.test(route);
          // a page of the team's (a test page, a style sheet): op.config.json's systemPages, « * » for any characters
          const internal = components || (conf.systemPages || []).some((g) => new RegExp(`^${String(g).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`).test(route));
          const id = route === "./" ? (lang === "en" ? "home" : "accueil") : route.replace(/\//g, "-");
          pages.push(Object.assign({ id, title: own || id, path: route, group: internal ? t.system : t.site },
            components ? { role: "components" } : { seo: { title: full, description, slug: route === "./" ? "" : route, index } }));
        }
        // the home page first, then as the site lists them
        pages.sort((a, b) => (a.path === "./" ? -1 : b.path === "./" ? 1 : 0));

        // the Web System, from the tokens: a fluid one runs from --viewport-min to --viewport-max (Lumos: 320 to 1440)
        const css = await read("src/styles/base.css");
        const { vars, screens, themes } = readTokens(css);
        const vmin = num(vars.get("--viewport-min")) || 320, vmax = num(vars.get("--viewport-max")) || 1440;
        // the screens: a phone below the narrowest media block, a tablet, a computer from the widest (Lumos: 48, 64rem)
        const steps = screens.length ? screens.map((s) => s.rem) : [48, 64];
        const tabletAt = steps.length > 1 ? steps[0] : 48, desktopAt = steps[steps.length - 1];
        // the design's width: what a value that follows the screen's width is drawn at (op.config.json designWidth)
        const ref = Number(conf.designWidth) || vmax;
        const at = (mode, name) => {
          const from = mode === "desktop" ? desktopAt : mode === "tablet" ? tabletAt : 0;
          let v = vars.get(name);
          screens.forEach((s) => { if (s.rem <= from && s.vars.has(name)) v = s.vars.get(name); });
          return v;
        };
        const perScreen = (name) => screens.some((s) => s.vars.has(name));
        const byScreen = (name, label, kind) => {
          const modes = {};
          for (const mode of ["desktop", "tablet", "mobile"]) {
            const m = measure(at(mode, name), ref);
            if (!m) return [];
            modes[mode] = m;
          }
          return [{ name, label, type: "length", modes, unitLabel: "px", min: 0, max: kind === "type" ? 240 : 320, step: 1, editable: true }];
        };
        // a token as the Web System shows it: its two ends when it is fluid, its value on each screen when the media
        // blocks change it, else its value
        const entry = (name, label, kind) => num(vars.get(`${name}-min`)) !== null ? fluid(name, label, kind)
          : perScreen(name) ? byScreen(name, label, kind) : null;
        const fluid = (name, label, kind) => {
          const min = num(vars.get(`${name}-min`)), max = num(vars.get(`${name}-max`));
          if (min === null || max === null) return [];
          const one = (edge, w, v) => ({ name: `${name}-${edge}`, label: t.at(label, w), type: "length", value: v, css: "{v}", unitLabel: "px",
            min: 0, max: kind === "type" ? 240 : 320, step: 1, editable: true });
          return [one("min", vmin, min), one("max", vmax, max)];
        };
        // the text styles: each .text-style-<id> class of the site's styles whose size is a fluid token (--<id>, or
        // --text-<id> as Lumos names the body's), in the order the sheet declares them, the headings first
        const sheetsCss = [css, ...await Promise.all(["src/styles/patterns.css", "src/styles/global.css", "src/styles/utilities.css"].map(read))].join("\n");
        const styleIds = [...new Set([...sheetsCss.matchAll(/\.text-style-([\w-]+)\s*[,{]/g)].map((m) => m[1]))];
        const sized = (token) => num(vars.get(`${token}-min`)) !== null || (vars.has(token) && perScreen(token));
        const STYLES = styleIds.map((id) => [id, sized(`--${id}`) ? `--${id}` : sized(`--text-${id}`) ? `--text-${id}` : null])
          .filter(([, token]) => token)
          .sort((a, b) => {
            const head = (x) => /^(display|h\d)$/.test(x[0]);
            const big = (x) => num(vars.get(`${x[1]}-max`)) ?? (measure(at("desktop", x[1]), ref) || {}).value ?? 0;
            return head(a) && head(b) ? 0 : head(a) ? -1 : head(b) ? 1 : big(b) - big(a);
          });
        const label = (name) => tokenLabel(lang, name.slice(2));
        const colors = [...vars].filter(([, v]) => /^#[0-9a-f]{3,8}$/i.test(v)).map(([name, value]) => ({
          name, label: label(name), type: "color", value, editable: true }));
        const type = STYLES.flatMap(([id, token]) => entry(token, STYLE_LABELS[id] || words(id), "type") || []);
        const space = [
          ...[...vars.keys()].filter((n) => /^--space-\d+$/.test(n)).flatMap((n) => entry(n, label(n), "space") || []),
          ...[...vars.keys()].filter((n) => /^--section-space-[\w-]+$/.test(n) && !/-(min|max)$/.test(n)).flatMap((n) => entry(n, label(n), "space") || []),
          ...(entry("--site-margin", label("--site-margin"), "space") || []), ...(entry("--site-gutter", label("--site-gutter"), "space") || []),
        ];
        const rem = (names) => names.map((name) => [name, remOf(vars.get(name))]).filter(([, v]) => v !== null).map(([name, value]) => ({
          name, label: label(name), type: "length", value, css: "{v}rem", unitLabel: "rem", min: 0, max: 100, step: 0.0625, editable: true }));
        // a token in rem, or a fluid one (its two ends): radii, borders, the other sizes of the site's own (a button's
        // height, a logo's width), each in the first collection it fits
        const taken = new Set([...type, ...space].map((v) => v.name.replace(/-(min|max)$/, "")));
        const own = (test) => [...vars.keys()].filter((n) => !/-(min|max)$/.test(n) && !taken.has(n) && test(n))
          .flatMap((n) => { taken.add(n); return entry(n, label(n), "size") || rem([n]); });
        const radius = own((n) => /^--radius-/.test(n));
        const border = own((n) => /^--(border|focus)-width$/.test(n));
        const STYLE_PARTS = /-(line-height|letter-spacing|text-transform|margin-top|margin-bottom|font-family|font-weight|text-wrap)$/;
        const ofStyle = (n) => STYLE_PARTS.test(n) && STYLES.some(([, token]) => n.startsWith(`${token}-`));
        const size = own((n) => !ofStyle(n) && !/^--(viewport|line-height|letter-spacing|focus-offset)/.test(n) && (remOf(vars.get(n)) !== null || num(vars.get(`${n}-min`)) !== null || perScreen(n)));
        const motion = [...vars].filter(([n, v]) => msOf(v) !== null && /duration/.test(n)).map(([name, v]) => ({
          name, label: label(name), type: "time", value: msOf(v), css: "{v}ms", unitLabel: "ms", min: 0, max: 2000, step: 10, editable: true }));
        const collections = [
          { id: "colors", name: t.colors, kind: "color", variables: colors },
          { id: "type", name: t.type, kind: "type", variables: type },
          { id: "space", name: t.space, kind: "space", variables: space },
          { id: "radius", name: t.radius, kind: "radius", variables: radius },
          { id: "border", name: t.border, kind: "border", variables: border },
          { id: "size", name: t.size, kind: "size", variables: size },
          { id: "motion", name: t.motion, kind: "motion", variables: motion },
        ].filter((c) => c.variables.length);
        const astroConfig = await read("astro.config.mjs");
        // each font of astro.config.mjs and the variable Astro names it by (its family is renamed in the build: REM-6e9d…)
        const families = [...astroConfig.matchAll(/name:\s*"([^"]+)"([\s\S]*?)(?=name:\s*"|$)/g)].map((m) => [m[1], (/cssVariable:\s*"(--[\w-]+)"/.exec(m[2]) || [])[1]]);
        const weights = [...new Set([...astroConfig.matchAll(/weight:\s*"?(\d+)/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
        const roleNames = themes.length ? themes[0].roles.map(([n]) => n.slice(2)) : [];
        const system = {
          // no page of its own in the site: OP System draws the Web System with its own page, from this file
          page: "app",
          css: [...sheets],
          inline,
          base: themes.length ? themes[0].cls : "theme-light",
          reference: ref,
          updated: today,
          about: t.about,
          collections,
          styles: STYLES.map(([id, token]) => ({ id, label: STYLE_LABELS[id] || words(id), class: `text-style-${id}`, size: token, sample: t.sample })),
          roles: roleNames.map((id) => ({ id, label: lang === "en" ? words(id) : (ROLES_FR[id] || words(id)), name: `--${id}` })),
          // no font of its own (OP's starter: the system's): the family --primary-family names
          fonts: families.length
            ? families.map(([family, cssVar]) => ({ family, stack: `${cssVar ? `var(${cssVar}, ${family})` : family}, system-ui, sans-serif`, weights: weights.length ? weights : [400], use: t.site }))
            : vars.has("--primary-family") ? [{ family: (vars.get("--primary-family").split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).find((x) => !/^(-apple-system|BlinkMacSystemFont|system-ui|var\()/.test(x)) || "System"),
                stack: "var(--primary-family)", weights: [400, 500, 700].filter((w) => [...vars.values()].some((v) => v === String(w))), use: t.site }] : [],
        };
        // each role's colour variable: a role that takes another role's (--button-text-hover: var(--background)) takes
        // that role's colour in the same theme, then :root's (a theme sets only what it changes)
        const rootRoles = new Map(themes.length ? themes[0].roles : []);
        const colourOf = (own, v, depth = 0) => {
          const m = /^var\((--[\w-]+)\)$/.exec(v || "");
          if (!m || depth > 5) return null;
          if (/^#/.test(vars.get(m[1]) || "")) return m[1];
          return colourOf(own, own.get(m[1]) || rootRoles.get(m[1]) || vars.get(m[1]), depth + 1);
        };
        // a role's colour, and its opacity when it is a tint (color-mix(in lab, var(--text) 60%, transparent)); the tints
        // the themes use, by colour, written as the site mixes them
        const mixes = new Map();
        const refOf = (own, v) => {
          const mix = /^color-mix\(in (\w+),\s*(var\(--[\w-]+\))\s+(\d+(?:\.\d+)?)%,\s*transparent\)$/.exec(v || "");
          if (mix) {
            const token = colourOf(own, mix[2]);
            if (!token) return null;
            const alpha = Number(mix[3]) / 100;
            if (!mixes.has(token)) mixes.set(token, new Map());
            if (!mixes.get(token).has(alpha)) mixes.get(token).set(alpha, mix[1]);
            return { token, alpha };
          }
          const token = colourOf(own, v);
          return token ? { token } : null;
        };
        const THEME_FR = { light: "Clair", dark: "Foncé", brand: "Marque" };
        const themeList = themes.map(({ cls, roles }) => ({
          name: lang === "fr" && THEME_FR[cls.replace(/^theme-/, "")] ? THEME_FR[cls.replace(/^theme-/, "")] : words(cls.replace(/^theme-/, "")),
          class: cls,
          roles: Object.fromEntries(roles.map(([n, v]) => { const ref = refOf(new Map(roles), v); return ref ? [n.slice(2), ref] : null; }).filter(Boolean)),
          checks: lang === "en"
            ? [["Text on ground", "text", "background"], ["Text 2 on ground", "text-2", "background"], ["Button", "button-text", "button-background"]]
            : [["Texte sur le fond", "text", "background"], ["Texte 2 sur le fond", "text-2", "background"], ["Bouton", "button-text", "button-background"]],
        }));

        // each colour's tints the themes use (a role at 10 % of --marine): no variable of their own in the site, the CSS
        // they are written with, so OP System shows a role's value and writes it again when the team changes it
        colors.forEach((c) => {
          const used = mixes.get(c.name);
          if (!used) return;
          c.derived = [...used].sort((a, b) => a[0] - b[0]).map(([alpha, space]) => {
            const pct = Math.round(alpha * 1000) / 10;
            return { name: `${c.name}-${String(pct).replace(".", "-")}`, alpha, css: `color-mix(in ${space}, var(${c.name}) ${pct}%, transparent)` };
          });
        });

        // the layout grid OP System draws over the pages (its « Grille »): the site's margin and gutter, its columns on
        // each screen (--site-columns when the site names them, else 12, 8 and 4), as wide as its main width at most
        const cols = (mode, fallback) => num(at(mode, "--site-columns")) || fallback;
        const grid = vars.has("--site-margin") ? {
          columns: [
            { media: `(min-width: ${desktopAt}rem)`, count: cols("desktop", 12) },
            { media: `(min-width: ${tabletAt}rem)`, count: cols("tablet", 8) },
            { count: cols("mobile", 4) },
          ],
          margin: "var(--site-margin)",
          gutter: vars.has("--site-gutter") ? "var(--site-gutter)" : undefined,
          max: vars.has("--max-width-main") ? "calc(var(--max-width-main) + var(--site-margin) * 2)" : undefined,
        } : null;

        // the curves (--ease-*: a cubic-bezier() or a linear()), each in the family OP's ease bank sorts them by: a
        // curve that goes past its end bounces (joueur), one that starts slow and ends slow is calm (posé), the rest net
        const curveOf = (v, depth = 0) => {
          const m = /^var\((--[\w-]+)\)$/.exec(v || "");
          return m && depth < 5 ? curveOf(vars.get(m[1]), depth + 1) : v;
        };
        const familyOf = (css) => {
          if (/^linear\(/.test(css)) return [...css.matchAll(/(-?\d*\.?\d+)(?:\s+[\d.]+%)?\s*[,)]/g)].some((m) => Number(m[1]) > 1.001 || Number(m[1]) < -0.001) ? "joueur" : "net";
          const b = /^cubic-bezier\(([^)]+)\)$/.exec(css);
          if (!b) return css === "linear" ? "constant" : "net";
          const [x1, y1, x2, y2] = b[1].split(",").map(Number);
          if (y1 > 1 || y2 > 1 || y1 < 0 || y2 < 0) return "joueur";
          return x1 >= 0.3 && x2 <= 0.7 && y1 <= 0.1 && y2 >= 0.9 ? "pose" : "net";
        };
        const eases = [...vars].filter(([n]) => /^--ease-[\w-]+$/.test(n)).map(([name, v]) => [name, curveOf(v)])
          .filter(([, css]) => /^(cubic-bezier|linear)\(/.test(css || ""))
          .map(([name, css]) => ({ id: name.slice(2), label: label(name), token: name, css, family: familyOf(css) }));

        let domain = "";
        try { domain = siteUrl ? new URL(siteUrl).host : ""; } catch { domain = ""; }
        const manifest = {
          schema: "op-web-system/1",
          project: Object.assign({ id: conf.id || "site", name: conf.name || siteName, client: conf.client || "", studio: conf.studio || "",
            system: "Lumos for Astro", version: commit, updated: today, branch, lang, domain, live: conf.live === true, description: conf.description || "" },
            conf.staging ? { staging: conf.staging } : {}),
          modes: [
            { id: "desktop", label: t.desktop, media: `(min-width: ${desktopAt}rem)`, min: desktopAt * 16 },
            { id: "tablet", label: t.tablet, media: `(min-width: ${tabletAt}rem) and (max-width: ${desktopAt - 0.01}rem)`, min: tabletAt * 16, max: desktopAt * 16 - 1 },
            { id: "mobile", label: t.mobile, media: `(max-width: ${tabletAt - 0.01}rem)`, max: tabletAt * 16 - 1 },
          ],
          pages,
          system,
          themes: themeList,
          eases,
          components: [],
          changes: [],
        };
        if (grid) manifest.grid = JSON.parse(JSON.stringify(grid));
        await writeFile(path.join(out, "site.json"), JSON.stringify(manifest, null, 1) + "\n");
        // out of search engines until the site is live, and always on a branch other than main
        const indexed = branch === "main" && conf.live === true;
        if (!indexed) {
          const own = await readFile(path.join(out, "_headers"), "utf8").catch(() => "");
          await writeFile(path.join(out, "_headers"), "/*\n  X-Robots-Tag: noindex, nofollow\n" + (own ? "\n" + own : ""));
        }
        logger.info(`site.json: ${pages.length} pages, ${collections.reduce((n, c) => n + c.variables.length, 0)} variables, ${themeList.length} themes (branch ${branch}${indexed ? "" : ", noindex"})`);
      },
    },
  };
}
