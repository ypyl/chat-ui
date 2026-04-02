import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface InputContextValue {
  input: string;
  setInput: (input: string) => void;
  cursorPos: number | null;
  setCursorPos: (pos: number | null) => void;
}

const InputContext = createContext<InputContextValue | null>(null);

export function InputProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  const value = useMemo(() => ({ input, setInput, cursorPos, setCursorPos }), [input, cursorPos]);

  return <InputContext.Provider value={value}>{children}</InputContext.Provider>;
}

export function useInput() {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error("useInput must be used within InputProvider");
  }
  return context;
}
