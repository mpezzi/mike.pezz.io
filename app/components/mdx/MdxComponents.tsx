import type { AnchorHTMLAttributes } from "react";
import type { MDXComponents } from "mdx/types";
import { Link } from "react-router";

/** Map MDX elements onto terminal-styled equivalents. */
export const mdxComponents: MDXComponents = {
  a: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const url = href ?? "#";
    if (url.startsWith("/")) {
      return <Link to={url}>{children}</Link>;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
};
