/**
 * Character-cell screen buffer. Colors are palette slot indexes
 * (see COLOR_SLOTS); attrs is a bitfield; region ids map cells to
 * interactive actions via RegionMap.
 */

export const COLOR_SLOTS = {
  fg: 0,
  bg: 1,
  accent: 2,
  link: 3,
  error: 4,
  dim: 5,
  ansiBase: 6, // ansi0 = 6 ... ansi15 = 21
} as const;

export const SLOT_COUNT = 22;

export const ATTR_BOLD = 1;
export const ATTR_DIM = 2;
export const ATTR_INVERSE = 4;
export const ATTR_UNDERLINE = 8;

export interface Cell {
  char: string;
  fg: number;
  bg: number;
  attrs: number;
  region: number;
}

export class ScreenBuffer {
  cols: number;
  rows: number;
  chars: string[];
  fg: Uint8Array;
  bg: Uint8Array;
  attrs: Uint8Array;
  region: Uint16Array;
  dirtyRows = new Set<number>();

  constructor(cols: number, rows: number) {
    this.cols = Math.max(1, cols);
    this.rows = Math.max(1, rows);
    const size = this.cols * this.rows;
    this.chars = new Array<string>(size).fill(" ");
    this.fg = new Uint8Array(size).fill(COLOR_SLOTS.fg);
    this.bg = new Uint8Array(size).fill(COLOR_SLOTS.bg);
    this.attrs = new Uint8Array(size);
    this.region = new Uint16Array(size);
  }

  index(x: number, y: number): number {
    return y * this.cols + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  set(
    x: number,
    y: number,
    char: string,
    fg: number = COLOR_SLOTS.fg,
    bg: number = COLOR_SLOTS.bg,
    attrs = 0,
    region = 0,
  ): void {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    if (
      this.chars[i] === char &&
      this.fg[i] === fg &&
      this.bg[i] === bg &&
      this.attrs[i] === attrs &&
      this.region[i] === region
    ) {
      return;
    }
    this.chars[i] = char;
    this.fg[i] = fg;
    this.bg[i] = bg;
    this.attrs[i] = attrs;
    this.region[i] = region;
    this.dirtyRows.add(y);
  }

  writeText(
    x: number,
    y: number,
    value: string,
    fg: number = COLOR_SLOTS.fg,
    bg: number = COLOR_SLOTS.bg,
    attrs = 0,
    region = 0,
  ): number {
    let cx = x;
    for (const char of value) {
      this.set(cx, y, char, fg, bg, attrs, region);
      cx += 1;
    }
    return cx;
  }

  get(x: number, y: number): Cell | undefined {
    if (!this.inBounds(x, y)) return undefined;
    const i = this.index(x, y);
    return {
      char: this.chars[i] ?? " ",
      fg: this.fg[i] ?? 0,
      bg: this.bg[i] ?? 1,
      attrs: this.attrs[i] ?? 0,
      region: this.region[i] ?? 0,
    };
  }

  clearRow(y: number): void {
    for (let x = 0; x < this.cols; x++) {
      this.set(x, y, " ", COLOR_SLOTS.fg, COLOR_SLOTS.bg, 0, 0);
    }
  }

  clear(): void {
    for (let y = 0; y < this.rows; y++) this.clearRow(y);
  }

  markAllDirty(): void {
    for (let y = 0; y < this.rows; y++) this.dirtyRows.add(y);
  }

  takeDirtyRows(): number[] {
    const rows = [...this.dirtyRows].sort((a, b) => a - b);
    this.dirtyRows.clear();
    return rows;
  }
}
