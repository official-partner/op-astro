// The site's icons (Official Partner, Oct 17, 2026), all drawn from one mark:
//   public/favicon.svg           the tab's icon, a rounded square (7 of 32, as OP System's own)
//   public/favicon.ico           the same as a 32 px PNG, for what cannot read an SVG
//   public/apple-touch-icon.png  180 px, square on the brand colour (iOS rounds it itself)
//   public/og-image.jpg          1200 × 630, the mark on OP System's canvas, until the site has its own
//
// The mark is src/assets/logo/mark.svg when the site has one: a square of the brand's main colour with the logo's
// first letter on it, its own path cut out of the logo (CLAUDE.md, Logo and favicon). Until then it is the site's
// initial (SITE_NAME, src/consts.ts) on op.config.json's brandColor (OP's ink by default), the letter drawn in strokes
// as OP System draws its own mark (a ring, a stem and a bowl, 3 of 32 thick), so no font is needed to draw it.
//
//   node scripts/favicon.mjs               (npm run favicon) writes the icons; og-image.jpg only if it is missing or
//                                          was made here, never one made by hand
//   node scripts/favicon.mjs --if-missing  (prebuild) only what is missing, or what this script made from other
//                                          inputs (the name, the colour or the mark changed); never a file made by hand
import { readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const at = (...p) => path.join(ROOT, ...p);
const PUBLIC = at("public");
const MARK = at("src", "assets", "logo", "mark.svg");
const INK = "#141413";
const WHITE = "#ffffff";
const CANVAS = "#efefec";
const VERSION = "1";

const ifMissing = process.argv.includes("--if-missing");
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );
const read = (p) => readFile(p, "utf8").catch(() => "");

/* ------------------------------------------------------------------ the letters */
// Each letter on a 32-unit square: its strokes' centre lines, 3 thick, clipped to the cap height (9.25 to 22.75, as
// OP System's mark), so a diagonal ends flat on the line. Butt ends, mitred corners.
const GLYPHS = {
  A: "M10.2 24L16 9.25L21.8 24M12.5 18.25H19.5",
  B: "M11.5 9.25V22.75M11.5 10.75H17.25A2.625 2.625 0 0 1 17.25 16H11.5M11.5 16H17.75A2.625 2.625 0 0 1 17.75 21.25H11.5",
  C: "M20.1 12.4A5.25 5.25 0 1 0 20.1 19.6",
  D: "M11.5 9.25V22.75M11.5 10.75H15.25A5.25 5.25 0 0 1 15.25 21.25H11.5",
  E: "M21.25 10.75H11.5V21.25H21.25M11.5 16H19.75",
  F: "M21.25 10.75H11.5V22.75M11.5 16.25H19.75",
  G: "M20.1 12.4A5.25 5.25 0 1 0 21.25 16H16.5",
  H: "M11.5 9.25V22.75M20.5 9.25V22.75M11.5 16H20.5",
  I: "M16 9.25V22.75",
  J: "M19.5 9.25V17.5A3.75 3.75 0 0 1 12 17.5",
  K: "M11.5 9.25V22.75M21.9 8.2L11.5 17.6M15.2 14.25L22.6 23.6",
  L: "M11.5 9.25V21.25H21",
  M: "M10.75 23V10.25L16 17.75L21.25 10.25V23",
  N: "M11.5 23V9.75L20.5 22.25V9",
  O: "M21.25 16A5.25 5.25 0 1 1 10.75 16A5.25 5.25 0 1 1 21.25 16Z",
  P: "M12.875 9.25V22.75M12.875 10.75H15.875A3.25 3.25 0 0 1 15.875 17.25H12.875",
  Q: "M21.25 16A5.25 5.25 0 1 1 10.75 16A5.25 5.25 0 1 1 21.25 16ZM17.75 17.75L23 23",
  R: "M12 9.25V22.75M12 10.75H16A3 3 0 0 1 16 16.75H12M15.75 16.75L21.25 23.5",
  S: "M20.3 12.6C19.7 11.4 18.2 10.75 16 10.75C13.4 10.75 11.75 11.8 11.75 13.35C11.75 17.3 20.5 14.6 20.5 18.5C20.5 20.15 18.7 21.25 16 21.25C13.5 21.25 11.9 20.5 11.4 19.2",
  T: "M10.5 10.75H21.5M16 10.75V22.75",
  U: "M11.5 9.25V16.75A4.5 4.5 0 0 0 20.5 16.75V9.25",
  V: "M10.2 8L16 22.75L21.8 8",
  W: "M9.6 8.5L12.5 23.2L16 12.2L19.5 23.2L22.4 8.5",
  X: "M10.6 8.6L21.4 23.4M21.4 8.6L10.6 23.4",
  Y: "M10.5 8.6L16 16.4L21.5 8.6M16 16.4V22.75",
  Z: "M11 10.75H20.5L11.5 21.25H21",
  0: "M20.5 16A4.5 5.25 0 1 1 11.5 16A4.5 5.25 0 1 1 20.5 16Z",
  1: "M12.6 12.9L16.6 9.6V22.75",
  2: "M11.7 13.7C11.7 11.9 13.5 10.75 16 10.75C18.6 10.75 20.3 11.9 20.3 13.75C20.3 16.6 11.75 18.1 11.75 21.25H20.75",
  3: "M11.5 10.75H20L16 15.5C18.9 15.5 20.6 16.6 20.6 18.35C20.6 20.15 18.7 21.25 16.1 21.25C13.8 21.25 12.1 20.5 11.4 19.25",
  4: "M18.5 22.75V9.75L10.9 18.4H21.6",
  5: "M20.25 10.75H12.4L11.9 15.9C12.9 15.3 14.2 15 15.7 15C18.7 15 20.6 16.35 20.6 18.15C20.6 20.05 18.6 21.25 16 21.25C13.75 21.25 12.1 20.5 11.4 19.4",
  6: "M18.9 9.25L12.75 15.3M20 17.25A4 4 0 1 1 12 17.25A4 4 0 1 1 20 17.25Z",
  7: "M11 10.75H21L14.4 23",
  8: "M19.75 13.375A3.75 2.625 0 1 1 12.25 13.375A3.75 2.625 0 1 1 19.75 13.375ZM20.25 18.625A4.25 2.625 0 1 1 11.75 18.625A4.25 2.625 0 1 1 20.25 18.625Z",
  9: "M13.1 22.75L19.25 16.7M20 14.75A4 4 0 1 1 12 14.75A4 4 0 1 1 20 14.75Z",
};

