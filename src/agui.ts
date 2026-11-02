import { HttpAgent } from "@ag-ui/client";
import type { Message } from "@ag-ui/core";

export const AGUI_URL = "/agent";

/** One AG-UI thread for the browser session; each turn runs inside it. */
export const THREAD_ID = crypto.randomUUID();

/**
 * Roles the model gets to see. A reasoning message is protocol output that the client stores and
 * renders, not conversation input: the server maps roles onto Microsoft.Extensions.AI chat roles and
 * rejects anything that is not a chat role.
 */
const isHistory = (message: Message) => message.role === "user" || message.role === "assistant";

interface RunHandlers {
  /** The whole transcript, in order. */
  history: Message[];
  abortController: AbortController;
  /** Called with the agent's transcript after every change, including each text delta. */
  onMessages: (messages: Message[]) => void;
}

/**
 * Runs one turn against the AG-UI endpoint.
 *
 * The agent owns the run and the message list; the store mirrors it through `onMessages`. Rejects
 * only on real failures, since the SDK treats an abort as a clean ending.
 */
export function runAgentTurn({ history, abortController, onMessages }: RunHandlers) {
  const agent = new HttpAgent({ url: AGUI_URL, threadId: THREAD_ID });
  agent.setMessages(history);

  // Middleware is the SDK's own hook for shaping the outgoing run, so the transcript keeps its
  // reasoning messages while the request leaves without them.
  agent.use((input, next) => next.run({ ...input, messages: input.messages.filter(isHistory) }));

  return agent.runAgent(
    { abortController },
    {
      onMessagesChanged: ({ messages }) => onMessages(messages as Message[]),
      onRunErrorEvent: ({ event }) => {
        console.error("[agui] run failed", event.code, event.message);
      },
    },
  );
}
