import { Link } from "react-router";
import type { OutputBlock, OutputStyle } from "~/shell/types";
import { Banner } from "./Banner";

function styleClass(style?: OutputStyle): string | undefined {
  switch (style) {
    case "error":
      return "term-error";
    case "dim":
      return "term-dim";
    case "accent":
      return "term-accent";
    case "heading":
      return "term-heading";
    default:
      return undefined;
  }
}

export function OutputBlocks({ blocks }: { blocks: OutputBlock[] }) {
  return (
    <div className="term-output">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <div key={i} className={styleClass(block.style)}>
                {block.text || " "}
              </div>
            );
          case "pre":
            return (
              <pre key={i} className={styleClass(block.style)}>
                {block.lines.join("\n")}
              </pre>
            );
          case "link":
            return (
              <div key={i}>
                <Link to={block.to}>{block.label}</Link>
              </div>
            );
          case "table":
            return (
              <table key={i} className="term-output-table">
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} className={styleClass(cell.style)}>
                          {cell.to !== undefined ? (
                            <Link to={cell.to}>{cell.text}</Link>
                          ) : (
                            cell.text
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case "banner":
            return <Banner key={i} />;
        }
      })}
    </div>
  );
}
