import { ActionIcon, CloseButton, Flex, Group, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { IconMaximize, IconMinimize, IconLayoutSidebarRight, IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

export type Message = { role: "user" | "agent"; text: string };

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
}: ChatPanelProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);

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

  const lastTurnRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      {
        role: "agent",
        text:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil? Voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis."
            .split(" ")
            .slice(0, Math.floor(Math.random() * 30) + 5)
            .join(" ") + ".",
      },
    ]);
    setInput("");
    setTimeout(() => {
      lastTurnRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  };

  const turns = messages.reduce<Message[][]>((acc, m) => {
    if (m.role === "user") acc.push([m]);
    else if (acc.length > 0) acc[acc.length - 1].push(m);
    return acc;
  }, []);

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

      <ScrollArea type="scroll" style={{ flex: 1 }} viewportRef={viewport}>
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
                {turn.map((m, j) => (
                  <Text
                    key={j}
                    size="sm" fw={500} ta={m.role === "user" ? "right" : "left"}
                  >
                    {m.text}
                  </Text>
                ))}
              </Stack>
            );
          })}
        </Stack>
      </ScrollArea>

      <Stack
        gap="xs"
        style={{
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: "var(--mantine-radius-md)",
          padding: "var(--mantine-spacing-xs)",
        }}
      >
        <Textarea
          ref={textareaRef}
          variant="unstyled"
          autoFocus
          placeholder="Type message..."
          autosize
          minRows={1}
          maxRows={4}
          value={input}
          styles={{
            wrapper: {
              // Prevents the wrapper from being a target for text selection/cursor placement
              userSelect: "none",
              cursor: "text",
            },
            input: {
              // Re-enables selection specifically for the text area
              userSelect: "text",
              // Ensures the textarea fills the wrapper's clickable area
              height: "100%",
              width: "100%",
            },
          }}
          onChange={(e) => setInput(e.currentTarget.value)}
          onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Flex justify="flex-end">
          <ActionIcon color="blue" onClick={sendMessage}>
            <IconSend size={18} />
          </ActionIcon>
        </Flex>
      </Stack>
    </Stack>
  );
}
