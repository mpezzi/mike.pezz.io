/**
 * Post-build for GitHub Pages:
 *  - copy the prerendered /404 page to 404.html (Pages serves it for
 *    unknown paths; every real route has its own HTML, so this is a
 *    genuine 404, not an SPA redirect hack)
 *  - emit sitemap.xml from the same slug source the prerender uses
 */
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllSlugs } from "../app/content/slugs";

const SITE_URL = "https://mike.pezz.io";
const OUT = join(import.meta.dirname, "..", "build", "client");

async function main(): Promise<void> {
  await copyFile(join(OUT, "404", "index.html"), join(OUT, "404.html"));

  const { blog, work } = await getAllSlugs();
  const paths = [
    "/",
    "/blog",
    "/work",
    "/contact",
    "/settings",
    ...blog.map((s) => `/blog/${s}`),
    ...work.map((s) => `/work/${s}`),
  ];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
  await writeFile(join(OUT, "sitemap.xml"), sitemap);

  console.log(`postbuild: 404.html + sitemap.xml (${paths.length} urls)`);
}

await main();
