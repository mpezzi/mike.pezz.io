import { describe, expect, it } from "vitest";
import { commonPrefix, complete, completePath } from "./completion";
import { createRegistry } from "./registry";
import { fixtureEnv, fixtureVfs } from "./test-fixtures";

const vfs = fixtureVfs();
const env = fixtureEnv();
const registry = createRegistry();

describe("commonPrefix", () => {
  it("finds the longest shared prefix", () => {
    expect(commonPrefix(["catalog", "catch"])).toBe("cat");
    expect(commonPrefix(["one"])).toBe("one");
    expect(commonPrefix([])).toBe("");
    expect(commonPrefix(["a", "b"])).toBe("");
  });
});

describe("completePath", () => {
  it("completes names in the cwd, marking dirs with a slash", () => {
    expect(completePath("bl", vfs, env)).toEqual(["blog/"]);
    expect(completePath("ab", vfs, env)).toEqual(["about.txt"]);
  });

  it("completes within subdirectories", () => {
    expect(completePath("blog/he", vfs, env)).toEqual(["blog/hello.md"]);
  });

  it("respects dirsOnly", () => {
    expect(completePath("a", vfs, env, { dirsOnly: true })).toEqual([]);
    expect(completePath("b", vfs, env, { dirsOnly: true })).toEqual(["blog/"]);
  });
});

describe("complete", () => {
  it("completes command names", () => {
    const result = complete("pw", vfs, env, registry);
    expect(result.replacement).toBe("pwd ");
  });

  it("lists candidates for ambiguous commands", () => {
    const result = complete("c", vfs, env, registry);
    expect(result.replacement).toBeUndefined();
    expect(result.candidates).toContain("cat");
    expect(result.candidates).toContain("cd");
  });

  it("grows to the common prefix when possible", () => {
    // "the" is unambiguous up to "theme"
    const result = complete("th", vfs, env, registry);
    expect(result.replacement).toBe("theme ");
  });

  it("completes arguments via the command's completer", () => {
    const result = complete("cd b", vfs, env, registry);
    expect(result.replacement).toBe("cd blog/");
  });

  it("completes a fresh argument after a trailing space", () => {
    const result = complete("cat blog/", vfs, env, registry);
    expect(result.candidates).toEqual(["blog/hello.md", "blog/second.md"]);
  });

  it("completes theme ids", () => {
    const result = complete("theme gru", vfs, env, registry);
    expect(result.replacement).toBe("theme gruvbox-");
    expect(result.candidates).toEqual(["gruvbox-dark", "gruvbox-light"]);
  });

  it("returns nothing for unknown input", () => {
    expect(complete("zzz", vfs, env, registry).candidates).toEqual([]);
  });
});
