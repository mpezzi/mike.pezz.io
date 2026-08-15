import { describe, expect, it } from "vitest";
import { tokenize } from "./parser";

describe("tokenize", () => {
  it("splits on whitespace", () => {
    expect(tokenize("ls -l blog")).toEqual(["ls", "-l", "blog"]);
    expect(tokenize("  cat   a.txt  ")).toEqual(["cat", "a.txt"]);
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });

  it("handles double quotes", () => {
    expect(tokenize('echo "hello world"')).toEqual(["echo", "hello world"]);
    expect(tokenize('grep "two words" blog')).toEqual(["grep", "two words", "blog"]);
  });

  it("handles single quotes", () => {
    expect(tokenize("echo 'a b'")).toEqual(["echo", "a b"]);
    // No escapes inside single quotes.
    expect(tokenize("echo 'a\\b'")).toEqual(["echo", "a\\b"]);
  });

  it("handles backslash escapes", () => {
    expect(tokenize("cat my\\ file.txt")).toEqual(["cat", "my file.txt"]);
    expect(tokenize('echo \\"hi\\"')).toEqual(["echo", '"hi"']);
  });

  it("keeps empty quoted strings as tokens", () => {
    expect(tokenize('echo ""')).toEqual(["echo", ""]);
  });

  it("keeps a trailing dangling backslash literal", () => {
    expect(tokenize("echo a\\")).toEqual(["echo", "a\\"]);
  });
});
