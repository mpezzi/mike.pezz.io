import { describe, expect, it } from "vitest";
import { hitTest, type HitTestGeometry } from "./hit-test";

const geo: HitTestGeometry = {
  width: 800,
  height: 600,
  cellWidth: 10,
  cellHeight: 20,
  cols: 80,
  rows: 30,
  curvature: 0,
};

describe("hitTest", () => {
  it("maps pixels to cells with zero curvature", () => {
    expect(hitTest(0, 0, geo)).toEqual({ col: 0, row: 0 });
    expect(hitTest(15, 25, geo)).toEqual({ col: 1, row: 1 });
    expect(hitTest(799, 599, geo)).toEqual({ col: 79, row: 29 });
  });

  it("returns undefined outside the canvas or grid", () => {
    expect(hitTest(-5, 10, { ...geo, curvature: 0 })).toBeUndefined();
    expect(hitTest(10, 10, { ...geo, width: 0 })).toBeUndefined();
  });

  it("center is stable under curvature; corners fall off the tube", () => {
    const curved = { ...geo, curvature: 1 };
    expect(hitTest(400, 300, curved)).toEqual({ col: 40, row: 15 });
    // The extreme corner maps outside the warped face.
    expect(hitTest(1, 1, curved)).toBeUndefined();
  });

  it("curvature shifts off-center hits outward", () => {
    const flat = hitTest(700, 300, geo);
    const curved = hitTest(700, 300, { ...geo, curvature: 1 });
    expect(flat).toBeDefined();
    expect(curved).toBeDefined();
    expect(curved!.col).toBeGreaterThan(flat!.col);
  });
});
