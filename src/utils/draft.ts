import { AsyncLocalStorage } from "node:async_hooks";

/* Contenu's drafts in OP System's frame (OP System, Oct 28: every change in Contenu is a draft until « Publier »).

   The staging shows what is published. When OP System shows this staging in its own frame, its proxy asks for each
   page with a header, `x-op-draft`: a short proof OP signs, naming the project and the person looking. This Worker
   cannot read it; it hands it on, with its own read of OP's working copy (src/utils/content-loader.ts), and OP gives
   the drafts only when the proof is good and the person may change the content. A request without it (the client's
   link, a visitor) reads the published state.

   The proof lives for one request only: src/middleware.ts runs the page inside withDraft(), and the loader reads
   currentDraft(), never a module variable another request could see. Needs `nodejs_als` (wrangler.jsonc). */

export const DRAFT_HEADER = "x-op-draft";
const store = new AsyncLocalStorage<string>();

/** The proof a request carries, when it has the shape OP gives it; "" otherwise. */
export function draftOf(request: Request): string {
  const v = request.headers.get(DRAFT_HEADER) || "";
  return /^[A-Za-z0-9_-]{8,600}\.[A-Za-z0-9_-]{20,100}$/.test(v) ? v : "";
}

/** Runs `fn` with the request's proof, for the loader to hand on. */
export function withDraft<T>(proof: string, fn: () => T): T {
  return store.run(proof, fn);
}

/** The proof of the request being rendered, or "". */
export function currentDraft(): string {
  return store.getStore() || "";
}
