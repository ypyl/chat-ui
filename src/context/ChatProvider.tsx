import type { ReactNode } from "react";
import { MessagesProvider, useMessages } from "./MessagesContext";
import { InputProvider, useInput } from "./InputContext";

export { useMessages, type Message } from "./MessagesContext";
export { useInput } from "./InputContext";

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  return (
    <MessagesProvider>
      <InputProvider>{children}</InputProvider>
    </MessagesProvider>
  );
}

export function useChat() {
  return {
    ...useMessages(),
    ...useInput(),
  };
}
