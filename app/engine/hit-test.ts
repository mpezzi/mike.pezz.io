import { forwardWarp } from "~/effects/params";

export interface HitTestGeometry {
  /** Canvas CSS size in pixels. */
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  cols: number;
  rows: number;
  curvature: number;
}

export interface CellHit {
  col: number;
  row: number;
}

/**
 * Map a pointer position (CSS px, canvas-relative) to a cell coordinate.
 * The composite shader displays scene texel forwardWarp(screenUv) at each
 * screen pixel, so pointer → content uses the same forward warp (the
 * inverse maps content → screen and is kept for overlay positioning).
 */
export function hitTest(x: number, y: number, geo: HitTestGeometry): CellHit | undefined {
  if (geo.width <= 0 || geo.height <= 0) return undefined;
  const [u, v] = forwardWarp(x / geo.width, y / geo.height, geo.curvature);
  if (u < 0 || u > 1 || v < 0 || v > 1) return undefined;
  const col = Math.floor((u * geo.width) / geo.cellWidth);
  const row = Math.floor((v * geo.height) / geo.cellHeight);
  if (col < 0 || col >= geo.cols || row < 0 || row >= geo.rows) return undefined;
  return { col, row };
}
