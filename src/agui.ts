import { HttpAgent } from "@ag-ui/client";
import type { Message as AguiMessage } from "@ag-ui/core";
import type { Message } from "./store/chatStore";

export const AGUI_URL = "/agent";

/** One AG-UI thread for the browser session; runs inside it are separate. */
export const THREAD_ID = crypto.randomUUID();

/** The app's own turn model mapped onto protocol messages. */
export function toAguiMessages(messages: Message[]): AguiMessage[] {
  return messages.map((m, i) => ({
    id: `${THREAD_ID}-${i}-${m.role}`,
    role: m.role === "agent" ? "assistant" : "user",
    content: m.text,
  }));
}

interface RunHandlers {
  messages: Message[];
  abortController: AbortController;
  /** Accumulated answer text so far. */
  onText: (text: string) => void;
  /** Accumulated reasoning text so far. */
  onReasoning: (text: string) => void;
}

/**
 * Runs one turn against the AG-UI endpoint and reports accumulated text as it streams.
 *
 * Rejects only on real failures: the SDK swallows the abort error, so an aborted run just
 * resolves. Deltas are appended rather than read from the per-message buffers, because one run
 * can carry several text or reasoning messages and their buffers are scoped per message id.
 */
export function runAgentTurn({ messages, abortController, onText, onReasoning }: RunHandlers) {
  const agent = new HttpAgent({ url: AGUI_URL, threadId: THREAD_ID });
  agent.setMessages(toAguiMessages(messages));

  let text = "";
  let reasoning = "";

  return agent.runAgent(
    { abortController },
    {
      onTextMessageContentEvent: ({ event }) => onText((text += event.delta)),
      onReasoningMessageContentEvent: ({ event }) => onReasoning((reasoning += event.delta)),
      onRunErrorEvent: ({ event }) => {
        console.error("[agui] run failed", event.code, event.message);
      },
    },
  );
}
