import { NOINDEX_ROUTES } from "../consts.ts";

const normalize = (path: string) => `/${path.replace(/^\/+|\/+$/g, "")}`;

const excluded = new Set(NOINDEX_ROUTES.map(normalize));

/** Checks whether a route should be hidden from search. Used by BaseHead. */
export function isNoindexRoute(pathname: string): boolean {
  return excluded.has(normalize(pathname));
}

/** What an item's page gives Google and a shared link when its « For Google » fields are left empty (Sam, Nov 24: the
 *  client should not have to remember them): its own title, the first short text it has, its first picture. A field
 *  filled in Contenu (`seoTitle`, `seoDescription`, `ogImage`) always wins. Spread into the layout:
 *  `<Layout {...itemSeo(data)}>`. OP System shows the same values as the fields' placeholders (site.json `seoDefaults`). */
const WORDS = ["summary", "description", "excerpt", "intro", "bio", "role", "text"];
const PICTURES = ["cover", "image", "photo", "picture", "thumbnail"];
const plain = (v: unknown) => (typeof v === "string" ? v.replace(/[#*_>`[\]]/g, "").replace(/\s+/g, " ").trim() : "");
const cut = (t: string, n = 160) => (t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}\u2026`);
const srcOf = (v: unknown) => (typeof v === "string" ? v : v && typeof v === "object" && typeof (v as { src?: unknown }).src === "string" ? (v as { src: string }).src : "");
export function itemSeo(data: Record<string, unknown>): { title?: string; seoTitle?: string; description?: string; image?: string; type: "article" } {
  const title = plain(data.title) || plain(data.name) || plain(data.question) || undefined;
  const words = plain(data.seoDescription) || WORDS.map((k) => plain(data[k])).find(Boolean) || "";
  const picture = srcOf(data.ogImage) || PICTURES.map((k) => srcOf(data[k])).find(Boolean) || "";
  return {
    title,
    seoTitle: plain(data.seoTitle) || undefined,
    ...(words ? { description: cut(words) } : {}),
    ...(picture ? { image: picture } : {}),
    type: "article",
  };
}
