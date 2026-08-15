import type { Action, ScreenNode, StyleAttrs } from "./model";

export function text(value: string, style?: StyleAttrs): ScreenNode {
  return style ? { kind: "text", text: value, style } : { kind: "text", text: value };
}

export function line(...children: (ScreenNode | string)[]): ScreenNode {
  return {
    kind: "line",
    children: children.map((c) => (typeof c === "string" ? text(c) : c)),
  };
}

export function heading(
  level: 1 | 2 | 3,
  value: string,
  style?: StyleAttrs,
): ScreenNode {
  return style
    ? { kind: "heading", level, text: value, style }
    : { kind: "heading", level, text: value };
}

export function link(
  value: string,
  id: string,
  action: Action,
  style?: StyleAttrs,
): ScreenNode {
  return style
    ? { kind: "link", text: value, id, action, style }
    : { kind: "link", text: value, id, action };
}

export function block(children: ScreenNode[], indent?: number): ScreenNode {
  return indent === undefined
    ? { kind: "block", children }
    : { kind: "block", children, indent };
}

export function pre(lines: string[], style?: StyleAttrs): ScreenNode {
  return style ? { kind: "pre", lines, style } : { kind: "pre", lines };
}

export function list(items: ScreenNode[][]): ScreenNode {
  return { kind: "list", items };
}

export function rule(): ScreenNode {
  return { kind: "rule" };
}

export function blank(): ScreenNode {
  return { kind: "blank" };
}
