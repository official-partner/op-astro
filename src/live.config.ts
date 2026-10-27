import { defineLiveCollection, type SchemaContext } from "astro:content";
import { z } from "astro/zod";
import { teamSchema } from "./content.config";
import { opContentLoader } from "./utils/content-loader";

/* The staging's live collections (OP_LIVE builds only read them): each one of src/content.config.ts with the same
   schema, a picture being the path or the URL OP's working copy holds (src/utils/content.ts resolves it). Named
   « <collection>Live »: Astro refuses one name for both kinds, and src/utils/content.ts falls back from one to the other. */

const asText = { image: () => z.string() } as unknown as SchemaContext;

export const collections = {
  teamLive: defineLiveCollection({ loader: opContentLoader(), schema: teamSchema(asText) }),
};
