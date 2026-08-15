export interface FontMetrics {
  family: string;
  /** Font size in device pixels. */
  size: number;
  cellWidth: number;
  cellHeight: number;
  /** Baseline offset from the cell top, device pixels. */
  baseline: number;
}

export function measureFont(
  ctx: CanvasRenderingContext2D,
  family: string,
  size: number,
): FontMetrics {
  ctx.font = `${size}px ${family}`;
  const metrics = ctx.measureText("M");
  const cellWidth = Math.ceil(metrics.width);
  const ascent = metrics.fontBoundingBoxAscent || size * 0.8;
  const descent = metrics.fontBoundingBoxDescent || size * 0.25;
  const cellHeight = Math.ceil((ascent + descent) * 1.15);
  const baseline = Math.round(ascent + (cellHeight - ascent - descent) / 2);
  return { family, size, cellWidth, cellHeight, baseline };
}
