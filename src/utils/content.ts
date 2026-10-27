import { getCollection, getLiveCollection, type CollectionEntry, type CollectionKey } from "astro:content";

/* How a page reads a collection: getItems("team"), getItem("team", "lea"). On the staging (an OP_LIVE build) it is
   the live collection, OP's working copy as Contenu and Modifier left it a moment ago; anywhere else, and on the
   staging when OP cannot answer, it is the committed files (src/content/). The same shape either way: { id, data },
   a picture's field an optimized image when its file is committed, else the URL of the picture in OP's storage. */

type Picture = ImageMetadata | string;
type Data<C extends CollectionKey> = {
  [K in keyof CollectionEntry<C>["data"]]: CollectionEntry<C>["data"][K] extends ImageMetadata | undefined
    ? Picture | Extract<CollectionEntry<C>["data"][K], undefined>
    : CollectionEntry<C>["data"][K];
};
export type Item<C extends CollectionKey> = { id: string; data: Data<C> };

/* astro.config.mjs's define: true in a build of the staging (OP_LIVE) */
declare const __OP_LIVE__: boolean;
/** True on the staging's build (OP_LIVE): pages render on demand and read OP's working copy. */
export const LIVE: boolean = __OP_LIVE__;

const committed = import.meta.glob<ImageMetadata>(
  ["/src/assets/content/**/*.{jpg,jpeg,png,webp,avif,gif}", "/src/content/**/*.{jpg,jpeg,png,webp,avif,gif}"],
  { eager: true, import: "default" },
);

/* « ../../assets/content/team/lea-photo.webp », written from src/content/<collection>/, → its committed image; a path
   this build does not hold (committed after it was built) shows nothing rather than a broken image */
function picture(collection: string, value: string): Picture | undefined {
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;
  const parts = `src/content/${collection}/${value}`.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  const found = committed[`/${out.join("/")}`];
  if (!found) console.warn(`[op] ${collection}: ${value} is not in this build`);
  return found;
}

function resolve<C extends CollectionKey>(collection: C, data: Record<string, unknown>): Data<C> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === "string" && /\.(jpe?g|png|webp|avif|gif)(\?|#|$)/i.test(v) ? picture(collection, v) : v;
  }
  return out as Data<C>;
}

const byOrder = (a: { id: string; data: object }, b: { id: string; data: object }) => {
  const oa = (a.data as { order?: number }).order ?? 0;
  const ob = (b.data as { order?: number }).order ?? 0;
  return oa - ob || a.id.localeCompare(b.id);
};

/** A collection's items, in their `order` (then by id). */
export async function getItems<C extends CollectionKey>(collection: C): Promise<Item<C>[]> {
  if (LIVE) {
    const { entries, error } = await getLiveCollection(`${collection}Live` as never);
    if (!error && entries) {
      return entries
        .map((e) => ({ id: e.id, data: resolve(collection, e.data as Record<string, unknown>) }))
        .sort(byOrder);
    }
    console.warn(`[op] ${collection}: the committed files (${error?.message ?? "no answer"})`);
  }
  const entries = await getCollection(collection);
  return entries.map((e) => ({ id: e.id, data: e.data as Data<C> })).sort(byOrder);
}

/** One item of a collection, or undefined. */
export async function getItem<C extends CollectionKey>(collection: C, id: string): Promise<Item<C> | undefined> {
  const items = await getItems(collection);
  return items.find((i) => i.id === id);
}
