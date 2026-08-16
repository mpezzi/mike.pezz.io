import { describe, expect, it } from "vitest";
import {
  blogEntries,
  getEntry,
  slugFromPath,
  stripFrontmatter,
  workEntries,
} from "./collections";

describe("content collections", () => {
  it("loads at least one entry per collection", () => {
    expect(blogEntries.length).toBeGreaterThan(0);
    expect(workEntries.length).toBeGreaterThan(0);
  });

  it("every entry has validated frontmatter and derived paths", () => {
    for (const entry of [...blogEntries, ...workEntries]) {
      expect(entry.frontmatter.title.length).toBeGreaterThan(0);
      expect(entry.frontmatter.summary.length).toBeGreaterThan(0);
      expect(entry.frontmatter.date).toBeInstanceOf(Date);
      expect(Number.isNaN(entry.frontmatter.date.getTime())).toBe(false);
      expect(entry.urlPath).toBe(`/${entry.collection}/${entry.slug}`);
      expect(entry.vfsPath).toBe(`~/${entry.collection}/${entry.slug}.md`);
      expect(entry.raw).not.toMatch(/^---/);
      expect(entry.raw.length).toBeGreaterThan(0);
    }
  });

  it("slugs are unique per collection", () => {
    for (const entries of [blogEntries, workEntries]) {
      const slugs = entries.map((e) => e.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("entries are sorted newest first", () => {
    for (const entries of [blogEntries, workEntries]) {
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i - 1]!.frontmatter.date.getTime()).toBeGreaterThanOrEqual(
          entries[i]!.frontmatter.date.getTime(),
        );
      }
    }
  });

  it("getEntry finds by slug", () => {
    const first = blogEntries[0]!;
    expect(getEntry("blog", first.slug)).toBe(first);
    expect(getEntry("blog", "missing")).toBeUndefined();
  });
});

describe("helpers", () => {
  it("slugFromPath strips directory and extension", () => {
    expect(slugFromPath("./blog/hello-world.mdx")).toBe("hello-world");
  });

  it("stripFrontmatter removes the fence", () => {
    expect(stripFrontmatter("---\ntitle: x\n---\n\nbody")).toBe("body");
    expect(stripFrontmatter("no fence")).toBe("no fence");
  });
});
