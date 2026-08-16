/**
 * The renderer-agnostic content model. Pages and shell output both
 * produce ScreenNodes; DomScreen renders them as semantic JSX and the
 * CRT engine lays them out into a character-cell buffer.
 */

/** Reference into the theme palette (semantic slots or ANSI index). */
export type PaletteRef =
  "fg" | "bg" | "accent" | "link" | "error" | "dim" | `ansi${number}`;

export interface StyleAttrs {
  fg?: PaletteRef;
  bg?: PaletteRef;
  bold?: boolean;
  dim?: boolean;
  inverse?: boolean;
  underline?: boolean;
}

export type Action = { navigate: string } | { run: string } | { href: string };

export type ScreenNode =
  | { kind: "text"; text: string; style?: StyleAttrs }
  | { kind: "line"; children: ScreenNode[] }
  | { kind: "heading"; level: 1 | 2 | 3; text: string; style?: StyleAttrs }
  | { kind: "link"; text: string; id: string; action: Action; style?: StyleAttrs }
  | { kind: "block"; children: ScreenNode[]; indent?: number }
  | { kind: "pre"; lines: string[]; style?: StyleAttrs }
  | { kind: "list"; items: ScreenNode[][] }
  | { kind: "rule" }
  | { kind: "blank" }
  /** Compiled MDX article body, resolved by DomScreen; the canvas layout
   *  renders the markdown-derived fallback nodes instead. */
  | { kind: "article"; collection: "blog" | "work"; slug: string };

export interface ScreenModel {
  title: string;
  nodes: ScreenNode[];
}
