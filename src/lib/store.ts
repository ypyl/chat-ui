import { contentToText } from "@ag-ui/core";
import { useCallback } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";
import type { Message, UserMessage } from "@ag-ui/core";
import { useChatContext } from "./context";

export type { Message };

/**
 * A question and everything the agent said in reply, including its reasoning. This is a rendering
 * grouping only: the store keeps a single AG-UI message list, which is also what gets sent back on
 * the next run.
 */
export type Turn = { user: UserMessage; replies: Message[] };

export function groupTurns(messages: Message[]): Turn[] {
  const turns: Turn[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: message, replies: [] });
    } else {
      turns.at(-1)?.replies.push(message);
    }
  }
  return turns;
}

/**
 * Whether two versions of a message render the same. The AG-UI client re-emits the whole transcript
 * on every event and rebuilds message objects, so reference equality says nothing; ids and content
 * do. This is what keeps memoised bubbles from re-rendering once per streaming token.
 */
export const isSameMessage = (a: Message, b: Message): boolean =>
  a === b || (a.id === b.id && a.role === b.role && a.content === b.content && a.metadata === b.metadata);

const flags = (message: Message) => (message.metadata ?? {}) as { deleted?: boolean; isError?: boolean };

export const isDeleted = (message: Message) => flags(message).deleted === true;
export const isError = (message: Message) => flags(message).isError === true;

/**
 * All reasoning in a turn, in arrival order. A run can emit reasoning on both sides of the answer,
 * so the turn is the right unit to render it as one block.
 */
export const turnReasoning = (turn: Turn): string =>
  turn.replies.flatMap((message) => (message.role === "reasoning" ? [contentToText(message.content)] : [])).join("\n\n");

/** Everything the agent said, with the reasoning split out for separate rendering. */
export const turnAnswers = (turn: Turn): Message[] => turn.replies.filter((message) => message.role !== "reasoning");

/**
 * Hides a turn: the question and every reply it produced, up to the next question. Any message of
 * the turn can identify it, so a bubble can call this without knowing where the turn sits.
 */
export function setTurnDeleted(messages: Message[], messageId: string, deleted: boolean): Message[] {
  const index = messages.findIndex((message) => message.id === messageId);
  if (index < 0) return messages;

  // The id can belong to the question or to any of its replies, so walk back to the question first.
  let start = index;
  while (start > 0 && messages[start].role !== "user") start--;

  const ids = new Set([messages[start].id]);
  for (let i = start + 1; i < messages.length && messages[i].role !== "user"; i++) {
    ids.add(messages[i].id);
  }

  return messages.map((message) =>
    ids.has(message.id) ? ({ ...message, metadata: { ...message.metadata, deleted } } as Message) : message,
  );
}

export interface ChatState {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  input: string;
  setInput: (input: string) => void;
  selectionStart: number | null;
  selectionEnd: number | null;
  setSelectionRange: (start: number | null, end: number | null) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  streamAbortController: AbortController | null;
  setStreamAbortController: (ctrl: AbortController | null) => void;
}

export type ChatStoreApi = StoreApi<ChatState>;

/** A conversation. Created per `<ChatProvider>` so a page can host more than one. */
export function createChatStore(initialMessages: Message[] = []): ChatStoreApi {
  return createStore<ChatState>()((set, get) => ({
    messages: initialMessages,
    setMessages: (messagesOrUpdater) =>
      set((state) => ({
        messages: typeof messagesOrUpdater === "function" ? messagesOrUpdater(state.messages) : messagesOrUpdater,
      })),
    input: "",
    setInput: (input) => set({ input }),
    selectionStart: null,
    selectionEnd: null,
    setSelectionRange: (selectionStart, selectionEnd) => set({ selectionStart, selectionEnd }),
    isStreaming: false,
    setIsStreaming: (streaming) => set({ isStreaming: streaming }),
    streamAbortController: null,
    setStreamAbortController: (ctrl) => {
      // Abort the previous controller before replacing it
      const prev = get().streamAbortController;
      if (prev && prev !== ctrl) {
        prev.abort();
      }
      set({ streamAbortController: ctrl });
    },
  }));
}

export function useChatStore<T>(selector: (state: ChatState) => T): T {
  return useStore(useChatContext().store, selector);
}

export const useChatMessages = () => {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  return { messages, setMessages };
};

export const useChatStreaming = () => {
  const isStreaming = useChatStore((state) => state.isStreaming);
  const setIsStreaming = useChatStore((state) => state.setIsStreaming);
  const streamAbortController = useChatStore((state) => state.streamAbortController);
  const setStreamAbortController = useChatStore((state) => state.setStreamAbortController);
  return { isStreaming, setIsStreaming, streamAbortController, setStreamAbortController };
};

/** Aborts the in-flight turn, if any. */
export const useStopStreaming = () => {
  const store = useChatContext().store;
  return useCallback(() => {
    const { streamAbortController, setIsStreaming, setStreamAbortController } = store.getState();
    streamAbortController?.abort();
    setStreamAbortController(null);
    setIsStreaming(false);
  }, [store]);
};

export const useChatInput = () => {
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const selectionStart = useChatStore((state) => state.selectionStart);
  const selectionEnd = useChatStore((state) => state.selectionEnd);
  const setSelectionRange = useChatStore((state) => state.setSelectionRange);
  return { input, setInput, selectionStart, selectionEnd, setSelectionRange };
};