/* the first letter or digit of a name, without its accent (« Écurie » gives E) */
export function initialOf(name) {
  const plain = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
  return (/[A-Z0-9]/.exec(plain) || [""])[0];
}

/* relative luminance and contrast (WCAG) */
const lum = (hex) => {
  const n = hex.replace("#", "");
  const full =
    n.length === 3
      ? n
          .split("")
          .map((c) => c + c)
          .join("")
      : n;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/* the letter in white on a dark colour, in ink on a light one */
export const letterColour = (bg) =>
  contrast(bg, WHITE) >= contrast(bg, INK) ? WHITE : INK;

/* the mark of a site with no logo yet: its initial on the brand colour, a square edge to edge */
export function initialArt(letter, colour) {
  const fg = letterColour(colour);
  const glyph = GLYPHS[letter]
    ? `<clipPath id="favicon-cap"><rect y="9.25" width="32" height="13.5"/></clipPath><path d="${GLYPHS[letter]}" fill="none" stroke="${fg}" stroke-width="3" clip-path="url(#favicon-cap)"/>`
    : `<circle cx="16" cy="16" r="3" fill="${fg}"/>`;
  return {
    viewBox: "0 0 32 32",
    inner: `<rect width="32" height="32" fill="${colour}"/>${glyph}`,
  };
}

/* a mark.svg drawn for the site: its viewBox and what is inside its root */
function fileArt(svg) {
  const open = /<svg\b[^>]*>/i.exec(svg);
  const close = svg.toLowerCase().lastIndexOf("</svg>");
  if (!open || close < 0)
    throw new Error("src/assets/logo/mark.svg is not an SVG");
  const attrs = open[0];
  const vb = /viewBox="([^"]+)"/i.exec(attrs);
  const w = /\swidth="([\d.]+)/i.exec(attrs),
    h = /\sheight="([\d.]+)/i.exec(attrs);
  const viewBox = vb ? vb[1] : w && h ? `0 0 ${w[1]} ${h[1]}` : "0 0 32 32";
  return {
    viewBox,
    inner: svg.slice(open.index + open[0].length, close).trim(),
  };
}

/* the art as a square SVG of `size`, rounded like OP System's tab icon (7 of 32) or square */
function svgOf(art, { colour, rounded, stamp = "" }) {
  const clip = rounded
    ? `<clipPath id="favicon-round"><rect width="32" height="32" rx="7"/></clipPath>`
    : "";
  const body =
    art.viewBox === "0 0 32 32"
      ? art.inner
      : `<rect width="32" height="32" fill="${colour}"/><svg width="32" height="32" viewBox="${art.viewBox}">${art.inner}</svg>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${stamp ? `<!-- favicon.mjs:${stamp} -->` : ""}${clip}` +
    (rounded ? `<g clip-path="url(#favicon-round)">${body}</g>` : body) +
    "</svg>\n"
  );
}

