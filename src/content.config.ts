import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/* The site's collections, edited in OP System's « Contenu » (which also writes this file when the team adds a
   collection or a field): one file per item in src/content/<collection>/, named by its slug. Names are code
   (English camelCase); each .describe() is the label people see, in the client's language. Every field is optional
   but the name; `visible` hides an item everywhere, `draft` keeps it on the staging only, `order` sorts them
   (src/utils/content.ts). Keep this form: one
   defineCollection per collection, a glob() loader, its z.object(); nothing else goes here (docs/content.md). A
   field is never a list of objects, but a page's sections and rows of small cells (below). */

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
  schema: ({ image }) =>
    z
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
              z
                .object({
                  type: z.literal("visual"),
                  id: z.string(),
                  name: z.string().optional().describe("Nom"),
                  hidden: z.boolean().optional().describe("Cachée"),
                  image: image().optional().describe("Image"),
                  alt: z.string().optional().describe("Texte de remplacement"),
                  caption: z.string().optional().describe("Légende"),
                })
                .describe("Visuel"),
            ]),
          )
          .optional()
          .describe("Sections"),
        // several pictures in an order (docs/content.md): each by its path from the item, as a single picture is
        gallery: z.array(image()).optional().describe("Galerie"),
        // rows of small cells (docs/content.md, Rows): the second list of objects a collection may hold
        credits: z
          .array(z.object({ id: z.string(), role: z.string().describe("Rôle"), name: z.string().describe("Nom") }))
          .optional()
          .describe("Crédits"),
        // a colour picked in Contenu (docs/content.md): the name of one of the system's colour variables
        accent: z.string().optional().describe("Couleur"),
        visible: z.boolean().default(true).describe("Visible sur le site"),
        draft: z.boolean().default(false).describe("Brouillon"),
        order: z.number().optional().describe("Ordre"),
      })
      .describe("Notes"),
});

export const collections = { team, notes };
