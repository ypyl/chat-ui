import { createContext, useContext } from "react";
import type { StoreApi } from "zustand/vanilla";
import type { ChatState } from "./store";
import type { ChatTransport } from "./transport";

export interface ChatContextValue {
  /** Conversation state for this provider. One store per `<ChatProvider>`, not one per app. */
  store: StoreApi<ChatState>;
  transport: ChatTransport;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("Chat UI components must be rendered inside <ChatProvider>.");
  }
  return context;
}
