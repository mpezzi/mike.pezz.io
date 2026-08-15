import { describe, expect, it } from "vitest";
import { COLOR_SLOTS, ScreenBuffer } from "./screen-buffer";

describe("ScreenBuffer", () => {
  it("writes cells and tracks dirty rows", () => {
    const buffer = new ScreenBuffer(10, 4);
    buffer.takeDirtyRows();
    buffer.set(2, 1, "x", COLOR_SLOTS.accent);
    expect(buffer.get(2, 1)).toMatchObject({ char: "x", fg: COLOR_SLOTS.accent });
    expect(buffer.takeDirtyRows()).toEqual([1]);
  });

  it("identical writes do not re-dirty a row", () => {
    const buffer = new ScreenBuffer(10, 4);
    buffer.set(0, 0, "a");
    buffer.takeDirtyRows();
    buffer.set(0, 0, "a");
    expect(buffer.takeDirtyRows()).toEqual([]);
  });

  it("ignores out-of-bounds writes and reads", () => {
    const buffer = new ScreenBuffer(4, 2);
    buffer.takeDirtyRows();
    buffer.set(99, 0, "x");
    buffer.set(0, -1, "x");
    expect(buffer.takeDirtyRows()).toEqual([]);
    expect(buffer.get(99, 0)).toBeUndefined();
  });

  it("writeText advances and returns the next column", () => {
    const buffer = new ScreenBuffer(10, 2);
    const next = buffer.writeText(1, 0, "abc");
    expect(next).toBe(4);
    expect(buffer.get(3, 0)?.char).toBe("c");
  });

  it("clearRow resets cells", () => {
    const buffer = new ScreenBuffer(4, 2);
    buffer.writeText(0, 0, "abcd", COLOR_SLOTS.error);
    buffer.clearRow(0);
    expect(buffer.get(0, 0)).toMatchObject({ char: " ", fg: COLOR_SLOTS.fg });
  });
});
