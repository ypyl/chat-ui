import { Box, Button, Card, Divider, Group, Stack, Text, Title, Code, ScrollArea } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const sampleText = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?
Lorem ipsum dolor sit amet <strong>consectetur adipisicing elit</strong>. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?
Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?`;

export function TextSelectionPage() {
  const [rects, setRects] = useState<SelectionRect[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getSelectionRects = (): SelectionRect[] => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return [];
    const range = selection.getRangeAt(0);
    if (selection.isCollapsed) return [];

    return Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
      }));
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selectionRects = getSelectionRects();
        const selection = window.getSelection();
        const text = selection?.toString().trim() || "";

        if (selectionRects.length > 0) {
          setRects(selectionRects);
          setSelectedText(text);
          setShowButton(true);
        } else {
          setRects([]);
          setSelectedText("");
          setShowButton(false);
        }
      }, 0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
        return;
      }
      setShowButton(false);
      setRects([]);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const firstRect = rects[0];
  const lastRect = rects[rects.length - 1];

  const buttonStyle: React.CSSProperties = {
    position: "fixed",
    display: showButton ? "block" : "none",
    left: firstRect ? `${firstRect.left}px` : 0,
    top: lastRect ? `${lastRect.bottom + 8}px` : 0,
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
        Select any text below to see the selection rectangles. This demo shows how to properly
        handle multi-line text selections using Range.getClientRects().
      </Text>

      <Card ref={contentRef} withBorder padding="lg" style={{ userSelect: "text", position: "relative" }}>
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

        {rects.map((rect, i) => (
          <Box
            key={i}
            style={{
              position: "fixed",
              left: `${rect.left}px`,
              top: `${rect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              background: "rgba(255, 255, 0, 0.3)",
              borderRadius: "2px",
              pointerEvents: "none",
            }}
          />
        ))}

        <Button ref={buttonRef} style={buttonStyle} color="blue" size="xs">
          Explain
        </Button>
      </Card>

      <Divider />

      <Stack gap="xs">
        <Title order={4}>Selection Rectangles:</Title>
        <ScrollArea>
          <Code block style={{ maxHeight: 200 }}>
            {rects.length > 0
              ? JSON.stringify(rects, null, 2)
              : "No selection"}
          </Code>
        </ScrollArea>
      </Stack>

      <Stack gap="xs">
        <Title order={4}>Selected Text:</Title>
        <Text c={selectedText ? undefined : "dimmed"} fw={selectedText ? 500 : 400}>
          {selectedText || "No text selected"}
        </Text>
      </Stack>
    </Stack>
  );
}
