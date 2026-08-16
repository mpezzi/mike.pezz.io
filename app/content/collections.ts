import type { ComponentType } from "react";
import { frontmatterSchema, type Collection, type ContentEntry } from "./schema";

interface MdxModule {
  frontmatter: unknown;
  default: ComponentType<Record<string, unknown>>;
}

const modules: Record<Collection, Record<string, unknown>> = {
  blog: import.meta.glob("./blog/*.mdx", { eager: true }),
  work: import.meta.glob("./work/*.mdx", { eager: true }),
};

const rawSources: Record<Collection, Record<string, unknown>> = {
  blog: import.meta.glob("./blog/*.mdx", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
  work: import.meta.glob("./work/*.mdx", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
};

export function slugFromPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.mdx$/, "");
}

/** Strip the leading YAML frontmatter fence from raw MDX source. */
export function stripFrontmatter(source: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(source);
  return match ? source.slice(match[0].length).replace(/^\s+/, "") : source;
}

function buildCollection(collection: Collection): ContentEntry[] {
  const entries: ContentEntry[] = [];
  for (const [path, mod] of Object.entries(modules[collection])) {
    const { frontmatter, default: Component } = mod as MdxModule;
    const parsed = frontmatterSchema.safeParse(frontmatter);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in ${collection}/${path}: ${parsed.error.message}`,
      );
    }
    if (parsed.data.draft && import.meta.env.PROD) continue;
    const slug = slugFromPath(path);
    const raw = stripFrontmatter(
      (rawSources[collection][path] as string | undefined) ?? "",
    );
    entries.push({
      slug,
      collection,
      frontmatter: parsed.data,
      urlPath: `/${collection}/${slug}`,
      vfsPath: `~/${collection}/${slug}.md`,
      raw,
      Component,
    });
  }
  entries.sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime());
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate ${collection} slug: ${entry.slug}`);
    }
    slugs.add(entry.slug);
  }
  return entries;
}

export const blogEntries: ContentEntry[] = buildCollection("blog");
export const workEntries: ContentEntry[] = buildCollection("work");

export function getEntry(collection: Collection, slug: string): ContentEntry | undefined {
  const entries = collection === "blog" ? blogEntries : workEntries;
  return entries.find((e) => e.slug === slug);
}
