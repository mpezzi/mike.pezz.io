import { describe, expect, it } from "vitest";
import { fixtureVfs } from "./test-fixtures";

const vfs = fixtureVfs();

describe("normalize", () => {
  it("resolves relative paths against cwd", () => {
    expect(vfs.normalize("~", "blog")).toBe("~/blog");
    expect(vfs.normalize("~/blog", "hello.md")).toBe("~/blog/hello.md");
  });

  it("handles ., .., and clamps above home", () => {
    expect(vfs.normalize("~/blog", ".")).toBe("~/blog");
    expect(vfs.normalize("~/blog", "..")).toBe("~");
    expect(vfs.normalize("~/blog", "../../..")).toBe("~");
    expect(vfs.normalize("~/blog", "../work")).toBe("~/work");
  });

  it("handles ~ and absolute paths", () => {
    expect(vfs.normalize("~/blog", "~")).toBe("~");
    expect(vfs.normalize("~/blog", "~/work")).toBe("~/work");
    expect(vfs.normalize("~/blog", "/home/mike/work")).toBe("~/work");
    expect(vfs.normalize("~/blog", "/work")).toBe("~/work");
  });

  it("ignores duplicate slashes and empty input", () => {
    expect(vfs.normalize("~", "blog//hello.md")).toBe("~/blog/hello.md");
    expect(vfs.normalize("~/blog", "")).toBe("~");
  });
});

describe("resolve", () => {
  it("finds dirs and files", () => {
    expect(vfs.resolve("~", "blog")?.kind).toBe("dir");
    expect(vfs.resolve("~", "blog/hello.md")?.kind).toBe("file");
    expect(vfs.resolve("~/blog", "hello.md")?.kind).toBe("file");
  });

  it("returns undefined for missing paths and non-dir traversal", () => {
    expect(vfs.resolve("~", "nope")).toBeUndefined();
    expect(vfs.resolve("~", "about.txt/deeper")).toBeUndefined();
  });
});

describe("list", () => {
  it("sorts directories before files, alphabetically", () => {
    const names = vfs.list("~")?.map((n) => n.name);
    expect(names).toEqual(["blog", "work", ".plan", "about.txt"]);
  });

  it("returns undefined for files and missing dirs", () => {
    expect(vfs.list("~", "about.txt")).toBeUndefined();
    expect(vfs.list("~", "missing")).toBeUndefined();
  });
});

describe("url mapping", () => {
  it("round-trips url ↔ path", () => {
    expect(vfs.urlForPath("~/blog")).toBe("/blog");
    expect(vfs.urlForPath("~/blog/hello.md")).toBe("/blog/hello");
    expect(vfs.pathForUrl("/blog")).toBe("~/blog");
    expect(vfs.pathForUrl("/blog/hello")).toBe("~/blog/hello.md");
    expect(vfs.pathForUrl("/")).toBe("~");
  });

  it("returns undefined for unmapped nodes", () => {
    expect(vfs.urlForPath("~/.plan")).toBeUndefined();
    expect(vfs.pathForUrl("/nope")).toBeUndefined();
  });
});
