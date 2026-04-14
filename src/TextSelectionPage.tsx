import { ActionIcon, Button, Card, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { IconQuote } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "wouter";
import { useSelectionRects } from "./useSelectionRects";

const sampleText = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?
Lorem ipsum dolor sit amet <strong>consectetur adipisicing elit</strong>. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?
Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?`;

type Point = { x: number; y: number };

function getSelectionEndPoint(rects: DOMRectList | DOMRect[]): Point | null {
  if (rects.length === 0) {
    return null;
  }

  let maxBottom = -Infinity;
  let targetRect: DOMRect | null = null;

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (rect.bottom > maxBottom) {
      maxBottom = rect.bottom;
      targetRect = rect;
    }
  }

  if (!targetRect) {
    return null;
  }

  return {
    x: targetRect.right,
    y: targetRect.bottom,
  };
}

export function TextSelectionPage() {
  const [selectedText, setSelectedText] = useState("");
  const rects = useSelectionRects();
  const endpoint = getSelectionEndPoint(rects);

  const handleExplain = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (text) {
      setSelectedText(text);
    }
  };

  const showButton = rects.length > 0;

  const buttonStyle: React.CSSProperties = {
    position: "fixed",
    left: endpoint ? `${endpoint.x + 8}px` : 0,
    top: endpoint ? `${endpoint.y + 8}px` : 0,
    transform: "translateX(-50%)",
    zIndex: 1000,
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Text Selection Demo</Title>
        <Button component={Link} to="/" variant="light">
          Back to Chat
        </Button>
      </Group>

      <Text c="dimmed">
        Select any text below to see the selection anchor hook in action. The button appears
        below the selection using the useSelectionAnchor hook.
      </Text>

      <Card withBorder padding="lg" style={{ userSelect: "text" }}>
        <Stack gap="md">
          {sampleText.split("\n\n").map((paragraph, i) => (
            <Text key={i} style={{ whiteSpace: "pre-wrap" }}>
              {paragraph.includes("<strong>") ? (
                <>
                  {paragraph.split("<strong>")[0]}
                  <Text component="span" fw={700}>
                    {paragraph.split("<strong>")[1]?.split("</strong>")[0]}
                  </Text>
                  {paragraph.split("</strong>")[1]}
                </>
              ) : (
                paragraph
              )}
            </Text>
          ))}
        </Stack>

        {endpoint && showButton && (
          <ActionIcon
            variant="light"
            size="md"
            aria-label="Explain selected text"
            style={buttonStyle}
            onClick={handleExplain}
          >
            <IconQuote size={16} />
          </ActionIcon>
        )}
      </Card>

      <Divider />

      <Stack gap="xs">
        <Title order={4}>Selected Text:</Title>
        <Text c={selectedText ? undefined : "dimmed"} fw={selectedText ? 500 : 400}>
          {selectedText || "No text selected"}
        </Text>
      </Stack>

      <Stack gap="xs">
        <Title order={4}>Selection Rectangles:</Title>
        <Text c="dimmed" size="xs">
          {rects.length > 0 ? `${rects.length} rectangle(s)` : "No selection"}
        </Text>
        {rects.map((rect, i) => (
          <Text key={i} size="xs" c="dimmed">
            #{i + 1}: left={rect.left.toFixed(0)}, top={rect.top.toFixed(0)}, width={rect.width.toFixed(0)}, height={rect.height.toFixed(0)}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}
