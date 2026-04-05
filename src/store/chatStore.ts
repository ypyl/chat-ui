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
}

export const useChatStore = create<ChatStore>((set) => ({
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
}));

export const useMessages = () => {
  const turns = useChatStore((state) => state.turns);
  const setTurns = useChatStore((state) => state.setTurns);
  return { turns, setTurns };
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
