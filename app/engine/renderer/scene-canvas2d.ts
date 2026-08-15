import type { TerminalTheme } from "~/themes/types";
import type { FontMetrics } from "../font/font-metrics";
import { GlyphAtlas } from "../font/glyph-atlas";
import {
  ATTR_BOLD,
  ATTR_INVERSE,
  ATTR_UNDERLINE,
  COLOR_SLOTS,
  SLOT_COUNT,
  type ScreenBuffer,
} from "../screen-buffer";

export function paletteFromTheme(theme: TerminalTheme): string[] {
  const palette = new Array<string>(SLOT_COUNT);
  palette[COLOR_SLOTS.fg] = theme.colors.foreground;
  palette[COLOR_SLOTS.bg] = theme.colors.background;
  palette[COLOR_SLOTS.accent] = theme.colors.accent;
  palette[COLOR_SLOTS.link] = theme.colors.link;
  palette[COLOR_SLOTS.error] = theme.colors.error;
  palette[COLOR_SLOTS.dim] = theme.colors.dim;
  theme.colors.ansi.forEach((color, i) => {
    palette[COLOR_SLOTS.ansiBase + i] = color;
  });
  return palette;
}

/**
 * Renders dirty buffer rows into an offscreen 2D canvas (the WebGL
 * scene texture source).
 */
export class SceneRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private atlas: GlyphAtlas;
  private palette: string[];

  constructor(
    private metrics: FontMetrics,
    theme: TerminalTheme,
    cols: number,
    rows: number,
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = cols * metrics.cellWidth;
    this.canvas.height = rows * metrics.cellHeight;
    const ctx = this.canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.atlas = new GlyphAtlas(metrics);
    this.palette = paletteFromTheme(theme);
    this.ctx.fillStyle = this.palette[COLOR_SLOTS.bg] ?? "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setTheme(theme: TerminalTheme): void {
    this.palette = paletteFromTheme(theme);
    this.atlas = new GlyphAtlas(this.metrics); // colors changed; rebake lazily
  }

  resize(cols: number, rows: number): void {
    this.canvas.width = cols * this.metrics.cellWidth;
    this.canvas.height = rows * this.metrics.cellHeight;
    this.ctx.fillStyle = this.palette[COLOR_SLOTS.bg] ?? "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  color(slot: number): string {
    return this.palette[slot] ?? this.palette[COLOR_SLOTS.fg] ?? "#fff";
  }

  /** Redraw the given rows from the buffer. Returns row spans drawn. */
  renderRows(buffer: ScreenBuffer, rows: number[], hoverRegion = 0): void {
    const { cellWidth, cellHeight } = this.metrics;
    for (const y of rows) {
      const py = y * cellHeight;
      for (let x = 0; x < buffer.cols; x++) {
        const cell = buffer.get(x, y);
        if (!cell) continue;
        const inverse =
          (cell.attrs & ATTR_INVERSE) !== 0 ||
          (hoverRegion !== 0 && cell.region === hoverRegion);
        const fgSlot = inverse ? cell.bg : cell.fg;
        const bgSlot = inverse ? cell.fg : cell.bg;
        const px = x * cellWidth;
        this.ctx.fillStyle = this.color(bgSlot);
        this.ctx.fillRect(px, py, cellWidth, cellHeight);
        this.atlas.draw(
          this.ctx,
          cell.char,
          this.color(fgSlot),
          (cell.attrs & ATTR_BOLD) !== 0,
          px,
          py,
        );
        if ((cell.attrs & ATTR_UNDERLINE) !== 0) {
          this.ctx.fillStyle = this.color(fgSlot);
          this.ctx.fillRect(px, py + cellHeight - 2, cellWidth, 1);
        }
      }
    }
  }
}
