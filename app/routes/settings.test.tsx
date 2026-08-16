import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { EFFECT_PARAM_NAMES } from "~/effects/params";
import { CRT_STORAGE_KEY } from "~/effects/settings-store";
import { Prompt } from "~/components/terminal/Prompt";
import { renderWithApp } from "~/test/utils";
import Settings from "./settings";

// Green phosphor (the default theme) sets curvature to 0.45.
const CURVATURE_DEFAULT = 0.45;

function sliderFor(name: string): HTMLInputElement {
  const el: unknown = screen.getByLabelText(new RegExp(name));
  if (!(el instanceof HTMLInputElement)) throw new Error(`no slider for ${name}`);
  return el;
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("Settings keyboard control", () => {
  it("l / ArrowRight increase and h / ArrowLeft decrease the selected param", async () => {
    const user = userEvent.setup();
    renderWithApp(<Settings />, { path: "/settings" });
    const first = EFFECT_PARAM_NAMES[0]!; // curvature, selected by default

    await user.keyboard("l");
    expect(sliderFor(first).value).toBe(String(CURVATURE_DEFAULT + 0.05));
    await user.keyboard("{ArrowRight}");
    expect(sliderFor(first).value).toBe(String(CURVATURE_DEFAULT + 0.1));
    await user.keyboard("h");
    await user.keyboard("{ArrowLeft}");
    expect(sliderFor(first).value).toBe(String(CURVATURE_DEFAULT));
  });

  it("shift steps by 0.1", async () => {
    const user = userEvent.setup();
    renderWithApp(<Settings />, { path: "/settings" });
    await user.keyboard("{Shift>}l{/Shift}");
    expect(sliderFor(EFFECT_PARAM_NAMES[0]!).value).toBe(
      String(CURVATURE_DEFAULT + 0.1),
    );
  });

  it("j/k and arrows move the selection between rows", async () => {
    const user = userEvent.setup();
    renderWithApp(<Settings />, { path: "/settings" });
    const second = EFFECT_PARAM_NAMES[1]!;

    await user.keyboard("j");
    expect(sliderFor(second)).toHaveFocus();
    // Adjusting now targets the second parameter.
    await user.keyboard("l");
    expect(sliderFor(second).value).toBe("0.3"); // aberration default 0.25 + 0.05
    await user.keyboard("k");
    expect(sliderFor(EFFECT_PARAM_NAMES[0]!)).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(sliderFor(second)).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(sliderFor(EFFECT_PARAM_NAMES[0]!)).toHaveFocus();
  });

  it("selection is clamped at both ends", async () => {
    const user = userEvent.setup();
    renderWithApp(<Settings />, { path: "/settings" });
    await user.keyboard("kkk");
    expect(sliderFor(EFFECT_PARAM_NAMES[0]!)).toHaveFocus();
    for (let i = 0; i < EFFECT_PARAM_NAMES.length + 3; i++) await user.keyboard("j");
    expect(
      sliderFor(EFFECT_PARAM_NAMES[EFFECT_PARAM_NAMES.length - 1]!),
    ).toHaveFocus();
  });

  it("clicking a slider selects its row for h/l", async () => {
    const user = userEvent.setup();
    renderWithApp(<Settings />, { path: "/settings" });
    const glow = sliderFor("glow");
    await user.click(glow);
    await user.keyboard("l");
    expect(glow.value).toBe("0.75"); // green-phosphor glow default 0.7 + 0.05
  });

  it("persists adjustments to the settings store", async () => {
    const user = userEvent.setup();
    renderWithApp(<Settings />, { path: "/settings" });
    await user.keyboard("l");
    const stored = JSON.parse(
      window.localStorage.getItem(CRT_STORAGE_KEY) ?? "{}",
    ) as { overrides?: Record<string, number> };
    expect(stored.overrides?.[EFFECT_PARAM_NAMES[0]!]).toBeCloseTo(
      CURVATURE_DEFAULT + 0.05,
    );
  });

  it("does not hijack typing in the shell prompt", async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Settings />
        <Prompt />
      </>,
      { path: "/settings" },
    );
    const prompt = screen.getByLabelText(/shell command input/i);
    await user.click(prompt);
    await user.type(prompt, "hjkl");
    expect(prompt).toHaveValue("hjkl");
    // No param changed while typing.
    expect(sliderFor(EFFECT_PARAM_NAMES[0]!).value).toBe(String(CURVATURE_DEFAULT));
  });
});