/* an ICO file holding one 32 px PNG */
function ico(png) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(1, 4); // an icon, one image
  head.writeUInt8(32, 6);
  head.writeUInt8(32, 7);
  head.writeUInt8(0, 8);
  head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10);
  head.writeUInt16LE(32, 12);
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18);
  return Buffer.concat([head, png]);
}

/* ------------------------------------------------------------------ the inputs */
async function inputs() {
  const conf = JSON.parse((await read(at("op.config.json"))) || "{}");
  const consts = await read(at("src", "consts.ts"));
  const name =
    (/SITE_NAME\s*=\s*(["'`])(.*?)\1/.exec(consts) || [])[2] || conf.name || "";
  const colour = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(conf.brandColor || "")
    ? conf.brandColor.toLowerCase()
    : INK;
  const markFile = (await exists(MARK)) ? await read(MARK) : "";
  const art = markFile
    ? fileArt(markFile)
    : initialArt(initialOf(name), colour);
  const key = createHash("sha1")
    .update([VERSION, colour, art.viewBox, art.inner].join("\n"))
    .digest("hex")
    .slice(0, 12);
  return {
    name,
    colour,
    art,
    key,
    site: conf.favicon === "site",
    from: markFile
      ? "src/assets/logo/mark.svg"
      : `« ${initialOf(name) || "·"} » on ${colour}`,
  };
}

async function main() {
  const { colour, art, key, from, site } = await inputs();
  let sharp = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    sharp = null;
  }

  const file = (name) => path.join(PUBLIC, name);
  const current = await read(file("favicon.svg"));
  const stamp = (/favicon\.mjs:([0-9a-f]+)/.exec(current) || [])[1];
  // the current site's icons, kept (op.config.json "favicon": "site", written by OP System at a redo's setup:
  // op-system's worker/icons.js): favicon.ico, apple-touch-icon.png and favicon.svg are theirs, never written here,
  // even by npm run favicon; a missing favicon.svg stays missing (BaseHead links it only when it is there)
  const handMade = site || (Boolean(current) && !stamp);
  const stale = !site && (!current || (stamp && stamp !== key));
  const writes = [];

  // the tab's icon and its rasters: together, from the mark; a favicon.svg made by hand stays, its rasters drawn from it
  const ownSvg = svgOf(art, { colour, rounded: true, stamp: key });
  const keep = (ifMissing || site) && handMade;
  const roundSvg = keep ? current : ownSvg;
  const squareSvg = keep ? current : svgOf(art, { colour, rounded: false });
  const all = !site && (!ifMissing || (stale && !handMade));
  if (all) {
    await writeFile(file("favicon.svg"), ownSvg);
    writes.push("favicon.svg");
  }

  const raster = (svg, size) =>
    sharp(Buffer.from(svg), { density: (72 * size) / 32 }).resize(size, size);
  if (!sharp) {
    console.warn(
      "favicon: sharp is not installed, so favicon.ico, apple-touch-icon.png and og-image.jpg were not written",
    );
  } else {
    if (all || (!site && !(await exists(file("favicon.ico"))))) {
      await writeFile(
        file("favicon.ico"),
        ico(await raster(roundSvg, 32).png().toBuffer()),
      );
      writes.push("favicon.ico");
    }
    if (all || (!site && !(await exists(file("apple-touch-icon.png"))))) {
      await raster(squareSvg, 180)
        .flatten({ background: colour })
        .png()
        .toFile(file("apple-touch-icon.png"));
      writes.push("apple-touch-icon.png");
    }
    // the picture a shared link shows: replaced only when it is missing or was made here (its description says so)
    const og = file("og-image.jpg");
    let ogOwn = false,
      ogKey = "";
    if (await exists(og)) {
      const { exif } = await sharp(og).metadata();
      const found = /favicon\.mjs:([0-9a-f]+)/.exec(
        exif ? exif.toString("latin1") : "",
      );
      ogOwn = Boolean(found);
      ogKey = found ? found[1] : "";
    }
    if (!(await exists(og)) || (ogOwn && (ogKey !== key || !ifMissing))) {
      const mark = await raster(svgOf(art, { colour, rounded: true }), 144)
        .png()
        .toBuffer();
      await sharp({
        create: { width: 1200, height: 630, channels: 3, background: CANVAS },
      })
        .composite([{ input: mark, gravity: "centre" }])
        .jpeg({ quality: 90, mozjpeg: true })
        .withExif({ IFD0: { ImageDescription: `favicon.mjs:${key}` } })
        .toFile(og);
      writes.push("og-image.jpg");
    }
  }
  if (writes.length || !ifMissing)
    console.log(
      `favicon: ${writes.join(", ") || "nothing to write"} (${site ? "the current site's icons kept: op.config.json favicon \"site\"" : `from ${from}${keep ? "; favicon.svg made by hand, kept" : ""}`})`,
    );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(`favicon: ${error.message}`);
    process.exit(1);
  });
}
