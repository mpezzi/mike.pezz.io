import type { ComponentType } from "react";
import { z } from "zod";

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  summary: z.string().min(1),
  draft: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type Collection = "blog" | "work";

export interface ContentEntry {
  slug: string;
  collection: Collection;
  frontmatter: Frontmatter;
  urlPath: string; // /blog/:slug
  vfsPath: string; // ~/blog/:slug.md
  /** Raw markdown source with frontmatter fences stripped (cat/grep/canvas). */
  raw: string;
  Component: ComponentType<Record<string, unknown>>;
}
