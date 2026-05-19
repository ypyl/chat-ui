import { ActionIcon, Button, CloseButton, Group, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { IconMaximize, IconMinimize, IconLayoutSidebarRight } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useMessages, useStreaming, stopStreaming, turnsToMessages, type Turn } from "./store/chatStore";
import { ChatInput } from "./components/ChatInput";
import { MessageBubble } from "./components/MessageBubble";

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
  const { turns, setTurns } = useMessages();
  const { isStreaming, setIsStreaming, setStreamAbortController } = useStreaming();
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
    (turnIndex: number, role: "user" | "agent", text: string) => {
      setTurns((prev) => {
        const updated = [...prev];
        if (role === "user") {
          updated[turnIndex] = { ...updated[turnIndex], user: { ...updated[turnIndex].user, text } };
        } else {
          updated[turnIndex] = {
            ...updated[turnIndex],
            agent: updated[turnIndex].agent ? { ...updated[turnIndex].agent!, text } : null,
          };
        }
        return updated;
      });
    },
    [setTurns],
  );

  const deleteTurn = useCallback(
    (turnIndexes: number[]) => {
      setTurns((prev) => {
        const updated = [...prev];
        turnIndexes.forEach((idx) => {
          updated[idx] = {
            ...updated[idx],
            user: { ...updated[idx].user, deleted: true },
            agent: updated[idx].agent ? { ...updated[idx].agent, deleted: true } : null,
          };
        });
        return updated;
      });
    },
    [setTurns],
  );

  const undoTurn = useCallback(
    (turnIndex: number) => {
      setTurns((prev) => {
        const updated = [...prev];
        updated[turnIndex] = {
          ...updated[turnIndex],
          user: { ...updated[turnIndex].user, deleted: false },
          agent: updated[turnIndex].agent ? { ...updated[turnIndex].agent, deleted: false } : null,
        };
        return updated;
      });
    },
    [setTurns],
  );

  const finishStream = useCallback(() => {
    setIsStreaming(false);
    setStreamAbortController(null);
  }, [setIsStreaming, setStreamAbortController]);

  const startStream = useCallback(
    (turnIndex: number, messagesToSend: { role: string; text: string }[]) => {
      // Abort any previous stream (setStreamAbortController handles this automatically)
      const controller = new AbortController();
      setStreamAbortController(controller);
      setIsStreaming(true);

      let fullResponse = "";

      setTimeout(() => {
        turnRefs.current.get(turnIndex)?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 0);

      const handleError = () => {
        setTurns((prev) => {
          const updated = [...prev];
          // Only set error if the agent message is still empty (wasn't aborted mid-stream with partial content)
          if (!updated[turnIndex]?.agent?.text) {
            updated[turnIndex] = {
              ...updated[turnIndex],
              agent: { role: "agent", text: "Failed to get response. Please try again.", isError: true },
            };
          }
          return updated;
        });
        finishStream();
      };

      // Run the stream; we don't await — errors/close are handled in callbacks.
      // The promise resolves when the stream ends or is aborted.
      fetchEventSource("/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagesToSend),
        signal: controller.signal,
        onmessage(ev) {
          if (ev.data) {
            fullResponse += ev.data;
            setTurns((prev) => {
              const updated = [...prev];
              updated[turnIndex] = { ...updated[turnIndex], agent: { role: "agent", text: fullResponse } };
              return updated;
            });
          }
        },
        onclose() {
          finishStream();
        },
        onerror(err) {
          // Don't treat abort as an error
          if (controller.signal.aborted) {
            finishStream();
            return;
          }
          handleError();
          // Return a number to suppress automatic retry, or omit to let it retry
          throw err;
        },
      }).catch(() => {
        // If the stream was aborted, we already cleaned up in onerror.
        // For unexpected failures, handle error.
        if (!controller.signal.aborted) {
          handleError();
        }
      });
    },
    [setIsStreaming, setStreamAbortController, setTurns, finishStream],
  );

  const regenerateAgentMessage = useCallback(
    (turnIndex: number) => {
      if (isStreaming) return;
      const messagesToSend = turnsToMessages(turns.slice(0, turnIndex)).concat(turns[turnIndex].user);

      setTurns((prev) => {
        const updated = [...prev];
        updated[turnIndex] = { ...updated[turnIndex], agent: null };
        return updated;
      });

      startStream(turnIndex, messagesToSend);
    },
    [turns, isStreaming, setTurns, startStream],
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

      const newTurn: Turn = { user: { role: "user", text: userText }, agent: null };
      const newTurnIndex = turns.length;

      setTurns((prev) => [...prev, newTurn]);
      setInput("");

      const allMessages = turnsToMessages([...turns, newTurn]);
      startStream(newTurnIndex, allMessages);
    },
    [turns, isStreaming, setTurns, startStream, onResetReferencedText],
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
                {turn.user.deleted ? (
                  <Button variant="transparent" size="xs" p={4} onClick={() => undoTurn(i)}>
                    Restore deleted messages
                  </Button>
                ) : (
                  <>
                    <Stack gap={2} align="flex-end" className="chat-message">
                      <MessageBubble
                        message={turn.user}
                        onSaveEdit={(text) => saveEdit(i, "user", text)}
                        onDeleteTurn={() => deleteTurn([i])}
                      />
                    </Stack>
                    <Stack gap={2} align="flex-start" className="chat-message">
                      {turn.agent === null ? (
                        <Skeleton height={48} />
                      ) : (
                        <MessageBubble
                          message={turn.agent}
                          onSaveEdit={(text) => saveEdit(i, "agent", text)}
                          onDeleteTurn={() => deleteTurn([i])}
                          onRegenerate={() => regenerateAgentMessage(i)}
                        />
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
