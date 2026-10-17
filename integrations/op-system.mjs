// OP System's half of an Official Partner site in Astro (Official Partner, Oct 17, 2026).
//
// After each build, site.json goes beside the pages: the manifest OP System (https://app.officialpartner.work) reads
// to show this site to its team and its client. It holds the project (op.config.json), the pages (read from the
// built HTML: title, description, whether it is indexed), the screens, the Web System (the tokens of
// src/styles/base.css, their values at 320 and 1440 px) and the themes (their roles). Nothing here runs in the
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
  about: "Le système du site, lu dans src/styles/base.css : ses couleurs, ses textes et ses espaces, à 320 et à 1440 px.",
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
  about: "The site's system, read from src/styles/base.css: its colours, its text and its spacing, at 320 and 1440 px.",
};

const STYLES = [
  ["display", "Display"], ["h1", "H1"], ["h2", "H2"], ["h3", "H3"], ["h4", "H4"], ["h5", "H5"], ["h6", "H6"],
  ["text-large", "Text large"], ["text-main", "Text main"], ["text-small", "Text small"],
];
const STYLE_CLASS = { "text-large": "large", "text-main": "main", "text-small": "small" };

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
  "section-space-small": "Section, petite", "section-space-medium": "Section, moyenne", "section-space-large": "Section, grande",
  "section-space-nav-overlap": "Section sous le menu", "site-margin": "Marge du site", "site-gutter": "Gouttière",
  "radius-small": "Rayon, petit", "radius-main": "Rayon", "border-width": "Épaisseur des lignes", "focus-width": "Contour du focus",
  "max-width-small": "Largeur maximale, petite", "nav-height": "Hauteur du menu", "hover-duration": "Durée du survol",
};
const tokenLabel = (lang, id) => {
  if (lang !== "fr") return words(id);
  if (TOKENS_FR[id]) return TOKENS_FR[id];
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
  const themes = [];
  for (const m of css.matchAll(/((?:[^{}]*\.theme-[\w-]+[^{}]*))\{([^{}]*--background[^{}]*)\}/g)) {
    const selectors = m[1].split(",").map((s) => s.trim());
    const own = selectors.find((s) => /^\.theme-[\w-]+$/.test(s));
    if (own) themes.push({ cls: own.slice(1), roles: declarations(m[2]) });
  }
  return { vars, themes };
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
        const commit = (process.env.WORKERS_CI_COMMIT_SHA || git("rev-parse HEAD", root)).slice(0, 7);
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
          const id = route === "./" ? (lang === "en" ? "home" : "accueil") : route.replace(/\//g, "-");
          pages.push(Object.assign({ id, title: own || id, path: route, group: components ? t.system : t.site },
            components ? { role: "components" } : { seo: { title: full, description, slug: route === "./" ? "" : route, index } }));
        }
        // the home page first, then as the site lists them
        pages.sort((a, b) => (a.path === "./" ? -1 : b.path === "./" ? 1 : 0));

        // the Web System, from the tokens
        const { vars, themes } = readTokens(await read("src/styles/base.css"));
        const fluid = (name, label, kind) => {
          const min = num(vars.get(`${name}-min`)), max = num(vars.get(`${name}-max`));
          if (min === null || max === null) return [];
          const one = (edge, w, v) => ({ name: `${name}-${edge}`, label: t.at(label, w), type: "length", value: v, css: "{v}", unitLabel: "px",
            min: 0, max: kind === "type" ? 240 : 320, step: 1, editable: true });
          return [one("min", 320, min), one("max", 1440, max)];
        };
        const label = (name) => tokenLabel(lang, name.slice(2));
        const colors = [...vars].filter(([, v]) => /^#[0-9a-f]{3,8}$/i.test(v)).map(([name, value]) => ({
          name, label: label(name), type: "color", value, editable: true }));
        const type = STYLES.flatMap(([id, label]) => fluid(`--${id}`, label, "type"));
        const space = [
          ...[...vars.keys()].filter((n) => /^--space-\d+$/.test(n)).flatMap((n) => fluid(n, label(n), "space")),
          ...[...vars.keys()].filter((n) => /^--section-space-[\w-]+$/.test(n) && !/-(min|max)$/.test(n)).flatMap((n) => fluid(n, label(n), "space")),
          ...fluid("--site-margin", label("--site-margin"), "space"), ...fluid("--site-gutter", label("--site-gutter"), "space"),
        ];
        const rem = (names) => names.map((name) => [name, remOf(vars.get(name))]).filter(([, v]) => v !== null).map(([name, value]) => ({
          name, label: label(name), type: "length", value, css: "{v}rem", unitLabel: "rem", min: 0, max: 100, step: 0.0625, editable: true }));
        const motion = [...vars].filter(([n, v]) => msOf(v) !== null && /duration/.test(n)).map(([name, v]) => ({
          name, label: label(name), type: "time", value: msOf(v), css: "{v}ms", unitLabel: "ms", min: 0, max: 2000, step: 10, editable: true }));
        const collections = [
          { id: "colors", name: t.colors, kind: "color", variables: colors },
          { id: "type", name: t.type, kind: "type", variables: type },
          { id: "space", name: t.space, kind: "space", variables: space },
          { id: "radius", name: t.radius, kind: "radius", variables: rem(["--radius-small", "--radius-main"]) },
          { id: "border", name: t.border, kind: "border", variables: rem(["--border-width", "--focus-width"]) },
          { id: "size", name: t.size, kind: "size", variables: rem(["--max-width-small", "--nav-height"]) },
          { id: "motion", name: t.motion, kind: "motion", variables: motion },
        ].filter((c) => c.variables.length);
        const astroConfig = await read("astro.config.mjs");
        const families = [...astroConfig.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);
        const weights = [...new Set([...astroConfig.matchAll(/weight:\s*"?(\d+)/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
        const roleNames = themes.length ? themes[0].roles.map(([n]) => n.slice(2)) : [];
        const system = {
          // no page of its own in the site: OP System draws the Web System with its own page, from this file
          page: "app",
          css: [...sheets],
          inline,
          base: "theme-light",
          reference: 1440,
          updated: today,
          about: t.about,
          collections,
          styles: STYLES.map(([id, label]) => ({ id, label, class: `text-style-${STYLE_CLASS[id] || id}`, size: `--${id}`, sample: t.sample })),
          roles: roleNames.map((id) => ({ id, label: lang === "en" ? words(id) : (ROLES_FR[id] || words(id)), name: `--${id}` })),
          fonts: families.map((family) => ({ family, stack: `${family}, system-ui, sans-serif`, weights: weights.length ? weights : [400], use: t.site })),
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
        // a role's colour, and its opacity when it is a tint (color-mix(in lab, var(--text) 60%, transparent))
        const refOf = (own, v) => {
          const mix = /^color-mix\(in \w+,\s*(var\(--[\w-]+\))\s+(\d+(?:\.\d+)?)%,\s*transparent\)$/.exec(v || "");
          if (mix) { const token = colourOf(own, mix[1]); return token ? { token, alpha: Number(mix[2]) / 100 } : null; }
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

        let domain = "";
        try { domain = siteUrl ? new URL(siteUrl).host : ""; } catch { domain = ""; }
        const manifest = {
          schema: "op-web-system/1",
          project: Object.assign({ id: conf.id || "site", name: conf.name || siteName, client: conf.client || "", studio: conf.studio || "",
            system: "Lumos for Astro", version: commit, updated: today, branch, lang, domain, description: conf.description || "" },
            conf.staging ? { staging: conf.staging } : {}),
          modes: [
            { id: "desktop", label: t.desktop, media: "(min-width: 64rem)", min: 1024 },
            { id: "tablet", label: t.tablet, media: "(min-width: 48rem) and (max-width: 63.99rem)", min: 768, max: 1023 },
            { id: "mobile", label: t.mobile, media: "(max-width: 47.99rem)", max: 767 },
          ],
          pages,
          system,
          themes: themeList,
          components: [],
          changes: [],
        };
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
