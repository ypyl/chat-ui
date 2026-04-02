import {
  ActionIcon,
  Alert,
  Box,
  Button,
  CloseButton,
  CopyButton,
  Flex,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Tooltip,
  Divider,
  Table,
  Title,
  Paper,
} from "@mantine/core";
import {
  IconMaximize,
  IconMinimize,
  IconLayoutSidebarRight,
  IconSend,
  IconTrash,
  IconCopy,
  IconRefresh,
  IconEdit,
  IconCheck,
  IconX,
  IconQuote,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useChat } from "./ChatContext";
import type { Message } from "./ChatContext";

interface ChatPanelProps {
  expanded?: boolean;
  onExpand?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onMoveToAside?: () => void;
  referencedText?: string | null;
  onResetReferencedText?: () => void;
}

export function ChatPanel({
  expanded,
  onExpand,
  onMinimize,
  onClose,
  onMoveToAside,
  referencedText,
  onResetReferencedText,
}: ChatPanelProps) {
  const { messages, setMessages, input, setInput, cursorPos, setCursorPos } = useChat();
  const viewport = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const lastTurnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewport.current) setViewportHeight(viewport.current.clientHeight);
    setTimeout(() => {
      lastTurnRef.current?.scrollIntoView({ block: "start" });
    }, 0);
  }, []);

  useEffect(() => {
    if (cursorPos !== null && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const saveEdit = (index: number) => {
    if (!editText.trim()) return;
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = { role: "user", text: editText };
      return updated;
    });
    setEditingIndex(null);
  };

  const regenerateAgentMessage = async (index: number) => {
    const messageList = messages.filter((m) => !m.deleted);
    setIsLoading(true);

    let fullResponse = "";

    setTimeout(() => {
      lastTurnRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
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
              updated[index] = { role: "agent", text: fullResponse };
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
            updated[index] = { role: "agent", text: "Failed to get response. Please try again.", isError: true };
            return updated;
          });
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[index] = { role: "agent", text: "Failed to get response. Please try again.", isError: true };
        return updated;
      });
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
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
  };

  type IndexedMessage = Message & { _index: number };
  const turns = messages.reduce<IndexedMessage[][]>((acc, m, i) => {
    const entry: IndexedMessage = { ...m, _index: i };
    if (m.role === "user") acc.push([entry]);
    else if (acc.length > 0) acc[acc.length - 1].push(entry);
    else acc.push([entry]);
    return acc;
  }, []);

  const deleteTurn = (turn: IndexedMessage[]) =>
    setMessages((prev) => {
      const updated = [...prev];
      turn.forEach((m) => {
        updated[m._index] = { ...updated[m._index], deleted: true };
      });
      return updated;
    });

  const undoTurn = (turn: IndexedMessage[]) =>
    setMessages((prev) => {
      const updated = [...prev];
      turn.forEach((m) => {
        updated[m._index] = { ...updated[m._index], deleted: false };
      });
      return updated;
    });

  return (
    <Stack gap="xs" style={{ height: "100%" }}>
      <Group>
        <Text fw={500} mr="auto">
          Chat with AI
        </Text>
        {expanded ? (
          <ActionIcon variant="subtle" color="gray" onClick={onMinimize}>
            <IconMinimize size={20} />
          </ActionIcon>
        ) : (
          <ActionIcon variant="subtle" color="gray" onClick={onExpand}>
            <IconMaximize size={20} />
          </ActionIcon>
        )}
        {onMoveToAside && (
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
                ref={isLast ? lastTurnRef : undefined}
                gap="xs"
                style={{
                  minHeight: isLast ? viewportHeight || "100%" : undefined, // ← only last turn
                  justifyContent: "flex-start",
                  paddingTop: "var(--mantine-spacing-xs)",
                }}
              >
                {turn[0]?.deleted ? (
                  <Button variant="transparent" size="xs" p={4} onClick={() => undoTurn(turn)}>
                    Restore deleted messages
                  </Button>
                ) : (
                  turn.map((m, j) => (
                    <Stack
                      key={j}
                      gap={2}
                      align={m.role === "user" ? "flex-end" : "flex-start"}
                      className="chat-message"
                    >
                      <Stack gap="xs">
                        {editingIndex === m._index ? (
                          <Textarea
                            autoFocus
                            autosize
                            minRows={1}
                            maxRows={4}
                            size="sm"
                            value={editText}
                            onChange={(e) => setEditText(e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit(m._index);
                              }
                              if (e.key === "Escape") setEditingIndex(null);
                            }}
                          />
                        ) : m.isError ? (
                          <Alert variant="light" color="red">
                            {m.text}
                          </Alert>
                        ) : m.role === "agent" ? (
                          <Box>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <Text size="sm">{children}</Text>,
                                h1: ({ children }) => (
                                  <Title order={3} fw={700}>
                                    {children}
                                  </Title>
                                ),
                                h2: ({ children }) => (
                                  <Title order={4} fw={600}>
                                    {children}
                                  </Title>
                                ),
                                h3: ({ children }) => (
                                  <Title order={5} fw={600}>
                                    {children}
                                  </Title>
                                ),
                                h4: ({ children }) => (
                                  <Title order={6} fw={600}>
                                    {children}
                                  </Title>
                                ),
                                ul: ({ children }) => (
                                  <Box component="ul" mt="xs" mb="xs">
                                    {children}
                                  </Box>
                                ),
                                li: ({ children }) => (
                                  <li>
                                    <Text span size="sm">
                                      {children}
                                    </Text>
                                  </li>
                                ),
                                hr: () => <Divider my="xs" />,
                                table: ({ children }) => <Table>{children}</Table>,
                                thead: ({ children }) => <Table.Thead>{children}</Table.Thead>,
                                tr: ({ children }) => <Table.Tr>{children}</Table.Tr>,
                                th: ({ children }) => <Table.Th>{children}</Table.Th>,
                                td: ({ children }) => <Table.Td>{children}</Table.Td>,
                                strong: ({ children }) => (
                                  <Text size="sm" span fw={500}>
                                    {children}
                                  </Text>
                                ),
                              }}
                            >
                              {m.text}
                            </ReactMarkdown>
                          </Box>
                        ) : (
                          <Paper p="xs" bg="var(--mantine-color-blue-light)" radius="md">
                            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                              {m.text}
                            </Text>
                          </Paper>
                        )}
                        <Group
                          gap="xs"
                          className="chat-delete-btn"
                          justify={
                            m.role === "user" ? (editingIndex === m._index ? "space-between" : "flex-end") : undefined
                          }
                        >
                          {m.role === "agent" && (
                            <CopyButton value={m.text} timeout={2000}>
                              {({ copied, copy }) => (
                                <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
                                  <ActionIcon
                                    size="xs"
                                    color={copied ? "teal" : "gray"}
                                    variant="subtle"
                                    onClick={copy}
                                  >
                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </CopyButton>
                          )}
                          {m.role === "agent" && (
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="gray"
                              onClick={() => regenerateAgentMessage(m._index)}
                            >
                              <IconRefresh size={12} />
                            </ActionIcon>
                          )}
                          {m.role === "user" && editingIndex !== m._index && (
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="gray"
                              onClick={() => {
                                setEditingIndex(m._index);
                                setEditText(m.text);
                              }}
                            >
                              <IconEdit size={12} />
                            </ActionIcon>
                          )}
                          {m.role === "user" && editingIndex === m._index && (
                            <Group gap="xs">
                              <ActionIcon size="xs" variant="subtle" color="green" onClick={() => saveEdit(m._index)}>
                                <IconCheck size={12} />
                              </ActionIcon>
                              <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setEditingIndex(null)}>
                                <IconX size={12} />
                              </ActionIcon>
                            </Group>
                          )}
                          <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deleteTurn(turn)}>
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Group>
                      </Stack>
                    </Stack>
                  ))
                )}
              </Stack>
            );
          })}
        </Stack>
      </ScrollArea>

      <Paper shadow="xs" radius="md">
        <Stack gap="xs" style={{ userSelect: "none" }}>
          <Stack gap={0}>
            {referencedText && (
              <Paper
                pl="sm"
                pr="sm"
                pb="xs"
                pt="sm"
                bg="var(--mantine-color-blue-light)"
                style={{
                  borderTopLeftRadius: "var(--mantine-radius-md)",
                  borderTopRightRadius: "var(--mantine-radius-md)",
                  borderBottomRightRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <IconQuote size={16} />
                  <Text truncate="end" size="sm" style={{ flex: 1, minWidth: 0 }}>
                    {referencedText}
                  </Text>

                  <CloseButton size="xs" onClick={() => onResetReferencedText?.()} />
                </Group>
              </Paper>
            )}
            <Box pl="sm" pr="sm">
              <Textarea
                ref={textareaRef}
                variant="unstyled"
                autoFocus
                placeholder="Type message..."
                autosize
                minRows={1}
                maxRows={4}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </Box>
          </Stack>
          <Flex justify="flex-end">
            <ActionIcon color="blue" onClick={sendMessage}>
              <IconSend size={18} />
            </ActionIcon>
          </Flex>
        </Stack>
      </Paper>
    </Stack>
  );
}
