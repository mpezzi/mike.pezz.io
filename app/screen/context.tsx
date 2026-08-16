import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ScreenModel } from "./model";

interface ScreenModelContextValue {
  model: ScreenModel | null;
  setModel: (model: ScreenModel | null) => void;
}

const ScreenModelContext = createContext<ScreenModelContextValue | null>(null);

export function ScreenModelProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<ScreenModel | null>(null);
  return (
    <ScreenModelContext.Provider value={{ model, setModel }}>
      {children}
    </ScreenModelContext.Provider>
  );
}

/** Routes register their model so the CRT canvas can render it. */
export function useRegisterModel(model: ScreenModel): void {
  const ctx = useContext(ScreenModelContext);
  const setModel = ctx?.setModel;
  useEffect(() => {
    setModel?.(model);
  }, [model, setModel]);
}

export function useCurrentModel(): ScreenModel | null {
  return useContext(ScreenModelContext)?.model ?? null;
}
