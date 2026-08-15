import { useMemo } from "react";
import { DomScreen } from "~/components/terminal/DomScreen";
import { buildMeta } from "~/lib/seo";
import { useRegisterModel } from "~/screen/context";
import { contactModel } from "~/screen/pages";

export function meta() {
  return buildMeta({
    title: "contact",
    description: "How to reach Mike Pezzi: email, GitHub, LinkedIn.",
    path: "/contact",
  });
}

export default function Contact() {
  const model = useMemo(() => contactModel(), []);
  useRegisterModel(model);
  return <DomScreen nodes={model.nodes} />;
}
