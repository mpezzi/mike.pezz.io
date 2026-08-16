import { createVfs, dir, file, type Vfs } from "~/shell/vfs";
import type { ContentEntry } from "./schema";

export const ABOUT_TXT = `Mike Pezzi — Software Engineer

I build software for the web: TypeScript, React, and the occasional
descent into shaders and systems. By day I ship product at Reactiv;
by night I over-engineer personal tooling like this website.

This site is a terminal. ls around, cat things, break nothing.
`;

export const CONTACT_TXT = `# contact
email:    mike@pezz.io
github:   https://github.com/mpezzi
linkedin: https://www.linkedin.com/in/mikepezzi
web:      https://mike.pezz.io
source:   https://github.com/mpezzi/mike.pezz.io
`;

export const PLAN_TXT = `1. build terminal website
2. pretend it was quick
3. ship
`;

function entryFile(entry: ContentEntry) {
  return file(`${entry.slug}.md`, () => entry.raw, {
    meta: {
      title: entry.frontmatter.title,
      date: entry.frontmatter.date,
      tags: entry.frontmatter.tags,
    },
    urlPath: entry.urlPath,
  });
}

export function buildSiteVfs(blog: ContentEntry[], work: ContentEntry[]): Vfs {
  const root = dir(
    "~",
    [
      dir("blog", blog.map(entryFile), "/blog"),
      dir("work", work.map(entryFile), "/work"),
      dir("settings", [], "/settings"),
      file("about.txt", ABOUT_TXT, { urlPath: "/" }),
      file("contact.txt", CONTACT_TXT, { urlPath: "/contact" }),
      file(".plan", PLAN_TXT),
    ],
    "/",
  );
  return createVfs(root);
}
