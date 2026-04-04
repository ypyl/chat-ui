import { create } from "zustand";

export type Message = { role: "user" | "agent"; text: string; deleted?: boolean; isError?: boolean };

interface ChatStore {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  input: string;
  setInput: (input: string) => void;
  cursorPos: number | null;
  setCursorPos: (pos: number | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (messagesOrUpdater) =>
    set((state) => ({
      messages: typeof messagesOrUpdater === "function" ? messagesOrUpdater(state.messages) : messagesOrUpdater,
    })),
  input: "",
  setInput: (input) => set({ input }),
  cursorPos: null,
  setCursorPos: (cursorPos) => set({ cursorPos }),
}));

export const useMessages = () => {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  return { messages, setMessages };
};

export const useInput = () => {
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const cursorPos = useChatStore((state) => state.cursorPos);
  const setCursorPos = useChatStore((state) => state.setCursorPos);
  return { input, setInput, cursorPos, setCursorPos };
};

export const useChat = () => useChatStore();
