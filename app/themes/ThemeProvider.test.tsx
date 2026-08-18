import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithApp } from "~/test/utils";
import { THEME_STORAGE_KEY } from "./themes";
import { themeNoFlashScript, useTheme } from "./ThemeProvider";

function ThemeHarness() {
  const { theme, preference, setTheme, setAuto, toggleMode } = useTheme();
  return (
    <div>
      <div data-testid="theme-id">{theme.id}</div>
      <div data-testid="preference">{preference}</div>
      <button onClick={() => setTheme("dracula")}>set-dracula</button>
      <button onClick={setAuto}>set-auto</button>
      <button onClick={toggleMode}>toggle</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeProvider", () => {
  it("defaults to amber-phosphor when nothing is stored", () => {
    renderWithApp(<ThemeHarness />);
    expect(screen.getByTestId("preference")).toHaveTextContent("amber-phosphor");
    expect(screen.getByTestId("theme-id")).toHaveTextContent("amber-phosphor");
    expect(document.documentElement.dataset.theme).toBe("amber-phosphor");
    expect(document.documentElement.style.getPropertyValue("--term-bg")).not.toBe("");
  });

  it("an explicit choice overrides auto; set-auto returns to following the system", async () => {
    const user = userEvent.setup();
    renderWithApp(<ThemeHarness />);
    await user.click(screen.getByText("set-dracula"));
    expect(screen.getByTestId("preference")).toHaveTextContent("dracula");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dracula");
    await user.click(screen.getByText("set-auto"));
    expect(screen.getByTestId("preference")).toHaveTextContent("auto");
    expect(screen.getByTestId("theme-id")).toHaveTextContent("solarized-dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto");
  });

  it("persists selection to localStorage and restores it", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithApp(<ThemeHarness />);
    await user.click(screen.getByText("set-dracula"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dracula");
    unmount();
    renderWithApp(<ThemeHarness />);
    expect(screen.getByTestId("theme-id")).toHaveTextContent("dracula");
  });

  it("stored auto follows prefers-color-scheme: light", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "auto");
    const original = window.matchMedia.bind(window);
    const lightStub = (query: string) =>
      ({
        matches: query.includes("light"),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
    window.matchMedia = lightStub;
    try {
      renderWithApp(<ThemeHarness />);
      expect(screen.getByTestId("preference")).toHaveTextContent("auto");
      expect(screen.getByTestId("theme-id")).toHaveTextContent("solarized-light");
    } finally {
      window.matchMedia = original;
    }
  });

  it("toggle switches within a family or to the mode default", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(THEME_STORAGE_KEY, "catppuccin-mocha");
    renderWithApp(<ThemeHarness />);
    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme-id")).toHaveTextContent("catppuccin-latte");
    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme-id")).toHaveTextContent("catppuccin-mocha");
  });
});

describe("themeNoFlashScript", () => {
  it("is self-contained executable JS mentioning every stored key", () => {
    const script = themeNoFlashScript();
    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain("green-phosphor");
    // Must not throw when run in a fresh document.
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      (new Function(script) as () => void)();
    }).not.toThrow();
  });
});
