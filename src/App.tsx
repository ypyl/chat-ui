import { ActionIcon, Affix, AppShell, Box, Burger, Dialog, Text, Container, Button, Portal } from "@mantine/core";
import "@mantine/core/styles.css";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Link } from "wouter";
import { ChatPanel } from "./ChatPanel";
import type { Message } from "./ChatPanel";
import { IconMessageCircle, IconQuote } from "@tabler/icons-react";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure();
  const handleClose = () => {
    closeChat();
    setExpanded(false);
    setAsideChat(false);
  };
  const [expanded, setExpanded] = useState(false);
  const [asideChat, setAsideChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const fullText =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?";

  const [selectionData, setSelectionData] = useState<{
    position: { bottom: number; left: number } | null;
    text: string;
  }>({
    position: null,
    text: "",
  });
  const [textToExplain, setTextToExplain] = useState<string | null>(null);
  const [popupOpened, setPopupOpened] = useState(false);
  const popupRef = useClickOutside(() => setPopupOpened(false));

  const handleExplainClick = () => {
    if (selectionData.text) {
      openChat();
      setPopupOpened(false);
      setTextToExplain(selectionData.text);
    }
  };

  const handleTextSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionData({
          position: {
            bottom: rect.top + window.scrollY - 45,
            left: rect.left + rect.width / 2 + window.scrollX,
          },
          text: selection.toString().trim(),
        });
        setPopupOpened(true);
      }
    }, 10);
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      withBorder={false}
      aside={{
        width: { sm: 200, md: 300, lg: 400, xl: 500 },
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: !asideChat },
      }}
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <div>Logo</div>
        <Link to="/selection" style={{ marginLeft: "auto", marginRight: 16 }}>
          Text Selection Demo
        </Link>
      </AppShell.Header>

      <AppShell.Main style={{ overflow: "hidden" }}>
        <Container size="responsive">
          {!(expanded && chatOpened) && <Text onMouseUp={handleTextSelection}>{fullText}</Text>}

          {popupOpened && selectionData.position && (
            <Portal>
              <Box>
                <Button
                  ref={popupRef}
                  variant="light"
                  size="xs"
                  leftSection={<IconQuote size={16} />}
                  style={{
                    position: "fixed",
                    top: selectionData.position.bottom,
                    left: selectionData.position.left,
                    transform: "translateX(-50%)",
                    zIndex: 1000,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExplainClick();
                  }}
                >
                  Explain
                </Button>
              </Box>
            </Portal>
          )}

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
                referencedText={textToExplain}
                onResetReferencedText={() => setTextToExplain(null)}
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
            <Box style={{ height: "calc(50vh - 20px)" }}>
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
                referencedText={textToExplain}
                onResetReferencedText={() => setTextToExplain(null)}
              />
            </Box>
          </Dialog>
        </Container>
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
            referencedText={textToExplain}
            onResetReferencedText={() => setTextToExplain(null)}
          />
        )}
      </AppShell.Aside>
    </AppShell>
  );
}

export default App;
