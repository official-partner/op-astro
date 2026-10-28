import { defineLiveCollection } from "astro:content";
import { z } from "astro/zod";
import { collections as files } from "./content.config";
import { opContentLoader, PICTURE } from "./utils/content-loader";

/* The staging's live collections (only an OP_LIVE build reads them), made from every collection of
   src/content.config.ts with its own schema: a collection added there is live with nothing written here. Each is
   named « <collection>Live » (Astro refuses one name for both kinds); src/utils/content.ts hides it. A picture is what
   OP's working copy holds: the path the files write, or a picture in OP's storage not committed yet ({ src, width,
   height } or its URL), tagged for src/utils/content.ts to resolve. */

const picture = () =>
  z
    .union([
      z.string(),
      z.object({
        src: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    ])
    .transform((value) => ({ [PICTURE]: value }));

type Schema = z.ZodType<Record<string, unknown>>;
type Definition = {
  schema?: Schema | ((context: { image: typeof picture }) => Schema);
};

const schemaOf = (def: Definition): Schema => {
  const s =
    typeof def.schema === "function"
      ? def.schema({ image: picture })
      : def.schema;
  return s ?? z.record(z.string(), z.unknown());
};

export const collections = Object.fromEntries(
  Object.entries(files as Record<string, Definition>).map(([name, def]) => {
    const schema = schemaOf(def);
    return [
      `${name}Live`,
      defineLiveCollection({ loader: opContentLoader(schema), schema }),
    ];
  }),
);
