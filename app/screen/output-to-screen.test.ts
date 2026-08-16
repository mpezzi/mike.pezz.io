import { describe, expect, it } from "vitest";
import { outputToScreen } from "./output-to-screen";

describe("outputToScreen", () => {
  it("converts text with styles", () => {
    const nodes = outputToScreen([{ type: "text", text: "oops", style: "error" }], "t");
    expect(nodes[0]).toMatchObject({
      kind: "line",
      children: [{ kind: "text", text: "oops", style: { fg: "error" } }],
    });
  });

  it("keeps empty text lines visible", () => {
    const nodes = outputToScreen([{ type: "text", text: "" }], "t");
    expect(nodes[0]).toMatchObject({ children: [{ text: " " }] });
  });

  it("pads table columns and links linked cells", () => {
    const nodes = outputToScreen(
      [
        {
          type: "table",
          rows: [
            [{ text: "a", to: "/a" }, { text: "one" }],
            [{ text: "long" }, { text: "two" }],
          ],
        },
      ],
      "t",
    );
    expect(nodes).toHaveLength(2);
    const first = nodes[0];
    if (first?.kind !== "line") throw new Error("expected line");
    expect(first.children[0]).toMatchObject({
      kind: "link",
      text: "a     ",
      action: { navigate: "/a" },
    });
  });

  it("converts pre and link blocks", () => {
    const nodes = outputToScreen(
      [
        { type: "pre", lines: ["x", "y"] },
        { type: "link", label: "go", to: "/blog" },
      ],
      "t",
    );
    expect(nodes[0]).toMatchObject({ kind: "pre", lines: ["x", "y"] });
    const linkLine = nodes[1];
    if (linkLine?.kind !== "line") throw new Error("expected line");
    expect(linkLine.children[0]).toMatchObject({ action: { navigate: "/blog" } });
  });
});
