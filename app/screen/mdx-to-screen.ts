import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Content, List, Paragraph, PhrasingContent } from "mdast";
import { blank, heading, pre, rule, text } from "./builders";
import type { ScreenNode } from "./model";

let linkCounter = 0;

function inline(nodes: PhrasingContent[]): ScreenNode[] {
  const out: ScreenNode[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        out.push(text(node.value));
        break;
      case "strong":
        out.push(
          ...inline(node.children).map((n) =>
            n.kind === "text" ? { ...n, style: { ...n.style, bold: true } } : n,
          ),
        );
        break;
      case "emphasis":
        out.push(...inline(node.children));
        break;
      case "inlineCode":
        out.push(text(node.value, { fg: "accent" }));
        break;
      case "link": {
        const label = node.children
          .map((c) => ("value" in c ? String(c.value) : ""))
          .join("");
        const action = node.url.startsWith("/")
          ? { navigate: node.url }
          : { href: node.url };
        out.push({
          kind: "link",
          text: label || node.url,
          id: `md-link-${linkCounter++}`,
          action,
        });
        break;
      }
      case "break":
        out.push(text(" "));
        break;
      default:
        if ("children" in node) {
          out.push(...inline(node.children));
        } else if ("value" in node) {
          out.push(text(String(node.value)));
        }
    }
  }
  return out;
}

function paragraph(node: Paragraph): ScreenNode {
  return { kind: "line", children: inline(node.children) };
}

function listNode(node: List): ScreenNode[] {
  const out: ScreenNode[] = [];
  let index = 1;
  for (const item of node.children) {
    const marker = node.ordered ? `${index}. ` : "- ";
    index += 1;
    for (const [i, child] of item.children.entries()) {
      if (child.type === "paragraph") {
        out.push({
          kind: "line",
          children: [
            text(i === 0 ? marker : " ".repeat(marker.length), { fg: "dim" }),
            ...inline(child.children),
          ],
        });
      } else {
        out.push(...blockNode(child));
      }
    }
  }
  return out;
}

function blockNode(node: Content): ScreenNode[] {
  switch (node.type) {
    case "heading":
      return [
        blank(),
        heading(
          Math.min(node.depth, 3) as 1 | 2 | 3,
          node.children.map((c) => ("value" in c ? String(c.value) : "")).join(""),
        ),
      ];
    case "paragraph":
      return [blank(), paragraph(node)];
    case "code":
      return [blank(), pre(node.value.split("\n"), { fg: "dim" })];
    case "list":
      return [blank(), ...listNode(node)];
    case "thematicBreak":
      return [rule()];
    case "blockquote":
      return node.children.flatMap((child) =>
        blockNode(child).map((n) =>
          n.kind === "line"
            ? { ...n, children: [text("> ", { fg: "dim" }), ...n.children] }
            : n,
        ),
      );
    default:
      return [];
  }
}

/** Convert raw markdown (frontmatter already stripped) to ScreenNodes. */
export function mdxToScreen(markdown: string): ScreenNode[] {
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: gfmFromMarkdown(),
  });
  return tree.children.flatMap((node) => blockNode(node));
}
