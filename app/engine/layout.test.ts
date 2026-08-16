import { describe, expect, it } from "vitest";
import { blank, heading, line, link, list, pre, rule, text } from "~/screen/builders";
import { Layout, measureHeight, slotForPalette } from "./layout";
import { RegionMap } from "./regions";
import { COLOR_SLOTS, ScreenBuffer } from "./screen-buffer";

function rowText(buffer: ScreenBuffer, y: number): string {
  let out = "";
  for (let x = 0; x < buffer.cols; x++) out += buffer.get(x, y)?.char ?? " ";
  return out.trimEnd();
}

describe("slotForPalette", () => {
  it("maps semantic refs and ansi indexes", () => {
    expect(slotForPalette("accent", 0)).toBe(COLOR_SLOTS.accent);
    expect(slotForPalette("ansi3", 0)).toBe(COLOR_SLOTS.ansiBase + 3);
    expect(slotForPalette("ansi99", 7)).toBe(7);
    expect(slotForPalette(undefined, 7)).toBe(7);
  });
});

describe("Layout", () => {
  it("renders lines with a margin", () => {
    const buffer = new ScreenBuffer(20, 5);
    const next = new Layout(buffer, new RegionMap()).render(
      [line(text("hello")), line(text("world"))],
      0,
    );
    expect(next).toBe(2);
    expect(rowText(buffer, 0)).toBe(" hello");
    expect(rowText(buffer, 1)).toBe(" world");
  });

  it("word-wraps at the buffer width", () => {
    const buffer = new ScreenBuffer(12, 6);
    const next = new Layout(buffer, new RegionMap()).render(
      [line(text("aaa bbb ccc ddd"))],
      0,
    );
    expect(next).toBeGreaterThan(1);
    expect(rowText(buffer, 0)).toBe(" aaa bbb");
    expect(rowText(buffer, 1)).toBe(" ccc ddd");
  });

  it("hard-breaks words longer than a line", () => {
    const buffer = new ScreenBuffer(8, 6);
    new Layout(buffer, new RegionMap()).render([line(text("abcdefghijkl"))], 0);
    expect(rowText(buffer, 0)).toBe(" abcdef");
    expect(rowText(buffer, 1)).toBe(" ghijkl");
  });

  it("registers link regions on the written cells", () => {
    const buffer = new ScreenBuffer(30, 4);
    const regions = new RegionMap();
    new Layout(buffer, regions).render(
      [line(link("click me", "id", { navigate: "/blog" }))],
      0,
    );
    const cell = buffer.get(1, 0);
    expect(cell?.region).not.toBe(0);
    expect(regions.get(cell!.region)).toEqual({ navigate: "/blog" });
  });

  it("renders headings, rules, pre, lists, and blanks", () => {
    const buffer = new ScreenBuffer(30, 20);
    const next = new Layout(buffer, new RegionMap()).render(
      [heading(1, "title"), rule(), pre(["  raw"]), list([[text("item")]]), blank()],
      0,
    );
    expect(rowText(buffer, 0)).toBe(" # title");
    expect(rowText(buffer, 1)).toContain("─");
    expect(rowText(buffer, 2)).toBe("   raw");
    expect(rowText(buffer, 3)).toBe("   item");
    expect(next).toBe(5);
  });
});

describe("measureHeight", () => {
  it("matches what render produces", () => {
    const nodes = [line(text("aaa bbb ccc ddd")), blank(), line(text("x"))];
    const height = measureHeight(nodes, 12);
    const buffer = new ScreenBuffer(12, 20);
    const rendered = new Layout(buffer, new RegionMap()).render(nodes, 0);
    expect(height).toBe(rendered);
  });
});
