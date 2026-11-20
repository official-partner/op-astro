/* A list of a collection's items, by its rule (docs/content.md, A list's rule). The rules are in src/data/lists.json,
   one per list, by the list's name: OP System's Options panel writes that file itself, so a rule changes with no
   request to Claude. A page reads a list with `listed("<name>")` and marks it with `ruleMarks("<name>")`; a list with
   no rule of its own reads its collection whole with getItems (src/utils/content.ts), as before. */
import type { CollectionKey } from "astro:content";
import { z } from "astro/zod";
import { getItems, type Item } from "@/utils/content";
import { applyRule, type ListRule } from "@/utils/list-rule";
import listsData from "@/data/lists.json";

const FILE = "src/data/lists.json";
const condition = z.object({
  field: z.string(),
  op: z.enum(["is", "not", "after", "before", "has", "set", "unset"]),
  value: z.unknown().optional(),
});
const rule = z.object({
  collection: z.string(),
  shows: z.enum(["all", "some", "chosen"]).optional(),
  where: z.array(condition).optional(),
  order: z.union([z.literal("hand"), z.array(z.object({ by: z.string(), dir: z.enum(["asc", "desc"]).optional() }))]).optional(),
  limit: z.number().int().min(0).optional(),
  start: z.number().int().min(1).optional(),
  chosen: z.array(z.string()).optional(),
  out: z.array(z.string()).optional(),
  skipSelf: z.boolean().optional(),
});
const parsed = z.object({ lists: z.record(z.string(), rule) }).safeParse(listsData);
if (!parsed.success) throw new Error(`${FILE}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
const RULES: Record<string, ListRule> = parsed.data.lists as Record<string, ListRule>;

/** A list's rule, by the list's name. The build stops on a name the file does not have: a list never shows a whole
 *  collection because its rule was misspelled. */
export function ruleOf(name: string): ListRule {
  const r = RULES[name];
  if (!r) throw new Error(`${FILE}: no rule named « ${name} »`);
  return r;
}

/** The items a list shows, by its rule. `self`: the id of the page's own item, on an item's page. */
export async function listed<C extends CollectionKey>(name: string, self?: string): Promise<Item<C>[]> {
  const r = ruleOf(name);
  const items = await getItems(r.collection as C);
  return applyRule(items as (Item<C> & { data: Record<string, unknown> })[], r, self);
}

/** What the list's element carries for OP System: its name, its collection, where its rule is written and the rule
 *  as this build read it (what the app's Options panel shows, and changes from). Each item carries
 *  `data-op-item={id}` as any list of a collection. */
export const ruleMarks = (name: string) => ({
  "data-op-list": name,
  "data-op-source": `astro:${ruleOf(name).collection}`,
  "data-op-rule": FILE,
  "data-op-rule-is": JSON.stringify(ruleOf(name)),
});
