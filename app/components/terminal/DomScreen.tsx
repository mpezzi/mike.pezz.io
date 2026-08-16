import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { MDXProvider } from "@mdx-js/react";
import { getEntry } from "~/content/collections";
import type { PaletteRef, ScreenNode, StyleAttrs } from "~/screen/model";
import { mdxComponents } from "../mdx/MdxComponents";

function paletteClass(ref: PaletteRef | undefined): string | undefined {
  switch (ref) {
    case "accent":
      return "term-accent";
    case "dim":
      return "term-dim";
    case "error":
      return "term-error";
    case "link":
      return "term-link";
    default:
      return undefined;
  }
}

function styleProps(style?: StyleAttrs): {
  className?: string;
  style?: React.CSSProperties;
} {
  if (!style) return {};
  const classes = [paletteClass(style.fg), style.dim ? "term-dim" : undefined]
    .filter(Boolean)
    .join(" ");
  const css: React.CSSProperties = {};
  if (style.bold) css.fontWeight = 700;
  if (style.underline) css.textDecoration = "underline";
  const result: { className?: string; style?: React.CSSProperties } = {};
  if (classes) result.className = classes;
  if (Object.keys(css).length > 0) result.style = css;
  return result;
}

function renderNode(node: ScreenNode, key: number): ReactNode {
  switch (node.kind) {
    case "text":
      return (
        <span key={key} {...styleProps(node.style)}>
          {node.text}
        </span>
      );
    case "line":
      return <div key={key}>{node.children.map((child, i) => renderNode(child, i))}</div>;
    case "heading": {
      const Tag = node.level === 1 ? "h1" : node.level === 2 ? "h2" : "h3";
      return <Tag key={key}>{node.text}</Tag>;
    }
    case "link": {
      const action = node.action;
      if ("navigate" in action) {
        return (
          <Link key={key} to={action.navigate} {...styleProps(node.style)}>
            {node.text}
          </Link>
        );
      }
      if ("href" in action) {
        return (
          <a
            key={key}
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            {...styleProps(node.style)}
          >
            {node.text}
          </a>
        );
      }
      return (
        <span key={key} {...styleProps(node.style)}>
          {node.text}
        </span>
      );
    }
    case "block":
      return (
        <div key={key} style={{ paddingLeft: `${(node.indent ?? 0) * 2}ch` }}>
          {node.children.map((child, i) => renderNode(child, i))}
        </div>
      );
    case "pre":
      return (
        <pre key={key} {...styleProps(node.style)}>
          {node.lines.join("\n")}
        </pre>
      );
    case "list":
      return (
        <ul key={key} className="term-menu">
          {node.items.map((item, i) => (
            <li key={i}>
              {item.map((child, j) => (
                <Fragment key={j}>{renderNode(child, j)}</Fragment>
              ))}
            </li>
          ))}
        </ul>
      );
    case "rule":
      return <hr key={key} />;
    case "blank":
      return <div key={key}>&nbsp;</div>;
    case "article": {
      const entry = getEntry(node.collection, node.slug);
      if (!entry) return null;
      const Article = entry.Component;
      return (
        <article key={key}>
          <MDXProvider components={mdxComponents}>
            <Article />
          </MDXProvider>
        </article>
      );
    }
  }
}

export function DomScreen({ nodes }: { nodes: ScreenNode[] }) {
  return <>{nodes.map((node, i) => renderNode(node, i))}</>;
}
