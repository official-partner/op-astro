import type { LiveLoader } from "astro/loaders";
import { OP_CONTENT_URL, OP_PROJECT, OP_CONTENT_TOKEN, OP_CONTENT_TTL } from "astro:env/server";
import config from "../../op.config.json";

/* The staging's live loader: a collection's working copy, as OP's worker gives it
   (GET <OP_CONTENT_URL>?p=<project>&c=<collection> → { version, updatedAt, items: [{ id, data }] }).
   An answer is kept OP_CONTENT_TTL ms in this isolate (the same render asking twice asks once), or until a request
   names a newer version (src/middleware.ts); an error, a timeout (TIMEOUT)
   or no OP_CONTENT_URL returns { error }, and src/utils/content.ts falls back to the committed files. */

type Item = { id: string; data: Record<string, unknown> };
type Answer = { version: number | string; updatedAt?: string; items: Item[] };

export class OpContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpContentError";
  }
}

const TIMEOUT = 1500;
const kept = new Map<string, { at: number; version: number; answer: Promise<Answer> }>();

/* the newest version of the working copy a request named (src/middleware.ts): an answer older than it is not kept */
let latest = 0;
/** A request named the working copy's version (OP System, right after a save: ?op-v=<version> or the header
 * x-op-content-version): what this isolate kept from before it is read again. One counter for the project. */
export function seenVersion(version: number) {
  latest = Math.max(latest, version);
}

function read(name: string): Promise<Answer> {
  const collection = name.replace(/Live$/, "");
  const key = collection;
  const hit = kept.get(key);
  if (hit && Date.now() - hit.at < OP_CONTENT_TTL && hit.version >= latest) return hit.answer;
  const url = new URL(OP_CONTENT_URL as string);
  url.searchParams.set("p", OP_PROJECT || config.id);
  url.searchParams.set("c", collection);
  const answer = fetch(url, {
    headers: OP_CONTENT_TOKEN ? { authorization: `Bearer ${OP_CONTENT_TOKEN}` } : {},
    signal: AbortSignal.timeout(TIMEOUT),
  }).then(async (res) => {
    if (!res.ok) throw new OpContentError(`OP content ${res.status} for ${collection}`);
    const body = (await res.json()) as Answer;
    if (!body || !Array.isArray(body.items)) throw new OpContentError(`OP content: no items for ${collection}`);
    return body;
  });
  const entry = { at: Date.now(), version: latest, answer };   // asked after the newest version named: at least as new
  kept.set(key, entry);
  answer.then((a) => { entry.version = Number(a.version) || 0; }, () => kept.delete(key));
  return answer;
}


const tag = (name: string, id?: string) => `op-content:${name.replace(/Live$/, "")}${id ? `:${id}` : ""}`;

export function opContentLoader(): LiveLoader<Record<string, unknown>, { id: string }, never, OpContentError> {
  return {
    name: "op-content",
    loadCollection: async ({ collection }) => {
      if (!OP_CONTENT_URL) return { error: new OpContentError("OP_CONTENT_URL is not set") };
      try {
        const { items, updatedAt } = await read(collection);
        const lastModified = updatedAt ? new Date(updatedAt) : undefined;
        return {
          entries: items.map(({ id, data }) => ({ id, data, cacheHint: { tags: [tag(collection, id)] } })),
          cacheHint: { tags: [tag(collection)], lastModified },
        };
      } catch (err) {
        return { error: err instanceof OpContentError ? err : new OpContentError(String(err)) };
      }
    },
    loadEntry: async ({ collection, filter }) => {
      if (!OP_CONTENT_URL) return { error: new OpContentError("OP_CONTENT_URL is not set") };
      try {
        const { items } = await read(collection);
        const item = items.find((i) => i.id === filter.id);
        return item && { id: item.id, data: item.data, cacheHint: { tags: [tag(collection, item.id)] } };
      } catch (err) {
        return { error: err instanceof OpContentError ? err : new OpContentError(String(err)) };
      }
    },
  };
}
