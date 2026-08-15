import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { TerminalFrame } from "./components/terminal/TerminalFrame";
import { EffectsProvider } from "./hooks/useEffectsMode";
import { ShellProvider } from "./hooks/useShell";
import { ScreenModelProvider } from "./screen/context";
import { themeNoFlashScript } from "./themes/ThemeProvider";
import { ThemeProvider } from "./themes/ThemeProvider";

import globalCss from "./styles/global.css?url";
import terminalCss from "./styles/terminal.css?url";
import cssEffectsCss from "./styles/css-effects.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: globalCss },
  { rel: "stylesheet", href: terminalCss },
  { rel: "stylesheet", href: cssEffectsCss },
  {
    rel: "preload",
    href: "/fonts/jetbrains-mono-400.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript() }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <EffectsProvider>
        <ScreenModelProvider>
          <ShellProvider>
            <TerminalFrame>
              <Outlet />
            </TerminalFrame>
          </ShellProvider>
        </ScreenModelProvider>
      </EffectsProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "psh: segmentation fault";
  let details = "an unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : `error ${error.status}`;
    details =
      error.status === 404
        ? "psh: no such file or directory"
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="term-frame" style={{ justifyContent: "center" }}>
      <h1 className="term-error">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre style={{ overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
      <p>
        <a href="/">cd ~</a>
      </p>
    </main>
  );
}
