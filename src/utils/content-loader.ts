import type { LiveLoader } from "astro/loaders";
import type { z } from "astro/zod";
import {
  OP_CONTENT_URL,
  OP_PROJECT,
  OP_CONTENT_TOKEN,
  OP_CONTENT_TTL,
} from "astro:env/server";
import config from "../../op.config.json";
import { DRAFT_HEADER, currentDraft } from "./draft";

/* The staging's live loader: a collection's working copy, as OP's worker gives it
   (GET <OP_CONTENT_URL>?p=<project>&c=<collection>, Authorization: Bearer <OP_CONTENT_TOKEN>
   → { version, updatedAt, items: [{ id, data }] }, data in the files' shape).
   - An answer is kept OP_CONTENT_TTL ms in this isolate, or until a request names a newer version (src/middleware.ts:
     ?op-v=<version> or x-op-content-version, sent by OP System right after a save).
   - No OP_CONTENT_URL, an error, a timeout (TIMEOUT) or an answer without items returns { error }: src/utils/content.ts
     then shows the committed files. A failure is remembered RETRY ms, so OP being down costs one wait, not one a page.
   - An item its collection's schema refuses is left out and named (rejected()): src/utils/content.ts shows its
     committed file instead, so one bad item never hides the others' edits.
   - What OP gives is what is published. A page OP System's frame asks for carries its proof (src/utils/draft.ts): it
     is handed on as x-op-draft, OP gives the drafts too, and the answer is kept apart, keyed by that proof, so a
     request without it never sees a draft. */

type Item = { id: string; data: Record<string, unknown> };
type Answer = { version: number; updatedAt?: string; items: Item[] };

/** The key a picture's value is tagged with in a live collection (src/live.config.ts), for src/utils/content.ts. */
export const PICTURE = "__opPicture";

export class OpContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpContentError";
  }
}

const TIMEOUT = 1500;
const RETRY = 5000;
type Kept = {
  at: number;
  version: number;
  answer: Promise<Answer>;
  failed?: boolean;
};
const kept = new Map<string, Kept>();
const refused = new Map<string, Set<string>>();
/* answers kept for a proof (OP's frame): a few, the oldest dropped first */
const DRAFTS_KEPT = 40;
const keyOf = (collection: string, draft: string) =>
  draft ? `${collection}|${draft}` : collection;

/* the newest version of the working copy a request named: an answer older than it is read again */
let latest = 0;
/** A request named the working copy's version (src/middleware.ts): what this isolate kept from before it is read
 * again. One counter for the project (OP's version is project-wide). */
export function seenVersion(version: number) {
  if (Number.isSafeInteger(version) && version > 0)
    latest = Math.max(latest, version);
}

/** The ids of a collection's items the schema refused in OP's last answer. */
export function rejected(collection: string): Set<string> {
  return refused.get(keyOf(collection, currentDraft())) ?? new Set();
}

function read(collection: string): Promise<Answer> {
  const draft = currentDraft();
  const key = keyOf(collection, draft);
  const hit = kept.get(key);
  if (hit) {
    const age = Date.now() - hit.at;
    if (
      hit.failed
        ? age < RETRY && latest <= hit.version
        : age < OP_CONTENT_TTL && hit.version >= latest
    )
      return hit.answer;
  }
  const url = new URL(OP_CONTENT_URL as string);
  url.searchParams.set("p", OP_PROJECT || config.id);
  url.searchParams.set("c", collection);
  const asked = latest;
  const headers: Record<string, string> = OP_CONTENT_TOKEN
    ? { authorization: `Bearer ${OP_CONTENT_TOKEN}` }
    : {};
  if (draft) headers[DRAFT_HEADER] = draft;
  const answer = fetch(url, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT),
  }).then(async (res) => {
    if (!res.ok)
      throw new OpContentError(`OP answered ${res.status} for ${collection}`);
    const body = (await res.json()) as Answer;
    if (!body || !Array.isArray(body.items))
      throw new OpContentError(`OP gave no items for ${collection}`);
    return { ...body, version: Number(body.version) || 0 };
  });
  const entry: Kept = { at: Date.now(), version: asked, answer };
  kept.delete(key);
  kept.set(key, entry);
  if (draft) {
    const drafts = [...kept.keys()].filter((k) => k.includes("|"));
    for (const k of drafts.slice(0, Math.max(0, drafts.length - DRAFTS_KEPT)))
      kept.delete(k);
  }
  answer.then(
    (a) => {
      entry.version = a.version;
      // a version named that OP does not have yet (or never will): this answer stands for it, so a wrong ?op-v
      // costs one read, not every read after it
      if (a.version < latest && asked === latest) latest = a.version;
    },
    () => {
      entry.failed = true;
      entry.at = Date.now();
    },
  );
  return answer;
}

const tag = (collection: string, id?: string) =>
  `op-content:${collection}${id ? `:${id}` : ""}`;
const failure = (err: unknown) => ({
  error: err instanceof OpContentError ? err : new OpContentError(String(err)),
});

/** The live loader of one collection; `schema` is the collection's own (src/live.config.ts). */
export function opContentLoader(
  schema: z.ZodType,
): LiveLoader<Record<string, unknown>, { id: string }, never, OpContentError> {
  const valid = (collection: string, items: Item[]) => {
    const bad = new Set<string>();
    const ok = items.filter((i) => {
      const fine =
        typeof i?.id === "string" && schema.safeParse(i.data ?? {}).success;
      if (!fine) bad.add(String(i?.id));
      return fine;
    });
    refused.set(keyOf(collection, currentDraft()), bad);
    if (bad.size)
      console.warn(
        `[op] ${collection}: the schema refused ${[...bad].join(", ")}; their files are shown`,
      );
    return ok;
  };
  return {
    name: "op-content",
    loadCollection: async ({ collection }) => {
      const name = collection.replace(/Live$/, "");
      if (!OP_CONTENT_URL) return failure("OP_CONTENT_URL is not set");
      try {
        const { items, updatedAt } = await read(name);
        const date = updatedAt ? new Date(updatedAt) : undefined;
        return {
          entries: valid(name, items).map(({ id, data }) => ({
            id,
            data,
            cacheHint: { tags: [tag(name, id)] },
          })),
          cacheHint: {
            tags: [tag(name)],
            ...(date && !isNaN(+date) ? { lastModified: date } : {}),
          },
        };
      } catch (err) {
        return failure(err);
      }
    },
    loadEntry: async ({ collection, filter }) => {
      const name = collection.replace(/Live$/, "");
      if (!OP_CONTENT_URL) return failure("OP_CONTENT_URL is not set");
      try {
        const { items } = await read(name);
        const item = valid(name, items).find((i) => i.id === filter.id);
        return (
          item && {
            id: item.id,
            data: item.data,
            cacheHint: { tags: [tag(name, item.id)] },
          }
        );
      } catch (err) {
        return failure(err);
      }
    },
  };
}
