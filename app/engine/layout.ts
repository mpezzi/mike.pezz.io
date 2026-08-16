import type { PaletteRef, ScreenNode, StyleAttrs } from "~/screen/model";
import { RegionMap } from "./regions";
import { ATTR_BOLD, ATTR_UNDERLINE, COLOR_SLOTS, ScreenBuffer } from "./screen-buffer";

export function slotForPalette(ref: PaletteRef | undefined, fallback: number): number {
  if (ref === undefined) return fallback;
  switch (ref) {
    case "fg":
      return COLOR_SLOTS.fg;
    case "bg":
      return COLOR_SLOTS.bg;
    case "accent":
      return COLOR_SLOTS.accent;
    case "link":
      return COLOR_SLOTS.link;
    case "error":
      return COLOR_SLOTS.error;
    case "dim":
      return COLOR_SLOTS.dim;
    default: {
      const index = Number(ref.slice(4));
      return Number.isInteger(index) && index >= 0 && index < 16
        ? COLOR_SLOTS.ansiBase + index
        : fallback;
    }
  }
}

function attrsOf(style?: StyleAttrs): number {
  let attrs = 0;
  if (style?.bold) attrs |= ATTR_BOLD;
  if (style?.underline) attrs |= ATTR_UNDERLINE;
  return attrs;
}

interface Span {
  text: string;
  fg: number;
  attrs: number;
  region: number;
}

/**
 * Lay ScreenNodes out into a buffer starting at row `y`, wrapping at
 * the buffer width (minus margin). Returns the next free row.
 * The buffer must be tall enough; measure() reports the needed height.
 */
export class Layout {
  constructor(
    private buffer: ScreenBuffer,
    private regions: RegionMap,
    private margin = 1,
  ) {}

  private get width(): number {
    return this.buffer.cols - this.margin * 2;
  }

  /** Flow inline spans with word wrap. Returns the next free row. */
  private flowSpans(spans: Span[], y: number, indent: number): number {
    const width = this.width;
    let x = indent;
    let row = y;
    for (const span of spans) {
      const words = span.text.split(/(\s+)/);
      for (const word of words) {
        if (word === "") continue;
        if (x + word.length > width && x > indent && word.trim() !== "") {
          row += 1;
          x = indent;
        }
        // Hard-break words longer than the line.
        let remaining = word;
        while (remaining.length > 0) {
          const space = width - x;
          const chunk = remaining.slice(0, Math.max(1, space));
          if (!(x === indent && chunk.trim() === "")) {
            this.buffer.writeText(
              x + this.margin,
              row,
              chunk,
              span.fg,
              COLOR_SLOTS.bg,
              span.attrs,
              span.region,
            );
            x += chunk.length;
          }
          remaining = remaining.slice(chunk.length);
          if (remaining.length > 0) {
            row += 1;
            x = indent;
          }
        }
      }
    }
    return row + 1;
  }

  private spansOf(nodes: ScreenNode[]): Span[] {
    const spans: Span[] = [];
    for (const node of nodes) {
      if (node.kind === "text") {
        spans.push({
          text: node.text,
          fg: slotForPalette(node.style?.fg, COLOR_SLOTS.fg),
          attrs: attrsOf(node.style),
          region: 0,
        });
      } else if (node.kind === "link") {
        spans.push({
          text: node.text,
          fg: slotForPalette(node.style?.fg, COLOR_SLOTS.link),
          attrs: attrsOf(node.style) | ATTR_UNDERLINE,
          region: this.regions.register(node.action),
        });
      }
    }
    return spans;
  }

  render(nodes: ScreenNode[], startY: number, indent = 0): number {
    let y = startY;
    for (const node of nodes) {
      switch (node.kind) {
        case "text":
        case "link":
          y = this.flowSpans(this.spansOf([node]), y, indent);
          break;
        case "line":
          y = this.flowSpans(this.spansOf(node.children), y, indent);
          break;
        case "heading": {
          const prefix = "#".repeat(node.level) + " ";
          y = this.flowSpans(
            [
              { text: prefix, fg: COLOR_SLOTS.dim, attrs: 0, region: 0 },
              {
                text: node.text,
                fg: COLOR_SLOTS.accent,
                attrs: ATTR_BOLD,
                region: 0,
              },
            ],
            y + (node.level === 1 ? 0 : 1),
            indent,
          );
          break;
        }
        case "block":
          y = this.render(node.children, y, indent + (node.indent ?? 0) * 2);
          break;
        case "pre":
          for (const preLine of node.lines) {
            this.buffer.writeText(
              indent + this.margin,
              y,
              preLine.slice(0, this.width - indent),
              slotForPalette(node.style?.fg, COLOR_SLOTS.fg),
            );
            y += 1;
          }
          break;
        case "list":
          for (const item of node.items) {
            y = this.flowSpans(this.spansOf(item), y, indent + 2);
          }
          break;
        case "rule":
          this.buffer.writeText(this.margin, y, "─".repeat(this.width), COLOR_SLOTS.dim);
          y += 1;
          break;
        case "blank":
          y += 1;
          break;
        case "article":
          // Resolved by the caller (CrtCanvas substitutes markdown nodes).
          break;
      }
    }
    return y;
  }
}

/** Measure how many rows a node list needs at a given width. */
export function measureHeight(nodes: ScreenNode[], cols: number, margin = 1): number {
  const tall = new ScreenBuffer(cols, 4000);
  const layout = new Layout(tall, new RegionMap(), margin);
  return layout.render(nodes, 0);
}
