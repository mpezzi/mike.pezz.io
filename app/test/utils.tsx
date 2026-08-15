import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { createRoutesStub } from "react-router";
import { EffectsProvider } from "~/hooks/useEffectsMode";
import { ShellProvider } from "~/hooks/useShell";
import { ScreenModelProvider } from "~/screen/context";
import { ThemeProvider } from "~/themes/ThemeProvider";

/** Render UI inside the full provider stack with a stub router. */
export function renderWithApp(ui: ReactNode, { path = "/" } = {}) {
  function Screen() {
    return (
      <ThemeProvider>
        <EffectsProvider>
          <ScreenModelProvider>
            <ShellProvider>{ui}</ShellProvider>
          </ScreenModelProvider>
        </EffectsProvider>
      </ThemeProvider>
    );
  }
  const Stub = createRoutesStub([
    { path: "/", Component: Screen },
    { path: "/blog", Component: Screen },
    { path: "/blog/:slug", Component: Screen },
    { path: "/work", Component: Screen },
    { path: "/work/:slug", Component: Screen },
    { path: "/contact", Component: Screen },
    { path: "/settings", Component: Screen },
    { path: "*", Component: Screen },
  ]);
  return render(<Stub initialEntries={[path]} />);
}
