import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/* The site's collections, edited in OP System's « Contenu » (which also writes this file when the team adds a
   collection or a field): one file per item in src/content/<collection>/, named by its slug. Names are code
   (English camelCase); each .describe() is the label people see, in the client's language. Every field is optional
   but the name; `visible` hides an item everywhere, `draft` keeps it on the staging only, `order` sorts them
   (src/utils/content.ts). Keep this form: one
   defineCollection per collection, a glob() loader, its z.object(); nothing else goes here (docs/content.md). A
   field is never a list of objects, but a page's sections (below). */

const team = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/team" }),
  schema: ({ image }) =>
    z
      .object({
        name: z.string().describe("Nom"),
        role: z.string().optional().describe("Rôle"),
        bio: z.string().optional().describe("Présentation"),
        photo: image().optional().describe("Photo"),
        specialties: z.array(z.string()).optional().describe("Spécialités"),
        visible: z.boolean().default(true).describe("Visible sur le site"),
        draft: z.boolean().default(false).describe("Brouillon"),
        order: z.number().optional().describe("Ordre"),
      })
      .describe("Équipe"),
});

/* A page built in sections (docs/content.md, Sections): the one list of objects a collection may hold. Each section
   is one of the kinds below, told by its `type`; each kind is a component of the site (src/components/content/
   Sections.astro). A kind is a z.object with its `type` as a z.literal, an `id` (a slug, its own in the item), `name`
   (for the team, never on the site) and `hidden`, then its own fields, of the kinds Contenu edits; its .describe() is
   the kind's name where people pick it. */
const notes = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/notes" }),
  schema: z
    .object({
      title: z.string().describe("Titre"),
      sections: z
        .array(
          z.discriminatedUnion("type", [
            z
              .object({
                type: z.literal("text"),
                id: z.string(),
                name: z.string().optional().describe("Nom"),
                hidden: z.boolean().optional().describe("Cachée"),
                text: z.string().describe("Texte"),
              })
              .describe("Texte"),
            z
              .object({
                type: z.literal("quote"),
                id: z.string(),
                name: z.string().optional().describe("Nom"),
                hidden: z.boolean().optional().describe("Cachée"),
                quote: z.string().describe("Citation"),
                by: z.string().optional().describe("De"),
              })
              .describe("Citation"),
          ]),
        )
        .optional()
        .describe("Sections"),
      visible: z.boolean().default(true).describe("Visible sur le site"),
      draft: z.boolean().default(false).describe("Brouillon"),
      order: z.number().optional().describe("Ordre"),
    })
    .describe("Notes"),
});

export const collections = { team, notes };
