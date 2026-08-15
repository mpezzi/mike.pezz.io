import type { OutputBlock, OutputStyle } from "~/shell/types";
import { line, pre, text } from "./builders";
import type { ScreenNode, StyleAttrs } from "./model";

function styleFor(style?: OutputStyle): StyleAttrs | undefined {
  switch (style) {
    case "error":
      return { fg: "error" };
    case "dim":
      return { fg: "dim" };
    case "accent":
      return { fg: "accent" };
    case "heading":
      return { fg: "accent", bold: true };
    default:
      return undefined;
  }
}

/** Convert shell command output to ScreenNodes for the canvas renderer. */
export function outputToScreen(blocks: OutputBlock[], keyPrefix: string): ScreenNode[] {
  const nodes: ScreenNode[] = [];
  for (const [i, block] of blocks.entries()) {
    switch (block.type) {
      case "text":
        nodes.push(line(text(block.text || " ", styleFor(block.style))));
        break;
      case "pre":
        nodes.push(pre(block.lines, styleFor(block.style)));
        break;
      case "link":
        nodes.push(
          line({
            kind: "link",
            text: block.label,
            id: `${keyPrefix}-link-${i}`,
            action: { navigate: block.to },
          }),
        );
        break;
      case "table": {
        // Column widths from the longest cell per column.
        const widths: number[] = [];
        for (const row of block.rows) {
          row.forEach((cell, c) => {
            widths[c] = Math.max(widths[c] ?? 0, cell.text.length);
          });
        }
        for (const [r, row] of block.rows.entries()) {
          nodes.push({
            kind: "line",
            children: row.map((cell, c) => {
              const padded = cell.text.padEnd((widths[c] ?? 0) + 2);
              if (cell.to !== undefined) {
                return {
                  kind: "link" as const,
                  text: padded,
                  id: `${keyPrefix}-cell-${i}-${r}-${c}`,
                  action: { navigate: cell.to },
                };
              }
              return text(padded, styleFor(cell.style));
            }),
          });
        }
        break;
      }
      case "banner":
        nodes.push(
          pre(
            [
              "┌───────────────────┐",
              "│   p e z z O S     │   user: mike@pezz.io",
              "│   ───────────     │   os:   pezzOS 1.0 (web)",
              "│   v1.0 (web)      │   cpu:  1x rubber duck",
              "└───────────────────┘",
            ],
            { fg: "accent" },
          ),
        );
        break;
    }
  }
  return nodes;
}
