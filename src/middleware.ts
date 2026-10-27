import { defineMiddleware } from "astro:middleware";
import { seenVersion } from "@/utils/content-loader";

/* On the staging (an OP_LIVE build), OP System asks for a page right after a save with the working copy's version
   (?op-v=<version>, or the header x-op-content-version): what this Worker kept from before it is dropped, so the page
   shows the save at once. Anywhere else this does nothing. */
declare const __OP_LIVE__: boolean;

export const onRequest = defineMiddleware((context, next) => {
  if (__OP_LIVE__ && !context.isPrerendered) {
    const v = Number(context.url.searchParams.get("op-v") || context.request.headers.get("x-op-content-version"));
    if (v > 0) seenVersion(v);
  }
  return next();
});
