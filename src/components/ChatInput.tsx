import { ActionIcon, Box, CloseButton, Group, Paper, Stack, Text, Textarea } from "@mantine/core";
import { IconQuote, IconSend } from "@tabler/icons-react";
import { useRef } from "react";
import { useInput } from "../context/InputContext";

interface ChatInputProps {
  referencedText?: string | null;
  onResetReferencedText?: () => void;
  onSend: (input: string, setInput: (v: string) => void) => void;
}

export function ChatInput({ referencedText, onResetReferencedText, onSend }: ChatInputProps) {
  const { input, setInput, setCursorPos } = useInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
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
                  onSend(input, setInput);
                }
              }}
            />
          </Box>
        </Stack>
        <Box style={{ display: "flex", justifyContent: "flex-end" }} pr="sm" pb="xs">
          <ActionIcon color="blue" onClick={() => onSend(input, setInput)}>
            <IconSend size={18} />
          </ActionIcon>
        </Box>
      </Stack>
    </Paper>
  );
}
