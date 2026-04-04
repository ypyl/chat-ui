import { create } from "zustand";

export type Message = { role: "user" | "agent"; text: string; deleted?: boolean; isError?: boolean };

interface ChatStore {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  input: string;
  setInput: (input: string) => void;
  selectionStart: number | null;
  selectionEnd: number | null;
  setSelectionRange: (start: number | null, end: number | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
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
}));

export const useMessages = () => {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  return { messages, setMessages };
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
