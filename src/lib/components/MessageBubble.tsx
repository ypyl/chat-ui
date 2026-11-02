import {
  ActionIcon,
  Alert,
  Box,
  CopyButton,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { contentToText, type Message } from "@ag-ui/core";
import { IconCheck, IconCopy, IconEdit, IconRefresh, IconTrash, IconX } from "@tabler/icons-react";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isError } from "../store";

interface MessageBubbleProps {
  message: Message;
  onSaveEdit: (text: string) => void;
  onDeleteTurn: () => void;
  onRegenerate?: () => void;
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <Text size="sm">{children}</Text>,
  h1: ({ children }: { children?: React.ReactNode }) => (
    <Title order={3} fw={700}>
      {children}
    </Title>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <Title order={4} fw={600}>
      {children}
    </Title>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <Title order={5} fw={600}>
      {children}
    </Title>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <Title order={6} fw={600}>
      {children}
    </Title>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ul" mt="xs" mb="xs">
      {children}
    </Box>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li>
      <Text span size="sm">
        {children}
      </Text>
    </li>
  ),
  hr: () => <Divider my="xs" />,
  table: ({ children }: { children?: React.ReactNode }) => <Table>{children}</Table>,
  thead: ({ children }: { children?: React.ReactNode }) => <Table.Thead>{children}</Table.Thead>,
  tr: ({ children }: { children?: React.ReactNode }) => <Table.Tr>{children}</Table.Tr>,
  th: ({ children }: { children?: React.ReactNode }) => <Table.Th>{children}</Table.Th>,
  td: ({ children }: { children?: React.ReactNode }) => <Table.Td>{children}</Table.Td>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <Text size="sm" span fw={500}>
      {children}
    </Text>
  ),
};

const MarkdownContent = memo(function MarkdownContent({ text }: { text: string }) {
  return (
    <Box>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </Box>
  );
});

export const MessageBubble = memo(function MessageBubble({
  message,
  onSaveEdit,
  onDeleteTurn,
  onRegenerate,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  // Activity messages carry arbitrary structured data rather than text, and this UI does not render them.
  const text = message.role === "activity" ? "" : contentToText(message.content);

  const handleStartEdit = (text: string) => {
    setIsEditing(true);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onSaveEdit(editText);
    setIsEditing(false);
  };

  const renderContent = () => {
    if (isEditing) {
      return (
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
              handleSaveEdit();
            }
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
      );
    }

    if (isError(message)) {
      return (
        <Alert variant="light" color="red">
          {text}
        </Alert>
      );
    }

    if (message.role === "assistant") {
      return <MarkdownContent text={text} />;
    }

    return (
      <Paper p="xs" bg="var(--mantine-color-blue-light)" radius="md">
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {text}
        </Text>
      </Paper>
    );
  };

  return (
    <Stack gap="xs">
      {renderContent()}
      <Group gap="xs" justify={message.role === "user" ? "flex-end" : undefined}>
        {message.role === "assistant" && (
          <CopyButton value={text} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
                <ActionIcon size="xs" color={copied ? "teal" : "gray"} variant="subtle" onClick={copy}>
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}
        {message.role === "assistant" && onRegenerate && (
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={onRegenerate}>
            <IconRefresh size={12} />
          </ActionIcon>
        )}
        {message.role === "user" && !isEditing && (
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => handleStartEdit(text)}>
            <IconEdit size={12} />
          </ActionIcon>
        )}
        {message.role === "user" && isEditing && (
          <Group gap="xs">
            <ActionIcon size="xs" variant="subtle" color="green" onClick={handleSaveEdit}>
              <IconCheck size={12} />
            </ActionIcon>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setIsEditing(false)}>
              <IconX size={12} />
            </ActionIcon>
          </Group>
        )}
        <ActionIcon size="xs" variant="subtle" color="red" onClick={onDeleteTurn}>
          <IconTrash size={12} />
        </ActionIcon>
      </Group>
    </Stack>
  );
});
