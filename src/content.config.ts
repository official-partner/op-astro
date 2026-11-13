import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/* The site's collections, edited in OP System's « Contenu » (which also writes this file when the team adds a
   collection or a field): one file per item in src/content/<collection>/, named by its slug. Names are code
   (English camelCase); each .describe() is the label people see, in the client's language. Every field is optional
   but the name; `visible` hides an item everywhere, `draft` keeps it on the staging only, `order` sorts them
   (src/utils/content.ts). Keep this form: one
   defineCollection per collection, a glob() loader, its z.object(); nothing else goes here (docs/content.md). */

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

export const collections = { team };
