import { useMemo } from "react";
import { useLocation } from "react-router";
import { DomScreen } from "~/components/terminal/DomScreen";
import { buildMeta } from "~/lib/seo";
import { useRegisterModel } from "~/screen/context";
import { notFoundModel } from "~/screen/pages";

export function meta() {
  return buildMeta({
    title: "404",
    description: "No such file or directory.",
    path: "/404",
  });
}

export default function NotFound() {
  const { pathname } = useLocation();
  const model = useMemo(() => notFoundModel(pathname), [pathname]);
  useRegisterModel(model);
  return <DomScreen nodes={model.nodes} />;
}
