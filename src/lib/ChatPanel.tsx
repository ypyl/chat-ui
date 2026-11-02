import { ActionIcon, CloseButton, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { IconMaximize, IconMinimize, IconLayoutSidebarRight } from "@tabler/icons-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatContext } from "./context";
import {
  groupTurns,
  setTurnDeleted,
  useChatMessages,
  useChatStreaming,
  useStopStreaming,
} from "./store";
import type { Message, UserMessage } from "@ag-ui/core";
import { ChatInput } from "./components/ChatInput";
import { ChatTurn } from "./components/ChatTurn";

type ChatView = "affix" | "dialog" | "expanded" | "aside";

interface ChatPanelProps {
  title?: string;
  viewMode?: ChatView;
  onExpand?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onMoveToAside?: () => void;
  onMoveToDialog?: () => void;
  referencedText?: string | null;
  onResetReferencedText?: () => void;
}

export const ChatPanel = memo(function ChatPanel({
  title = "Chat with AI",
  viewMode,
  onExpand,
  onMinimize,
  onClose,
  onMoveToAside,
  onMoveToDialog,
  referencedText,
  onResetReferencedText,
}: ChatPanelProps) {
  const { messages, setMessages } = useChatMessages();
  const { isStreaming, setIsStreaming, setStreamAbortController } = useChatStreaming();
  const stopStreaming = useStopStreaming();
  const { store, transport } = useChatContext();
  const turns = useMemo(() => groupTurns(messages), [messages]);
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const turnRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Handle referenced text: prepend as a hidden system message for the next send
  const pendingRefText = useRef<string | null>(null);
  useEffect(() => {
    if (referencedText) {
      pendingRefText.current = referencedText;
    }
  }, [referencedText]);

  useEffect(() => {
    if (viewport.current) setViewportHeight(viewport.current.clientHeight);
    setTimeout(() => {
      turnRefs.current.get(turns.length - 1)?.scrollIntoView({ block: "start" });
    }, 0);
  }, [turns.length]);

  const saveEdit = useCallback(
    (messageId: string, text: string) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === messageId ? ({ ...message, content: text } as Message) : message)),
      );
    },
    [setMessages],
  );

  // Every handler below takes an id rather than a turn index and reads the live state from the
  // store, so they keep one identity for the life of the panel. That is what lets ChatTurn sit
  // behind memo while the transcript is replaced on every streaming token.
  const deleteTurn = useCallback(
    (messageId: string) => {
      setMessages((prev) => setTurnDeleted(prev, messageId, true));
    },
    [setMessages],
  );

  const restoreTurn = useCallback(
    (messageId: string) => {
      setMessages((prev) => setTurnDeleted(prev, messageId, false));
    },
    [setMessages],
  );

  const registerTurn = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) turnRefs.current.set(index, element);
    else turnRefs.current.delete(index);
  }, []);

  const finishStream = useCallback(() => {
    setIsStreaming(false);
    setStreamAbortController(null);
  }, [setIsStreaming, setStreamAbortController]);

  // The agent owns the run and the message list; the store mirrors it event by event.
  const runTurn = useCallback(
    (history: Message[]) => {
      // Abort any previous stream (setStreamAbortController handles this automatically)
      const controller = new AbortController();
      setStreamAbortController(controller);
      setIsStreaming(true);

      setTimeout(() => {
        turnRefs.current.get(history.filter((m) => m.role === "user").length - 1)?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      }, 0);

      transport
        .run({ history, abortController: controller, onMessages: setMessages })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error("[chat] run failed", err);
          // Keep partial output: only add an error bubble when the turn produced no answer.
          setMessages((prev) => {
            const last = prev.at(-1);
            if (last?.role === "assistant" && last.content) return prev;
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Failed to get response. Please try again.",
                metadata: { isError: true },
              },
            ];
          });
        })
        .finally(finishStream);
    },
    [setIsStreaming, setStreamAbortController, setMessages, finishStream, transport],
  );

  const regenerateAgentMessage = useCallback(
    (messageId: string) => {
      const state = store.getState();
      if (state.isStreaming) return;

      // Drop this turn's answer and everything after it, then run again from the question.
      const answerIndex = state.messages.findIndex((message) => message.id === messageId);
      if (answerIndex < 0) return;

      let questionIndex = answerIndex;
      while (questionIndex > 0 && state.messages[questionIndex].role !== "user") questionIndex--;

      const history = state.messages.slice(0, questionIndex + 1);
      state.setMessages(history);
      runTurn(history);
    },
    [store, runTurn],
  );

  const sendMessage = useCallback(
    (input: string, setInput: (v: string) => void) => {
      if (!input.trim() || isStreaming) return;

      // Consume any pending referenced text for this message
      const refText = pendingRefText.current;
      if (refText) {
        pendingRefText.current = null;
        onResetReferencedText?.();
      }

      const userText = refText ? `Context: ${refText}\n\nQuestion: ${input}` : input;
      const userMessage: UserMessage = { id: crypto.randomUUID(), role: "user", content: userText };

      const history = [...messages, userMessage];
      setMessages(history);
      setInput("");
      runTurn(history);
    },
    [messages, isStreaming, setMessages, runTurn, onResetReferencedText],
  );

  return (
    <Stack gap="xs" style={{ height: "100%" }}>
      <Group>
        <Text fw={500} mr="auto">
          {title}
        </Text>
        {viewMode === "expanded" ? (
          <ActionIcon variant="subtle" color="gray" onClick={onMinimize}>
            <IconMinimize size={20} />
          </ActionIcon>
        ) : viewMode === "aside" ? (
          <>
            <ActionIcon variant="subtle" color="gray" onClick={onExpand}>
              <IconMaximize size={20} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" onClick={onMoveToDialog}>
              <IconMinimize size={20} />
            </ActionIcon>
          </>
        ) : onExpand ? (
          <ActionIcon variant="subtle" color="gray" onClick={onExpand}>
            <IconMaximize size={20} />
          </ActionIcon>
        ) : null}
        {viewMode !== "aside" && onMoveToAside && (
          <ActionIcon variant="subtle" color="gray" onClick={onMoveToAside}>
            <IconLayoutSidebarRight size={20} />
          </ActionIcon>
        )}
        {onClose && <CloseButton onClick={onClose} />}
      </Group>

      <ScrollArea type="scroll" style={{ flex: 1, cursor: "default" }} viewportRef={viewport}>
        <Stack gap={0}>
          {turns.map((turn, i) => (
            <ChatTurn
              key={turn.user.id}
              turn={turn}
              index={i}
              isLast={i === turns.length - 1}
              viewportHeight={viewportHeight}
              registerTurn={registerTurn}
              onSaveEdit={saveEdit}
              onDeleteTurn={deleteTurn}
              onRestoreTurn={restoreTurn}
              onRegenerate={regenerateAgentMessage}
            />
          ))}
        </Stack>
      </ScrollArea>

      <ChatInput
        referencedText={referencedText}
        onResetReferencedText={onResetReferencedText}
        onSend={sendMessage}
        isStreaming={isStreaming}
        onStop={stopStreaming}
      />
    </Stack>
  );
});
