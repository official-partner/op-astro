import {
  getCollection,
  getLiveCollection,
  type CollectionEntry,
  type CollectionKey,
} from "astro:content";
import { imageConfig } from "astro:assets";
import { isRemoteAllowed } from "astro/assets/utils";
import { PICTURE, rejected } from "./content-loader";

/* How a page reads a collection: getItems("team"), getItem("team", "lea"). On the staging (an OP_LIVE build) it is
   the live collection, OP's working copy as Contenu and Modifier left it a moment ago; anywhere else, and on the
   staging whenever OP cannot answer, the committed files (src/content/). The same shape either way: { id, data },
   only the visible items (`visible: false` hides one), in their `order` (an item without one last, then by id).
   A picture is an optimized image when its file is committed, else a picture in OP's storage ({ src, width,
   height }): give it to <Img> with img(). Any collection of src/content.config.ts works by its name, nothing to add. */

/** A picture: a committed image, or one in OP's storage not committed yet (the staging only). */
export type RemotePicture = { src: string; width?: number; height?: number };
export type Picture = ImageMetadata | RemotePicture;
type Data<C extends CollectionKey> = {
  [
    K in keyof CollectionEntry<C>["data"]
  ]: CollectionEntry<C>["data"][K] extends ImageMetadata | undefined
    ? Picture | Extract<CollectionEntry<C>["data"][K], undefined>
    : CollectionEntry<C>["data"][K];
};
export type Item<C extends CollectionKey> = { id: string; data: Data<C> };

/* astro.config.mjs's define: true in a build of the staging (OP_LIVE) */
declare const __OP_LIVE__: boolean;
/** True on the staging's build (OP_LIVE): pages render on demand and read OP's working copy. */
export const LIVE: boolean = __OP_LIVE__;

/** <Img>'s src, width and height for a picture: `<Img {...img(data.photo)} alt="…" />`. */
export function img(picture: Picture): {
  src: ImageMetadata | string;
  width?: number;
  height?: number;
} {
  if ("format" in picture) return { src: picture };
  return { src: picture.src, width: picture.width, height: picture.height };
}

const committed = import.meta.glob<ImageMetadata>(
  [
    "/src/assets/content/**/*.{jpg,jpeg,png,webp,avif,gif,svg}",
    "/src/content/**/*.{jpg,jpeg,png,webp,avif,gif,svg}",
  ],
  { eager: true, import: "default" },
);

/* a picture of OP's working copy: « ../../assets/content/team/lea-photo.webp », written from src/content/<collection>/,
   → its committed image; a URL or { src, width, height } → a picture in OP's storage, when the site may show it
   (OP_STORAGE_ORIGINS). A path this build does not hold yet (committed after it was built), or a host the site may
   not show, gives no picture rather than a broken one. */
function picture(collection: string, value: unknown): Picture | undefined {
  const remote =
    typeof value === "string" ? { src: value } : (value as RemotePicture);
  if (!remote || typeof remote.src !== "string" || !remote.src)
    return undefined;
  if (/^https?:\/\//.test(remote.src)) {
    if (isRemoteAllowed(remote.src, imageConfig)) return remote;
    console.warn(
      `[op] ${collection}: ${remote.src} is not on a host the site may show (OP_STORAGE_ORIGINS)`,
    );
    return undefined;
  }
  const out: string[] = [];
  for (const p of `src/content/${collection}/${remote.src}`.split("/")) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  const found = committed[`/${out.join("/")}`];
  if (!found)
    console.warn(`[op] ${collection}: ${remote.src} is not in this build yet`);
  return found;
}

/* the tagged pictures of a live item (src/live.config.ts), wherever they are in its data, resolved */
function resolve(collection: string, value: unknown): unknown {
  if (Array.isArray(value))
    return value
      .map((v) => resolve(collection, v))
      .filter((v) => v !== undefined);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    if (PICTURE in value)
      return picture(collection, (value as Record<string, unknown>)[PICTURE]);
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolve(collection, v)]),
    );
  }
  return value;
}

const shown = (e: { data: object }) =>
  (e.data as { visible?: boolean }).visible !== false;
const orderOf = (e: { data: object }) => {
  const o = (e.data as { order?: unknown }).order;
  return typeof o === "number" && Number.isFinite(o) ? o : Infinity;
};
const byOrder = (
  a: { id: string; data: object },
  b: { id: string; data: object },
) => {
  const d = orderOf(a) - orderOf(b);
  return (Number.isNaN(d) ? 0 : d) || a.id.localeCompare(b.id);
};

async function files<C extends CollectionKey>(
  collection: C,
): Promise<Item<C>[]> {
  const entries = await getCollection(collection);
  return entries.map((e) => ({ id: e.id, data: e.data as Data<C> }));
}

/** A collection's visible items, in their `order` (then by id). */
export async function getItems<C extends CollectionKey>(
  collection: C,
): Promise<Item<C>[]> {
  let items: Item<C>[] | undefined;
  if (LIVE) {
    const { entries, error } = await getLiveCollection(
      `${collection}Live` as never,
    );
    if (!error && entries) {
      items = (entries as { id: string; data: Record<string, unknown> }[]).map(
        (e) => ({
          id: e.id,
          data: resolve(collection, e.data) as Data<C>,
        }),
      );
      const bad = rejected(collection);
      if (bad.size)
        items.push(...(await files(collection)).filter((i) => bad.has(i.id)));
    } else {
      console.warn(
        `[op] ${collection}: the committed files (${error?.message ?? "no answer"})`,
      );
    }
  }
  return (items ?? (await files(collection))).filter(shown).sort(byOrder);
}

/** One visible item of a collection, or undefined. */
export async function getItem<C extends CollectionKey>(
  collection: C,
  id: string,
): Promise<Item<C> | undefined> {
  return (await getItems(collection)).find((i) => i.id === id);
}
