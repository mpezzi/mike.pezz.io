import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { Plugin } from "vite";

/**
 * MDX plugin wrapper. It must run with enforce:"pre" (before the React
 * plugins), but at that position it would also swallow `*.mdx?raw`
 * imports — so ids with a query string are left to Vite's core handling.
 */
export function mdxPlugin(): Plugin {
  const plugin = mdx({
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
  }) as Plugin;
  const originalTransform = plugin.transform;
  return {
    ...plugin,
    enforce: "pre",
    transform(code, id, options) {
      if (id.includes("?")) return undefined;
      if (typeof originalTransform === "function") {
        return originalTransform.call(this, code, id, options);
      }
      return originalTransform?.handler.call(this, code, id, options);
    },
  };
}
