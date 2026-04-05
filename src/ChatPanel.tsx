import { ActionIcon, CloseButton, Group, ScrollArea, Stack, Text } from "@mantine/core";
import {
  IconMaximize,
  IconMinimize,
  IconLayoutSidebarRight,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useMessages, type Message } from "./store/chatStore";
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
  const { messages, setMessages } = useMessages();
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const lastTurnRef = useRef<HTMLDivElement>(null);
  const turnRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (viewport.current) setViewportHeight(viewport.current.clientHeight);
    setTimeout(() => {
      lastTurnRef.current?.scrollIntoView({ block: "start" });
    }, 0);
  }, []);

  const saveEdit = useCallback((index: number, text: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = { role: "user", text };
      return updated;
    });
  }, [setMessages]);

  const deleteTurn = useCallback((indexes: number[]) =>
    setMessages((prev) => {
      const updated = [...prev];
      indexes.forEach((idx) => {
        updated[idx] = { ...updated[idx], deleted: true };
      });
      return updated;
    }), [setMessages]);

  const regenerateAgentMessage = useCallback(async (turnIndex: number) => {
    const messageList: Message[] = [];
    let turnCount = 0;
    for (const msg of messages) {
      if (msg.deleted) continue;
      messageList.push(msg);
      if (msg.role === "user") {
        if (turnCount === turnIndex) break;
        turnCount++;
      }
    }
    setIsLoading(true);

    let fullResponse = "";

    setTimeout(() => {
      const ref = turnRefs.current.get(turnIndex);
      ref?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);

    try {
      await fetchEventSource("/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageList),
        onmessage(ev) {
          if (ev.data) {
            fullResponse += ev.data;
            setMessages((prev) => {
              const updated = [...prev];
              updated[turnIndex * 2 + 1] = { role: "agent", text: fullResponse };
              return updated;
            });
          }
        },
        onclose() {
          setIsLoading(false);
        },
        onerror() {
          setMessages((prev) => {
            const updated = [...prev];
            updated[turnIndex * 2 + 1] = { role: "agent", text: "Failed to get response. Please try again.", isError: true };
            return updated;
          });
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[turnIndex * 2 + 1] = { role: "agent", text: "Failed to get response. Please try again.", isError: true };
        return updated;
      });
      setIsLoading(false);
    }
  }, [messages, setMessages]);

  const sendMessage = useCallback(async (input: string, setInput: (v: string) => void) => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: "user" as const, text: input };
    const agentMessageId = messages.length + 1;
    setMessages((prev) => [...prev, userMessage, { role: "agent", text: "" }]);
    setInput("");
    setIsLoading(true);

    const allMessages = [...messages, userMessage];
    let fullResponse = "";

    setTimeout(() => {
      lastTurnRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);

    try {
      await fetchEventSource("/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allMessages),
        onmessage(ev) {
          if (ev.data) {
            fullResponse += ev.data;
            setMessages((prev) => {
              const updated = [...prev];
              updated[agentMessageId] = { role: "agent", text: fullResponse };
              return updated;
            });
          }
        },
        onclose() {
          setIsLoading(false);
        },
        onerror() {
          setMessages((prev) => {
            const updated = [...prev];
            updated[agentMessageId] = {
              role: "agent",
              text: "Failed to get response. Please try again.",
              isError: true,
            };
            return updated;
          });
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[agentMessageId] = { role: "agent", text: "Failed to get response. Please try again.", isError: true };
        return updated;
      });
      setIsLoading(false);
    }
  }, [messages, setMessages, isLoading]);

  const turns = messages.reduce<Message[][]>((acc, m) => {
    if (m.role === "user") acc.push([m]);
    else if (acc.length > 0) acc[acc.length - 1].push(m);
    else acc.push([m]);
    return acc;
  }, []);

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
                  if (el) turnRefs.current.set(i, el);
                }}
                gap="xs"
                style={{
                  minHeight: isLast ? viewportHeight || "100%" : undefined,
                  justifyContent: "flex-start",
                  paddingTop: "var(--mantine-spacing-xs)",
                }}
              >
                {turn[0]?.deleted ? (
                  <Text c="dimmed" size="sm" fs="italic">
                    Messages deleted
                  </Text>
                ) : (
                  turn.map((m, j) => (
                    <Stack
                      key={j}
                      gap={2}
                      align={m.role === "user" ? "flex-end" : "flex-start"}
                      className="chat-message"
                    >
                      <MessageBubble
                        message={m}
                        index={j}
                        onSaveEdit={saveEdit}
                        onDeleteTurn={deleteTurn}
                        onRegenerate={() => regenerateAgentMessage(i)}
                      />
                    </Stack>
                  ))
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
      />
    </Stack>
  );
}
