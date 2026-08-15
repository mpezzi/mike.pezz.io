import { useMemo } from "react";
import { DomScreen } from "~/components/terminal/DomScreen";
import { blogEntries } from "~/content/collections";
import { buildMeta } from "~/lib/seo";
import { useRegisterModel } from "~/screen/context";
import { indexModel } from "~/screen/pages";

export function meta() {
  return buildMeta({
    title: "blog",
    description: "Writing about software: TypeScript, React, graphics, and tooling.",
    path: "/blog",
  });
}

export default function BlogIndex() {
  const model = useMemo(
    () => indexModel("blog", "blog", "writing about software", blogEntries),
    [],
  );
  useRegisterModel(model);
  return <DomScreen nodes={model.nodes} />;
}
