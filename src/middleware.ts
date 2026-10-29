import { defineMiddleware } from "astro:middleware";
import { seenVersion } from "@/utils/content-loader";
import { draftOf, withDraft } from "@/utils/draft";

/* On the staging (an OP_LIVE build), for a page the Worker renders:
   - OP System asks for it right after a save with the working copy's version (?op-v=<version>, or the header
     x-op-content-version): what this Worker kept from before is read again, so the page shows the save at once;
   - it gets the headers dist/_headers gives the static files (never indexed, the secure headers: integrations/op-live.mjs),
     and is never kept by a cache between the Worker and the person (OP's proxy included);
   - OP System's frame asks with its draft proof (x-op-draft, src/utils/draft.ts): the page is rendered whole within
     it, so every read of the working copy hands it on and the drafts show there only.
   Anywhere else this does nothing. */
declare const __OP_LIVE__: boolean;
declare const __OP_HEADERS__: [string, string][];

export const onRequest = defineMiddleware(async (context, next) => {
  if (!__OP_LIVE__ || context.isPrerendered) return next();
  const v = Number(
    context.url.searchParams.get("op-v") ||
      context.request.headers.get("x-op-content-version"),
  );
  if (v > 0) seenVersion(v);
  const draft = draftOf(context.request);
  let response = draft
    ? await withDraft(draft, async () => {
        // rendered to its end inside the proof's scope (a streamed page would read its collections after next()
        // returned)
        const r = await next();
        return new Response(await r.arrayBuffer(), r);
      })
    : await next();
  const write = () => {
    for (const [name, value] of __OP_HEADERS__)
      if (!response.headers.has(name)) response.headers.set(name, value);
    response.headers.set("Cache-Control", "private, no-store");
  };
  try {
    write();
  } catch {
    // a response whose headers cannot change (a redirect): the same one, its headers writable
    response = new Response(response.body, response);
    write();
  }
  return response;
});
