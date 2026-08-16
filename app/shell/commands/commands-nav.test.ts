import { describe, expect, it } from "vitest";
import { execute } from "../execute";
import { createRegistry } from "../registry";
import { fixtureEnv, fixtureVfs } from "../test-fixtures";
import type { ShellEnv } from "../types";

const vfs = fixtureVfs();
const registry = createRegistry();

function run(input: string, env: ShellEnv = fixtureEnv()) {
  return execute(input, vfs, env, registry);
}

describe("execute", () => {
  it("reports unknown commands", () => {
    const result = run("frobnicate");
    expect(result.exitCode).toBe(2);
    expect(result.output[0]).toMatchObject({ style: "error" });
  });

  it("does nothing on empty input", () => {
    expect(run("   ")).toEqual({ output: [], exitCode: 0 });
  });
});

describe("cd", () => {
  it("changes cwd and navigates to the mapped route", () => {
    const result = run("cd blog");
    expect(result.exitCode).toBe(0);
    expect(result.env?.cwd).toBe("~/blog");
    expect(result.effects).toEqual([{ type: "navigate", to: "/blog" }]);
  });

  it("defaults to home", () => {
    const result = run("cd", fixtureEnv({ cwd: "~/blog" }));
    expect(result.env?.cwd).toBe("~");
    expect(result.effects).toEqual([{ type: "navigate", to: "/" }]);
  });

  it("fails on files and missing dirs", () => {
    expect(run("cd about.txt").exitCode).toBe(1);
    expect(run("cd nowhere").exitCode).toBe(1);
  });
});

describe("open", () => {
  it("navigates to a file's page", () => {
    const result = run("open blog/hello.md");
    expect(result.effects).toEqual([{ type: "navigate", to: "/blog/hello" }]);
  });

  it("fails for files without a page and missing args", () => {
    expect(run("open .plan").exitCode).toBe(1);
    expect(run("open").exitCode).toBe(2);
  });
});

describe("ls", () => {
  it("lists the cwd as a table with dirs marked", () => {
    const result = run("ls");
    expect(result.exitCode).toBe(0);
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    const names = table.rows.map((r) => r[r.length - 1]?.text ?? r[0]?.text);
    expect(names).toContain("blog/");
    expect(names).toContain("about.txt");
  });

  it("links entries with pages", () => {
    const result = run("ls blog");
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    expect(table.rows[0]?.[0]?.to).toBe("/blog/hello");
  });

  it("-l adds metadata columns", () => {
    const result = run("ls -l blog");
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    expect(table.rows[0]?.[0]?.text).toBe("-rw-r--r--");
  });

  it("fails on missing paths", () => {
    expect(run("ls missing").exitCode).toBe(1);
  });
});

describe("cat", () => {
  it("prints file contents", () => {
    const result = run("cat about.txt");
    expect(result.output[0]).toEqual({ type: "pre", lines: ["hi, i'm mike"] });
  });

  it("errors on dirs and missing files but keeps going", () => {
    const result = run("cat blog about.txt");
    expect(result.exitCode).toBe(1);
    expect(result.output[0]).toMatchObject({ style: "error" });
    expect(result.output[1]).toMatchObject({ type: "pre" });
  });

  it("requires an operand", () => {
    expect(run("cat").exitCode).toBe(2);
  });
});

describe("cat error branches", () => {
  it("reports missing files with exit 1", () => {
    const result = run("cat ghost.txt");
    expect(result.exitCode).toBe(1);
    expect(result.output[0]).toMatchObject({
      style: "error",
      text: "cat: ghost.txt: no such file or directory",
    });
  });
});

describe("open on a directory", () => {
  it("navigates and updates cwd", () => {
    const result = run("open blog");
    expect(result.env?.cwd).toBe("~/blog");
    expect(result.effects).toEqual([{ type: "navigate", to: "/blog" }]);
  });
});

describe("ls on a single file", () => {
  it("prints just the file name", () => {
    const result = run("ls about.txt");
    expect(result.output[0]).toEqual({ type: "text", text: "about.txt" });
  });
});

describe("pwd", () => {
  it("prints the expanded cwd", () => {
    const result = run("pwd", fixtureEnv({ cwd: "~/blog" }));
    expect(result.output[0]).toMatchObject({ text: "/home/mike/blog" });
  });
});

describe("grep", () => {
  it("finds matches recursively with file:line links", () => {
    const result = run("grep react");
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    expect(table.rows.length).toBe(2);
    expect(table.rows[0]?.[0]?.text).toBe("~/blog/hello.md:2");
    expect(table.rows[0]?.[0]?.to).toBe("/blog/hello");
  });

  it("supports -i and scoped paths", () => {
    const result = run("grep -i REACT blog");
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    expect(table.rows.length).toBe(2);
  });

  it("exits 1 with no matches and 2 on bad usage", () => {
    expect(run("grep zzzz").exitCode).toBe(1);
    expect(run("grep").exitCode).toBe(2);
    expect(run("grep [ blog").exitCode).toBe(2);
  });
});
