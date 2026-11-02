import { HttpAgent } from "@ag-ui/client";
import type { Message } from "@ag-ui/core";

export interface ChatTransportRun {
  /** The whole transcript, in order. */
  history: Message[];
  abortController: AbortController;
  /** Called with the agent's transcript after every change, including each text delta. */
  onMessages: (messages: Message[]) => void;
}

/**
 * The one thing the panel needs from a backend. Implement it to talk to something other than an
 * AG-UI endpoint (REST, mock, local model), or use `createAgUiTransport` for AG-UI servers.
 */
export interface ChatTransport {
  /** Resolves when the turn ends, cleanly or not, and rejects only on a real failure. */
  run(input: ChatTransportRun): Promise<unknown>;
}

export interface AgUiTransportOptions {
  /** URL of the AG-UI endpoint, e.g. `/agent`. */
  url: string;
  /** One thread id per conversation. Defaults to a fresh id per transport. */
  threadId?: string;
}

/**
 * Roles the model gets to see. A reasoning message is protocol output that the client stores and
 * renders, not conversation input: the server maps roles onto Microsoft.Extensions.AI chat roles and
 * rejects anything that is not a chat role.
 */
const isHistory = (message: Message) => message.role === "user" || message.role === "assistant";

/**
 * Runs turns against an AG-UI endpoint over HTTP.
 *
 * The agent owns the run and the message list; the panel mirrors it through `onMessages`. Rejects
 * only on real failures, since the SDK treats an abort as a clean ending.
 */
export function createAgUiTransport({ url, threadId = crypto.randomUUID() }: AgUiTransportOptions): ChatTransport {
  return {
    run({ history, abortController, onMessages }) {
      const agent = new HttpAgent({ url, threadId });
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
    },
  };
}
