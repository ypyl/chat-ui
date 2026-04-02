import { Button, Card, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useSelectionEndPoint } from "./useSelectionEndPoint";

const sampleText = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?
Lorem ipsum dolor sit amet <strong>consectetur adipisicing elit</strong>. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?
Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?`;

export function TextSelectionPage() {
  const [selectedText, setSelectedText] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [rects, setRects] = useState<DOMRect[]>([]);
  const endpoint = useSelectionEndPoint(rects);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const clientRects = range.getClientRects();
          setRects(Array.from(clientRects));
          console.log("[Selection] Rectangles:", Array.from(clientRects).map((r) => ({
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
          })));
          setShowButton(true);
        }
      }, 10);
    };

    const handleMouseDown = () => {
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

  useEffect(() => {
    if (endpoint) {
      console.log("[Selection] Endpoint:", endpoint);
    }
  }, [endpoint]);

  const handleExplain = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (text) {
      setSelectedText(text);
    }
  };

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
          <Button style={buttonStyle} color="blue" size="xs" onClick={handleExplain}>
            Explain
          </Button>
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
