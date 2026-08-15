import { useMemo } from "react";
import { DomScreen } from "~/components/terminal/DomScreen";
import { blogEntries } from "~/content/collections";
import { buildMeta } from "~/lib/seo";
import { useRegisterModel } from "~/screen/context";
import { homeModel } from "~/screen/pages";

export function meta() {
  return buildMeta({
    title: "Mike Pezzi",
    description:
      "Mike Pezzi is a software engineer. This is his website — a terminal, obviously.",
    path: "/",
  });
}

export default function Home() {
  const model = useMemo(() => homeModel(blogEntries.slice(0, 3)), []);
  useRegisterModel(model);
  return <DomScreen nodes={model.nodes} />;
}
