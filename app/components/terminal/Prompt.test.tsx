import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useShell } from "~/hooks/useShell";
import { renderWithApp } from "~/test/utils";
import { OutputBlocks } from "./OutputBlocks";
import { Prompt } from "./Prompt";

function PromptHarness() {
  const shell = useShell();
  return (
    <div>
      <div data-testid="cwd">{shell.cwd}</div>
      <div data-testid="scrollback">
        {shell.lines.map((entry) => (
          <div key={entry.id}>
            <span>{entry.input}</span>
            <OutputBlocks blocks={entry.output} />
          </div>
        ))}
      </div>
      <Prompt />
    </div>
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("Prompt", () => {
  it("runs a command on Enter and shows its output", async () => {
    const user = userEvent.setup();
    renderWithApp(<PromptHarness />);
    const input = screen.getByLabelText(/shell command input/i);
    await user.type(input, "whoami{Enter}");
    expect(screen.getByTestId("scrollback")).toHaveTextContent("mike");
    expect(input).toHaveValue("");
  });

  it("recalls history with arrow keys", async () => {
    const user = userEvent.setup();
    renderWithApp(<PromptHarness />);
    const input = screen.getByLabelText(/shell command input/i);
    await user.type(input, "pwd{Enter}");
    await user.type(input, "whoami{Enter}");
    await user.type(input, "{ArrowUp}");
    expect(input).toHaveValue("whoami");
    await user.type(input, "{ArrowUp}");
    expect(input).toHaveValue("pwd");
    await user.type(input, "{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("");
  });

  it("completes with Tab", async () => {
    const user = userEvent.setup();
    renderWithApp(<PromptHarness />);
    const input = screen.getByLabelText(/shell command input/i);
    await user.type(input, "pw{Tab}");
    expect(input).toHaveValue("pwd ");
  });

  it("shows candidates on ambiguous Tab", async () => {
    const user = userEvent.setup();
    renderWithApp(<PromptHarness />);
    const input = screen.getByLabelText(/shell command input/i);
    await user.type(input, "c{Tab}");
    expect(screen.getByText(/cat\s+cd/)).toBeInTheDocument();
  });

  it("cancels the line with Ctrl+C", async () => {
    const user = userEvent.setup();
    renderWithApp(<PromptHarness />);
    const input = screen.getByLabelText(/shell command input/i);
    await user.type(input, "garbage{Control>}c{/Control}");
    expect(input).toHaveValue("");
  });

  it("cd updates the cwd shown in the prompt", async () => {
    const user = userEvent.setup();
    renderWithApp(<PromptHarness />);
    const input = screen.getByLabelText(/shell command input/i);
    await user.type(input, "cd blog{Enter}");
    expect(screen.getByTestId("cwd")).toHaveTextContent("~/blog");
  });
});
