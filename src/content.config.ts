import { defineCollection, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/* The site's collections, edited in OP System's « Contenu » panel: one file per item in src/content/<collection>/,
   named by its slug. Field names are code; each .describe() is the label the panel shows. Each schema is exported:
   on the staging (OP_LIVE) src/live.config.ts validates OP's working copy with it. */

export const teamSchema = ({ image }: SchemaContext) =>
  z
    .object({
      name: z.string().describe("Nom"),
      role: z.string().describe("Rôle"),
      photo: image().optional().describe("Photo"),
      order: z.number().describe("Ordre"),
    })
    .describe("Équipe");

const team = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/team" }),
  schema: teamSchema,
});

export const collections = { team };
