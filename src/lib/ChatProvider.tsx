import { useState } from "react";
import type { ReactNode } from "react";
import type { Message } from "@ag-ui/core";
import { ChatContext } from "./context";
import type { ChatContextValue } from "./context";
import { createChatStore } from "./store";
import { createAgUiTransport } from "./transport";
import type { ChatTransport } from "./transport";

export interface ChatProviderProps {
  /**
   * Runs each turn. Defaults to an AG-UI agent at `endpoint`, so a Mantine app pointed at an AG-UI
   * server needs no transport at all.
   */
  transport?: ChatTransport;
  /** AG-UI endpoint used when `transport` is omitted. Ignored once a transport is passed. */
  endpoint?: string;
  /** Thread id for the conversation. Defaults to a fresh one. */
  threadId?: string;
  /** Seed the transcript, e.g. with history loaded from your own backend. */
  initialMessages?: Message[];
  children: ReactNode;
}

/**
 * Owns one conversation: the message list, the streaming flag and the transport. Read once on mount,
 * so pass a stable `transport` (a module-level constant or a `useMemo`) rather than an inline object.
 */
export function ChatProvider({ transport, endpoint = "/agent", threadId, initialMessages, children }: ChatProviderProps) {
  const [value] = useState<ChatContextValue>(() => ({
    store: createChatStore(initialMessages),
    transport: transport ?? createAgUiTransport({ url: endpoint, threadId }),
  }));

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
