import { createContext, useContext, useState, type ReactNode } from "react";

export type Message = { role: "user" | "agent"; text: string; deleted?: boolean; isError?: boolean };

interface ChatContextValue {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  input: string;
  setInput: (input: string) => void;
  cursorPos: number | null;
  setCursorPos: (pos: number | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  return (
    <ChatContext.Provider value={{ messages, setMessages, input, setInput, cursorPos, setCursorPos }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
