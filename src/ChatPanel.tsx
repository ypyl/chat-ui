import {
  ActionIcon,
  Alert,
  Notification,
  Button,
  CloseButton,
  CopyButton,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Tooltip,
  Divider,
  Box,
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

export type Message = { role: "user" | "agent"; text: string; deleted?: boolean; isError?: boolean };

const fakeAgentReply = (): Pick<Message, "text" | "isError"> => {
  if (Math.random() < 0.3) return { text: "Something went wrong. Please try again later.", isError: true };
  return {
    text:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil? Voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis."
        .split(" ")
        .slice(0, Math.floor(Math.random() * 30) + 5)
        .join(" ") + ".",
  };
};

interface ChatPanelProps {
  expanded?: boolean;
  onExpand?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onMoveToAside?: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  cursorPos: number | null;
  setCursorPos: React.Dispatch<React.SetStateAction<number | null>>;
  referencedText: string | null;
  onResetReferencedText: () => void;
}

export function ChatPanel({
  expanded,
  onExpand,
  onMinimize,
  onClose,
  onMoveToAside,
  messages,
  setMessages,
  input,
  setInput,
  cursorPos,
  setCursorPos,
  referencedText,
  onResetReferencedText,
}: ChatPanelProps) {
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

  const saveEdit = (index: number) => {
    if (!editText.trim()) return;
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = { role: "user", text: editText };
      // regenerate the immediately following agent message if present
      if (updated[index + 1]?.role === "agent") updated[index + 1] = { role: "agent", ...fakeAgentReply() };
      return updated;
    });
    setEditingIndex(null);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }, { role: "agent", ...fakeAgentReply() }]);
    setInput("");
    setTimeout(() => {
      lastTurnRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
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
                        ) : (
                          <Text size="sm" fw={500} style={{ whiteSpace: "pre-wrap" }}>
                            {m.text}
                          </Text>
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
                              onClick={() =>
                                setMessages((prev) => {
                                  const updated = [...prev];
                                  updated[m._index] = { role: "agent", ...fakeAgentReply() };
                                  return updated;
                                })
                              }
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

      <Paper shadow="xs" radius="md" p="sm">
        <Stack gap="xs" style={{ userSelect: "none" }}>
          <Stack gap={0}>
            {referencedText && (
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <IconQuote size={16} />
                  <Text truncate="end" size="sm" style={{ flex: 1, minWidth: 0 }}>
                    {referencedText}
                  </Text>

                  <CloseButton size="xs" onClick={() => onResetReferencedText()} />
                </Group>
                <Divider />
              </Stack>
            )}
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
