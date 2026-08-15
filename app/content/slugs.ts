/**
 * Node-safe slug enumeration for react-router.config.ts prerender().
 * Runs in the config context where import.meta.glob is unavailable,
 * so it reads the content directories directly.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function isDraft(source: string): boolean {
  const fence = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  return fence ? /^draft:\s*true\s*$/m.test(fence[1] ?? "") : false;
}

async function slugsIn(dir: string): Promise<string[]> {
  const files = await readdir(join(here, dir));
  const slugs: string[] = [];
  for (const f of files.filter((f) => f.endsWith(".mdx")).sort()) {
    const source = await readFile(join(here, dir, f), "utf8");
    if (isDraft(source)) continue;
    slugs.push(f.replace(/\.mdx$/, ""));
  }
  return slugs;
}

export async function getAllSlugs(): Promise<{ blog: string[]; work: string[] }> {
  const [blog, work] = await Promise.all([slugsIn("blog"), slugsIn("work")]);
  return { blog, work };
}
