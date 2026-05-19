import { create } from "zustand";

export type Message = { role: "user" | "agent"; text: string; deleted?: boolean; isError?: boolean };

export type Turn = {
  user: Message;
  agent: Message | null;
};

export function turnsToMessages(turns: Turn[]): Message[] {
  return turns.flatMap(turn => [turn.user, turn.agent].filter(Boolean) as Message[]);
}

interface ChatStore {
  turns: Turn[];
  setTurns: (turns: Turn[] | ((prev: Turn[]) => Turn[])) => void;
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
  turns: [],
  setTurns: (turnsOrUpdater) =>
    set((state) => ({
      turns: typeof turnsOrUpdater === "function" ? turnsOrUpdater(state.turns) : turnsOrUpdater,
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
  const turns = useChatStore((state) => state.turns);
  const setTurns = useChatStore((state) => state.setTurns);
  return { turns, setTurns };
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
