/* A list's rule (docs/content.md, A list's rule): which items of a collection a list shows, in what order, how many.
   The rules live in src/data/lists.json, one per list, by the list's name; OP System's Options panel writes that
   file itself, as it writes a list kept as data. This file is the rule alone, with nothing of Astro in it, so it is
   tested by itself (scripts/list-rule.test.mjs); src/utils/lists.ts reads a collection through it. */

/** One condition: the items where `field` stands that way to `value`. */
export type Condition = {
  field: string;
  /** `is`: equal, or one of several; `not`: the reverse; `after`, `before`: a number or a date; `has`: a text or a
   *  list of words that holds it; `set`, `unset`: filled or not. */
  op: "is" | "not" | "after" | "before" | "has" | "set" | "unset";
  value?: unknown;
};
export type Order = { by: string; dir?: "asc" | "desc" };
export type ListRule = {
  /** The collection the list shows. */
  collection: string;
  /** `all`: every item; `some`: those the conditions keep; `chosen`: the ones picked by hand, in `chosen`. */
  shows?: "all" | "some" | "chosen";
  where?: Condition[];
  /** The fields that sort, the first one first; `hand`: the order of `chosen`, then the others as the collection has
   *  them. Nothing: the collection's own order. */
  order?: Order[] | "hand";
  /** At most this many (0 or nothing: all). */
  limit?: number;
  /** The first one shown, counted from 1. */
  start?: number;
  /** Ids picked by hand (`shows: "chosen"`), or put first by hand (`order: "hand"`). */
  chosen?: string[];
  /** Ids left aside. */
  out?: string[];
  /** On an item's own page: leave that item out. */
  skipSelf?: boolean;
};
type Entry = { id: string; data: Record<string, unknown> };

const blank = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
/* a number, or a date as its time; else nothing */
const amount = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    const t = Date.parse(v);
    return Number.isNaN(t) ? undefined : t;
  }
  return undefined;
};
/* a reference is its id; a date its day; anything else its words */
const word = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : v && typeof v === "object" && "id" in v ? String((v as { id: unknown }).id) : String(v ?? "");
const same = (a: unknown, b: unknown) => word(a).trim().toLowerCase() === word(b).trim().toLowerCase();

/** Whether an item passes one condition. A condition on a field the item does not have keeps nothing, but `unset`. */
export function passes(data: Record<string, unknown>, c: Condition): boolean {
  const v = data[c.field];
  if (c.op === "set") return !blank(v);
  if (c.op === "unset") return blank(v);
  const wanted = Array.isArray(c.value) ? c.value : [c.value];
  const mine = Array.isArray(v) ? v : [v];
  if (c.op === "is") return !blank(v) && mine.some((m) => wanted.some((w) => same(m, w)));
  if (c.op === "not") return !mine.some((m) => wanted.some((w) => same(m, w)));
  if (c.op === "has") return !blank(v) && wanted.some((w) => mine.some((m) => word(m).toLowerCase().includes(word(w).trim().toLowerCase())));
  const a = amount(v), b = amount(c.value);
  if (a === undefined || b === undefined) return false;
  return c.op === "after" ? a > b : a < b;
}

const compare = (a: unknown, b: unknown): number => {
  if (blank(a) || blank(b)) return blank(a) === blank(b) ? 0 : blank(a) ? 1 : -1;   // the empty ones last, either way
  const x = amount(a), y = amount(b);
  if (x !== undefined && y !== undefined) return x - y;
  return word(a).localeCompare(word(b), undefined, { numeric: true, sensitivity: "base" });
};

/** The items a rule keeps, in its order. `items` come as the collection has them (visible, in their own order);
 *  `self` is the id of the page's own item, where the list sits on an item's page. */
export function applyRule<T extends Entry>(items: T[], rule: ListRule | undefined, self?: string): T[] {
  if (!rule) return items;
  const out = new Set(rule.out ?? []), chosen = rule.chosen ?? [];
  let list = items.filter((i) => !out.has(i.id) && !(rule.skipSelf && self && i.id === self));
  if (rule.shows === "chosen") {
    const by = new Map(list.map((i) => [i.id, i]));
    list = chosen.map((id) => by.get(id)).filter((i): i is T => !!i);
  } else {
    if (rule.shows === "some") list = list.filter((i) => (rule.where ?? []).every((c) => passes(i.data, c)));
    if (rule.order === "hand") {
      const at = new Map(chosen.map((id, n) => [id, n]));
      list = list
        .map((i, n) => ({ i, n }))
        .sort((a, b) => (at.get(a.i.id) ?? chosen.length + a.n) - (at.get(b.i.id) ?? chosen.length + b.n))
        .map((x) => x.i);
    } else if (Array.isArray(rule.order) && rule.order.length) {
      const order = rule.order;
      list = list
        .map((i, n) => ({ i, n }))
        .sort((a, b) => {
          for (const o of order) {
            const blankSide = blank(a.i.data[o.by]) || blank(b.i.data[o.by]);
            const d = compare(a.i.data[o.by], b.i.data[o.by]);
            if (d) return blankSide || o.dir !== "desc" ? d : -d;
          }
          return a.n - b.n;
        })
        .map((x) => x.i);
    }
  }
  const start = Math.max(1, Math.floor(rule.start ?? 1)) - 1;
  const limit = Math.max(0, Math.floor(rule.limit ?? 0));
  return list.slice(start, limit ? start + limit : undefined);
}
