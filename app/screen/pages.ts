import type { ContentEntry } from "~/content/schema";
import { REPO_URL } from "~/lib/seo";
import { formatIsoDate } from "~/lib/format";
import { blank, block, heading, line, link, list, pre, rule, text } from "./builders";
import type { ScreenModel, ScreenNode } from "./model";

export function homeModel(latestPosts: ContentEntry[]): ScreenModel {
  const nodes: ScreenNode[] = [
    pre(
      [
        "┌──────────────────────────────────────┐",
        "│                                      │",
        "│   M I K E   P E Z Z I                │",
        "│   ─────────────────────────────      │",
        "│   software engineer                  │",
        "│                                      │",
        "└──────────────────────────────────────┘",
      ],
      { fg: "accent" },
    ),
    heading(1, "Mike Pezzi — Software Engineer"),
    line(text("Welcome to my terminal. I build software for the web — ")),
    line(text("TypeScript, React, and the occasional descent into shaders.")),
    blank(),
    list([
      [
        link("blog/", "nav-blog", { navigate: "/blog" }),
        text("      writing about software", { fg: "dim" }),
      ],
      [
        link("work/", "nav-work", { navigate: "/work" }),
        text("      things I've built", { fg: "dim" }),
      ],
      [
        link("contact.txt", "nav-contact", { navigate: "/contact" }),
        text(" how to reach me", { fg: "dim" }),
      ],
      [
        link("settings/", "nav-settings", { navigate: "/settings" }),
        text("  themes & CRT tuning", { fg: "dim" }),
      ],
    ]),
    rule(),
    heading(2, "recent posts"),
    list(
      latestPosts.map((post) => [
        text(`${formatIsoDate(post.frontmatter.date)}  `, { fg: "dim" }),
        link(post.frontmatter.title, `post-${post.slug}`, { navigate: post.urlPath }),
      ]),
    ),
    blank(),
    line(
      text("hint: type ", { fg: "dim" }),
      text("help", { fg: "accent" }),
      text(" below, or try ", { fg: "dim" }),
      text("theme ls", { fg: "accent" }),
      text(" and ", { fg: "dim" }),
      text("crt set curvature 0.8", { fg: "accent" }),
    ),
    line(
      text("source: ", { fg: "dim" }),
      link("github.com/mpezzi/mike.pezz.io", "repo", { href: REPO_URL }),
    ),
  ];
  return { title: "home", nodes };
}

export function indexModel(
  collection: "blog" | "work",
  title: string,
  intro: string,
  entries: ContentEntry[],
): ScreenModel {
  return {
    title,
    nodes: [
      heading(1, `~/${collection}`),
      line(text(intro, { fg: "dim" })),
      blank(),
      list(
        entries.map((entry) => [
          text(`${formatIsoDate(entry.frontmatter.date)}  `, { fg: "dim" }),
          link(`${entry.slug}.md`, `entry-${entry.slug}`, { navigate: entry.urlPath }),
          text(`  ${entry.frontmatter.summary}`, { fg: "dim" }),
        ]),
      ),
    ],
  };
}

export function detailModel(entry: ContentEntry): ScreenModel {
  return {
    title: entry.frontmatter.title,
    nodes: [
      line(text(`$ cat ~/${entry.collection}/${entry.slug}.md`, { fg: "dim" })),
      heading(1, entry.frontmatter.title),
      line(
        text(
          `${formatIsoDate(entry.frontmatter.date)}  ${entry.frontmatter.tags
            .map((t) => `#${t}`)
            .join(" ")}`,
          { fg: "dim" },
        ),
      ),
      rule(),
      { kind: "article", collection: entry.collection, slug: entry.slug },
      rule(),
      line(
        link("← back", "back", {
          navigate: `/${entry.collection}`,
        }),
      ),
    ],
  };
}

export function contactModel(): ScreenModel {
  return {
    title: "contact",
    nodes: [
      line(text("$ cat ~/contact.txt", { fg: "dim" })),
      heading(1, "contact"),
      block([
        line(
          text("email:    ", { fg: "dim" }),
          link("mike@pezz.io", "email", { href: "mailto:mike@pezz.io" }),
        ),
        line(
          text("github:   ", { fg: "dim" }),
          link("github.com/mpezzi", "github", { href: "https://github.com/mpezzi" }),
        ),
        line(
          text("linkedin: ", { fg: "dim" }),
          link("linkedin.com/in/mpezzi", "linkedin", {
            href: "https://www.linkedin.com/in/mpezzi/",
          }),
        ),
        line(
          text("source:   ", { fg: "dim" }),
          link("github.com/mpezzi/mike.pezz.io", "source", { href: REPO_URL }),
        ),
      ]),
      blank(),
      line(text("PGP available on request. Response time: best effort.", { fg: "dim" })),
    ],
  };
}

export function notFoundModel(pathname: string): ScreenModel {
  return {
    title: "404",
    nodes: [
      line(text(`psh: ${pathname}: no such file or directory`, { fg: "error" })),
      blank(),
      line(text("the page you are looking for does not exist.", { fg: "dim" })),
      blank(),
      line(link("cd ~", "home", { navigate: "/" })),
    ],
  };
}
