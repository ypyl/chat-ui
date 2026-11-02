import { ActionIcon, Button, CloseButton, Group, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { IconMaximize, IconMinimize, IconLayoutSidebarRight } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runAgentTurn } from "./agui";
import { groupTurns, isDeleted, turnAnswers, turnReasoning, useMessages, useStreaming, stopStreaming } from "./store/chatStore";
import type { Message, UserMessage } from "@ag-ui/core";
import { ChatInput } from "./components/ChatInput";
import { MessageBubble } from "./components/MessageBubble";
import { ReasoningBlock } from "./components/ReasoningBlock";

type ChatView = "affix" | "dialog" | "expanded" | "aside";

interface ChatPanelProps {
  viewMode?: ChatView;
  onExpand?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onMoveToAside?: () => void;
  onMoveToDialog?: () => void;
  referencedText?: string | null;
  onResetReferencedText?: () => void;
}

export function ChatPanel({
  viewMode,
  onExpand,
  onMinimize,
  onClose,
  onMoveToAside,
  onMoveToDialog,
  referencedText,
  onResetReferencedText,
}: ChatPanelProps) {
  const { messages, setMessages } = useMessages();
  const { isStreaming, setIsStreaming, setStreamAbortController } = useStreaming();
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

  const updateMessage = useCallback(
    (id: string, patch: Partial<Message>) => {
      setMessages((prev) => prev.map((message) => (message.id === id ? ({ ...message, ...patch } as Message) : message)));
    },
    [setMessages],
  );

  const setTurnDeleted = useCallback(
    (turnIndexes: number[], deleted: boolean) => {
      const ids = new Set(turnIndexes.flatMap((i) => [turns[i].user, ...turns[i].replies].map((m) => m.id)));
      setMessages((prev) =>
        prev.map((message) =>
          ids.has(message.id) ? ({ ...message, metadata: { ...message.metadata, deleted } } as Message) : message,
        ),
      );
    },
    [turns, setMessages],
  );

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

      runAgentTurn({ history, abortController: controller, onMessages: setMessages })
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
    [setIsStreaming, setStreamAbortController, setMessages, finishStream],
  );

  const regenerateAgentMessage = useCallback(
    (turnIndex: number) => {
      if (isStreaming) return;
      // Drop this turn's answer and everything after it, then run again from the question.
      const cutoff = messages.findIndex((message) => message.id === turns[turnIndex].user.id);
      if (cutoff < 0) return;
      const history = messages.slice(0, cutoff + 1);
      setMessages(history);
      runTurn(history);
    },
    [turns, messages, isStreaming, setMessages, runTurn],
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
          Chat with AI
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
        ) : (
          <ActionIcon variant="subtle" color="gray" onClick={onExpand}>
            <IconMaximize size={20} />
          </ActionIcon>
        )}
        {viewMode !== "aside" && onMoveToAside && (
          <ActionIcon variant="subtle" color="gray" onClick={onMoveToAside}>
            <IconLayoutSidebarRight size={20} />
          </ActionIcon>
        )}
        {onClose && <CloseButton onClick={onClose} />}
      </Group>

      <ScrollArea type="scroll" style={{ flex: 1, cursor: "default" }} viewportRef={viewport}>
        <Stack gap={0}>
          {turns.map((turn, i) => {
            const isLast = i === turns.length - 1;
            return (
              <Stack
                key={i}
                ref={(el) => {
                  if (el) {
                    turnRefs.current.set(i, el);
                  }
                }}
                gap="xs"
                style={{
                  minHeight: isLast ? viewportHeight || "100%" : undefined,
                  justifyContent: "flex-start",
                  paddingTop: "var(--mantine-spacing-xs)",
                }}
              >
                {isDeleted(turn.user) ? (
                  <Button variant="transparent" size="xs" p={4} onClick={() => setTurnDeleted([i], false)}>
                    Restore deleted messages
                  </Button>
                ) : (
                  <>
                    <Stack gap={2} align="flex-end" className="chat-message">
                      <MessageBubble
                        message={turn.user}
                        onSaveEdit={(text) => updateMessage(turn.user.id, { content: text } as Partial<Message>)}
                        onDeleteTurn={() => setTurnDeleted([i], true)}
                      />
                    </Stack>
                    <Stack gap={2} align="flex-start" className="chat-message">
                      {turn.replies.length === 0 ? (
                        <Skeleton height={48} />
                      ) : (
                        <>
                          <ReasoningBlock text={turnReasoning(turn)} />
                          {turnAnswers(turn).map((reply) => (
                            <MessageBubble
                              key={reply.id}
                              message={reply}
                              onSaveEdit={(text) => updateMessage(reply.id, { content: text } as Partial<Message>)}
                              onDeleteTurn={() => setTurnDeleted([i], true)}
                              onRegenerate={reply.role === "assistant" ? () => regenerateAgentMessage(i) : undefined}
                            />
                          ))}
                        </>
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            );
          })}
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
}
