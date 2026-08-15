import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useShell } from "~/hooks/useShell";

export interface PromptHandle {
  focus: () => void;
  insert: (text: string) => void;
}

export const Prompt = forwardRef<PromptHandle>(function Prompt(_props, ref) {
  const shell = useShell();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    insert: (text: string) => {
      setValue((v) => v + text);
      inputRef.current?.focus();
    },
  }));

  const ps1Path = shell.cwd === "~" ? "~" : shell.cwd;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      setCandidates([]);
      shell.run(value);
      setValue("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = shell.historyPrev(value);
      if (prev !== null) setValue(prev);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = shell.historyNext();
      if (next !== null) setValue(next);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const result = shell.complete(value);
      if (result.replacement !== undefined) {
        setValue(result.replacement);
        setCandidates(result.candidates.length > 1 ? result.candidates : []);
      } else {
        setCandidates(result.candidates);
      }
      return;
    }
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setValue("");
      setCandidates([]);
      shell.historyReset();
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      shell.clear();
      return;
    }
    if (e.key === "Escape") {
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div>
      {candidates.length > 1 && (
        <div className="term-dim" aria-hidden="true">
          {candidates.join("  ")}
        </div>
      )}
      <div className="term-promptline">
        <label htmlFor="shell-input" className="term-prompt-ps1">
          mike@pezz.io:{ps1Path}$
        </label>
        <input
          id="shell-input"
          ref={inputRef}
          className="term-prompt-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setCandidates([]);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="shell command input — type help for commands"
          placeholder="type a command — help lists them"
          enterKeyHint="send"
        />
      </div>
    </div>
  );
});
