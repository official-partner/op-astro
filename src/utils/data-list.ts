/* A page's list kept as data (Nov 19; docs/content.md, Lists as data): the items of a block (a section's cards,
   offers, values, prices, partners) live in a JSON file of a fixed form, src/data/<name>.json,
   `{ "items": [ { "id": "…", … } ] }`, checked against a schema when the site is built: a wrong entry stops the build
   and never reaches the site. OP System writes that file itself when someone copies, deletes or moves an item on the
   canvas: no request, no wait. Not a collection: nothing of it is in src/content.config.ts, and Contenu does not
   list it. */
import type { ImageMetadata } from "astro";
import { z } from "astro/zod";

const pictures = import.meta.glob<ImageMetadata>("/src/assets/**/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default",
});

/** A picture of src/assets/ by its path from there (« photos/club.jpg »), as Astro's own import gives it: optimised
 *  like any other. `file`: the data file that names it, for the error. */
export function picture(path: string, file: string): ImageMetadata {
  const found = pictures[`/src/assets/${path.replace(/^\/+/, "")}`];
  if (!found) throw new Error(`${file}: no picture « ${path} » in src/assets/`);
  return found;
}

/** The items of a data file, each checked: a wrong one stops the build and says which, and why. Every item has an
 *  `id` of its own (letters, digits, hyphens), which the page puts on it as `data-op-item`. */
export function listFrom<T extends { id: string }>(data: unknown, item: z.ZodType<T>, file: string): T[] {
  const read = z.object({ items: z.array(item) }).safeParse(data);
  if (!read.success) {
    const first = read.error.issues[0];
    throw new Error(`${file}: ${first.path.join(".")}: ${first.message}`);
  }
  const ids = read.data.items.map((it) => it.id);
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice) throw new Error(`${file}: two items share the id « ${twice} »`);
  return read.data.items;
}

/** What marks the list for OP System: on the list itself, with `data-op-item={item.id}` on each of its children. */
export const listMarks = (name: string, file: string) => ({ "data-op-list": name, "data-op-source": file });
