import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Message = { role: "user" | "agent"; text: string; deleted?: boolean; isError?: boolean };

interface MessagesContextValue {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const value = useMemo(() => ({ messages, setMessages }), [messages]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessages must be used within MessagesProvider");
  }
  return context;
}
