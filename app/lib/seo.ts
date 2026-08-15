export const SITE_URL = "https://mike.pezz.io";
export const SITE_NAME = "Mike Pezzi";

export interface MetaInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: Date;
  tags?: string[];
}

export type MetaDescriptor = Record<string, string>;

export function buildMeta(input: MetaInput): MetaDescriptor[] {
  const fullTitle =
    input.path === "/" ? `${SITE_NAME} — Software Engineer` : `${input.title} · ${SITE_NAME}`;
  const url = `${SITE_URL}${input.path}`;
  const meta: MetaDescriptor[] = [
    { title: fullTitle },
    { name: "description", content: input.description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: input.description },
    { tagName: "link", rel: "canonical", href: url },
  ];
  if (input.publishedTime) {
    meta.push({
      property: "article:published_time",
      content: input.publishedTime.toISOString(),
    });
  }
  for (const tag of input.tags ?? []) {
    meta.push({ property: "article:tag", content: tag });
  }
  return meta;
}
