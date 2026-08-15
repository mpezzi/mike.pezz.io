import { useMemo } from "react";
import { useParams } from "react-router";
import { DomScreen } from "~/components/terminal/DomScreen";
import { getEntry } from "~/content/collections";
import { buildMeta } from "~/lib/seo";
import { useRegisterModel } from "~/screen/context";
import { detailModel, notFoundModel } from "~/screen/pages";
import type { Route } from "./+types/work-detail";

export function meta({ params }: Route.MetaArgs) {
  const entry = getEntry("work", params.slug);
  if (!entry) return buildMeta({ title: "404", description: "not found", path: "/404" });
  return buildMeta({
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    path: entry.urlPath,
    type: "article",
    publishedTime: entry.frontmatter.date,
    tags: entry.frontmatter.tags,
  });
}

export default function WorkDetail() {
  const { slug = "" } = useParams();
  const entry = getEntry("work", slug);
  const model = useMemo(
    () => (entry ? detailModel(entry) : notFoundModel(`/work/${slug}`)),
    [entry, slug],
  );
  useRegisterModel(model);
  return <DomScreen nodes={model.nodes} />;
}
