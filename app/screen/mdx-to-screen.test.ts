import { describe, expect, it } from "vitest";
import { mdxToScreen } from "./mdx-to-screen";
import type { ScreenNode } from "./model";

function find(nodes: ScreenNode[], kind: ScreenNode["kind"]): ScreenNode[] {
  return nodes.filter((n) => n.kind === kind);
}

describe("mdxToScreen", () => {
  it("converts headings, paragraphs, and code fences", () => {
    const nodes = mdxToScreen("# Title\n\nsome text\n\n```ts\nconst x = 1;\n```\n");
    const headings = find(nodes, "heading");
    expect(headings[0]).toMatchObject({ kind: "heading", level: 1, text: "Title" });
    const pres = find(nodes, "pre");
    expect(pres[0]).toMatchObject({ lines: ["const x = 1;"] });
  });

  it("clamps deep headings to level 3", () => {
    const nodes = mdxToScreen("##### deep");
    expect(find(nodes, "heading")[0]).toMatchObject({ level: 3 });
  });

  it("converts lists with markers", () => {
    const nodes = mdxToScreen("- alpha\n- beta\n\n1. one\n");
    const lines = find(nodes, "line");
    const texts = lines.map((l) =>
      l.kind === "line"
        ? l.children.map((c) => ("text" in c ? c.text : "")).join("")
        : "",
    );
    expect(texts).toContain("- alpha");
    expect(texts).toContain("1. one");
  });

  it("converts links: internal navigate, external href", () => {
    const nodes = mdxToScreen("[in](/blog) and [out](https://example.com)");
    const linksLine = nodes.find((n) => n.kind === "line");
    if (linksLine?.kind !== "line") throw new Error("expected line");
    const links = linksLine.children.filter((c) => c.kind === "link");
    expect(links[0]).toMatchObject({ action: { navigate: "/blog" } });
    expect(links[1]).toMatchObject({ action: { href: "https://example.com" } });
  });

  it("styles inline code and bold", () => {
    const nodes = mdxToScreen("use `crt` and **loud** text");
    const lineNode = nodes.find((n) => n.kind === "line");
    if (lineNode?.kind !== "line") throw new Error("expected line");
    const code = lineNode.children.find((c) => "text" in c && c.text === "crt");
    expect(code).toMatchObject({ style: { fg: "accent" } });
    const bold = lineNode.children.find((c) => "text" in c && c.text === "loud");
    expect(bold).toMatchObject({ style: { bold: true } });
  });

  it("prefixes blockquotes", () => {
    const nodes = mdxToScreen("> quoted");
    const lineNode = nodes.find((n) => n.kind === "line");
    if (lineNode?.kind !== "line") throw new Error("expected line");
    expect(lineNode.children[0]).toMatchObject({ text: "> " });
  });
});
