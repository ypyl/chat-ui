import { ActionIcon, CloseButton, Group, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import { IconMaximize, IconMinimize, IconLayoutSidebarRight } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useMessages, turnsToMessages, type Turn } from "./store/chatStore";
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
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const turnRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

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

  const regenerateAgentMessage = useCallback(
    async (turnIndex: number) => {
      const messagesToSend = turnsToMessages(turns.slice(0, turnIndex)).concat(turns[turnIndex].user);

      setIsLoading(true);
      let fullResponse = "";

      setTimeout(() => {
        turnRefs.current.get(turnIndex)?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 0);

      try {
        await fetchEventSource("/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messagesToSend),
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
            setIsLoading(false);
          },
          onerror() {
            setTurns((prev) => {
              const updated = [...prev];
              updated[turnIndex] = {
                ...updated[turnIndex],
                agent: { role: "agent", text: "Failed to get response. Please try again.", isError: true },
              };
              return updated;
            });
            setIsLoading(false);
          },
        });
      } catch {
        setTurns((prev) => {
          const updated = [...prev];
          updated[turnIndex] = {
            ...updated[turnIndex],
            agent: { role: "agent", text: "Failed to get response. Please try again.", isError: true },
          };
          return updated;
        });
        setIsLoading(false);
      }
    },
    [turns, setTurns],
  );

  const sendMessage = useCallback(
    async (input: string, setInput: (v: string) => void) => {
      if (!input.trim() || isLoading) return;

      const newTurn: Turn = { user: { role: "user", text: input }, agent: null };
      const newTurnIndex = turns.length;

      setTurns((prev) => [...prev, newTurn]);
      setInput("");
      setIsLoading(true);

      const allMessages = turnsToMessages([...turns, newTurn]);
      let fullResponse = "";

      setTimeout(() => {
        turnRefs.current.get(newTurnIndex)?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 0);

      try {
        await fetchEventSource("/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allMessages),
          onmessage(ev) {
            if (ev.data) {
              fullResponse += ev.data;
              setTurns((prev) => {
                const updated = [...prev];
                updated[newTurnIndex] = { ...updated[newTurnIndex], agent: { role: "agent", text: fullResponse } };
                return updated;
              });
            }
          },
          onclose() {
            setIsLoading(false);
          },
          onerror() {
            setTurns((prev) => {
              const updated = [...prev];
              updated[newTurnIndex] = {
                ...updated[newTurnIndex],
                agent: { role: "agent", text: "Failed to get response. Please try again.", isError: true },
              };
              return updated;
            });
            setIsLoading(false);
          },
        });
      } catch {
        setTurns((prev) => {
          const updated = [...prev];
          updated[newTurnIndex] = {
            ...updated[newTurnIndex],
            agent: { role: "agent", text: "Failed to get response. Please try again.", isError: true },
          };
          return updated;
        });
        setIsLoading(false);
      }
    },
    [turns, isLoading, setTurns],
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
                  <Text c="dimmed" size="sm" fs="italic">
                    Messages deleted
                  </Text>
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
                        <Skeleton height={40} />
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

      <ChatInput referencedText={referencedText} onResetReferencedText={onResetReferencedText} onSend={sendMessage} />
    </Stack>
  );
}
