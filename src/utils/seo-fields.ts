import { z } from "astro/zod";

/**
 * The SEO fields of a collection whose items have a page of their own (Oct 27, 2026: OP System's « Contenu » shows them
 * under « Pour Google »): spread into its schema, `schema: ({ image }) => z.object({ ...fields, ...seoFields(image) })`.
 * A redo fills them from the current site's CSV columns (read_export part seo names them), word for word; the item's
 * page gives them to its layout: `seoTitle` (the whole title, kept as written), `description={seoDescription}`,
 * `image={ogImage.src}`. Each may stay empty: the page then takes its title and description from its own fields.
 */
export const seoFields = <T extends z.ZodTypeAny>(image: () => T) => ({
  seoTitle: z.string().optional().describe("Titre pour Google"),
  seoDescription: z.string().optional().describe("Description pour Google"),
  ogImage: image().optional().describe("Image de partage"),
});
