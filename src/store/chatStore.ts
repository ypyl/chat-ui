import { create } from "zustand";
import type { Message, UserMessage } from "@ag-ui/core";

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

const flags = (message: Message) => (message.metadata ?? {}) as { deleted?: boolean; isError?: boolean };

export const isDeleted = (message: Message) => flags(message).deleted === true;
export const isError = (message: Message) => flags(message).isError === true;

interface ChatStore {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  input: string;
  setInput: (input: string) => void;
  selectionStart: number | null;
  selectionEnd: number | null;
  setSelectionRange: (start: number | null, end: number | null) => void;
  selectionEnabled: boolean;
  setSelectionEnabled: (enabled: boolean) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  streamAbortController: AbortController | null;
  setStreamAbortController: (ctrl: AbortController | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  setMessages: (messagesOrUpdater) =>
    set((state) => ({
      messages: typeof messagesOrUpdater === "function" ? messagesOrUpdater(state.messages) : messagesOrUpdater,
    })),
  input: "",
  setInput: (input) => set({ input }),
  selectionStart: null,
  selectionEnd: null,
  setSelectionRange: (selectionStart, selectionEnd) => set({ selectionStart, selectionEnd }),
  selectionEnabled: true,
  setSelectionEnabled: (enabled) => set({ selectionEnabled: enabled }),
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

export const useMessages = () => {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  return { messages, setMessages };
};

export const useStreaming = () => {
  const isStreaming = useChatStore((state) => state.isStreaming);
  const setIsStreaming = useChatStore((state) => state.setIsStreaming);
  const streamAbortController = useChatStore((state) => state.streamAbortController);
  const setStreamAbortController = useChatStore((state) => state.setStreamAbortController);
  return { isStreaming, setIsStreaming, streamAbortController, setStreamAbortController };
};

export const stopStreaming = () => {
  const { streamAbortController, setIsStreaming, setStreamAbortController } = useChatStore.getState();
  streamAbortController?.abort();
  setStreamAbortController(null);
  setIsStreaming(false);
};

export const useInput = () => {
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const selectionStart = useChatStore((state) => state.selectionStart);
  const selectionEnd = useChatStore((state) => state.selectionEnd);
  const setSelectionRange = useChatStore((state) => state.setSelectionRange);
  return { input, setInput, selectionStart, selectionEnd, setSelectionRange };
};

export const useChat = () => useChatStore();

export const useSelectionEnabled = () => {
  const selectionEnabled = useChatStore((state) => state.selectionEnabled);
  const setSelectionEnabled = useChatStore((state) => state.setSelectionEnabled);
  return { selectionEnabled, setSelectionEnabled };
};
