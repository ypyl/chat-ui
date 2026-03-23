import {
  ActionIcon,
  Affix,
  AppShell,
  Box,
  Burger,
  Dialog,
  Mark,
  MantineProvider,
  Text,
  Transition,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import type { Message } from "./ChatPanel";
import { IconMessageCircle } from "@tabler/icons-react";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure();
  const handleClose = () => {
    closeChat();
    setExpanded(false);
    setAsideChat(false);
    setHighlight(null);
  };
  const [expanded, setExpanded] = useState(false);
  const [asideChat, setAsideChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const fullText =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?";
  const [highlight, setHighlight] = useState<{ start: number; end: number } | null>(null);

  const handleMouseUp = (e: React.MouseEvent<HTMLSpanElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(e.currentTarget);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const selected = range.toString();
    setHighlight({ start, end: start + selected.length });
    selection.removeAllRanges();
    openChat();
  };

  return (
    <MantineProvider>
      <AppShell
        padding="md"
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        aside={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened, desktop: !asideChat },
        }}
      >
        <AppShell.Header>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div>Logo</div>
        </AppShell.Header>

        <AppShell.Navbar>Navbar</AppShell.Navbar>

        <AppShell.Main style={{ overflow: "hidden" }}>
          <Text component="span" onMouseUp={handleMouseUp} style={{ display: expanded ? "none" : undefined }}>
            {highlight ? (
              <>
                {fullText.slice(0, highlight.start)}
                <Mark color="var(--mantine-color-blue-9)" style={{ color: "white" }}>
                  {fullText.slice(highlight.start, highlight.end)}
                </Mark>
                {fullText.slice(highlight.end)}
              </>
            ) : (
              fullText
            )}
          </Text>

          {expanded && chatOpened && (
            <Box style={{ height: "calc(100vh - 100px)" }}>
              <ChatPanel
                expanded
                onMinimize={() => setExpanded(false)}
                onMoveToAside={() => {
                  setAsideChat(true);
                  setExpanded(false);
                }}
                onClose={handleClose}
                messages={messages}
                setMessages={setMessages}
                input={input}
                setInput={setInput}
                cursorPos={cursorPos}
                setCursorPos={setCursorPos}
              />
            </Box>
          )}

          {!chatOpened && (
            <Affix position={{ bottom: 20, right: 20 }}>
              <ActionIcon variant="filled" aria-label="Chat" size="xl" radius="xl" onClick={openChat}>
                <IconMessageCircle />
              </ActionIcon>
            </Affix>
          )}

          <Dialog
            withBorder
            opened={chatOpened && !expanded && !asideChat}
            onClose={handleClose}
            size="lg"
            radius="md"
            p="xs"
          >
            <Box style={{ height: "500px" }}>
              <ChatPanel
                onExpand={() => setExpanded(true)}
                onMoveToAside={() => setAsideChat(true)}
                onClose={handleClose}
                messages={messages}
                setMessages={setMessages}
                input={input}
                setInput={setInput}
                cursorPos={cursorPos}
                setCursorPos={setCursorPos}
              />
            </Box>
          </Dialog>
        </AppShell.Main>
        <AppShell.Aside p="xs">
          {asideChat && (
            <ChatPanel
              onExpand={() => {
                setAsideChat(false);
                setExpanded(true);
              }}
              onClose={handleClose}
              messages={messages}
              setMessages={setMessages}
              input={input}
              setInput={setInput}
              cursorPos={cursorPos}
              setCursorPos={setCursorPos}
            />
          )}
        </AppShell.Aside>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
