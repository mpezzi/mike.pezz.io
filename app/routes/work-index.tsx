import { useMemo } from "react";
import { DomScreen } from "~/components/terminal/DomScreen";
import { workEntries } from "~/content/collections";
import { buildMeta } from "~/lib/seo";
import { useRegisterModel } from "~/screen/context";
import { indexModel } from "~/screen/pages";

export function meta() {
  return buildMeta({
    title: "work",
    description: "Things Mike Pezzi has built and worked on.",
    path: "/work",
  });
}

export default function WorkIndex() {
  const model = useMemo(
    () => indexModel("work", "work", "things I've built", workEntries),
    [],
  );
  useRegisterModel(model);
  return <DomScreen nodes={model.nodes} />;
}
