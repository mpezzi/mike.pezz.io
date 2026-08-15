declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const frontmatter: unknown;
  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}

declare module "*.glsl?raw" {
  const source: string;
  export default source;
}

declare module "*.mdx?raw" {
  const source: string;
  export default source;
}
