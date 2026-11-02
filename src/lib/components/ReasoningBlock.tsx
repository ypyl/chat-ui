import { Box, Text } from "@mantine/core";

/**
 * Collapsed view of a turn's reasoning. The text arrives as AG-UI reasoning messages, which a run
 * may emit on either side of the answer, so the caller passes the whole turn's reasoning at once.
 */
export function ReasoningBlock({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <Box component="details">
      <Text component="summary" size="xs" c="dimmed" style={{ cursor: "pointer" }}>
        Reasoning
      </Text>
      <Text size="xs" c="dimmed" fs="italic" style={{ whiteSpace: "pre-wrap" }}>
        {text}
      </Text>
    </Box>
  );
}
