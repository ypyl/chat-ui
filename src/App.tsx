import { ActionIcon, Affix, AppShell, Box, Burger, Dialog, Text, Container, Button, Portal } from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Link } from "wouter";
import { ChatPanel } from "./ChatPanel";
import { ChatProvider } from "./ChatContext";
import { IconMessageCircle, IconQuote } from "@tabler/icons-react";
import { useSelectionRects } from "./useSelectionRects";
import { useSelectionEndPoint } from "./useSelectionEndPoint";

const fullText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?";

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
  const [textToExplain, setTextToExplain] = useState<string | null>(null);
  const rects = useSelectionRects({ ignoreSelector: "button" });
  const endpoint = useSelectionEndPoint(rects);

  const handleExplainClick = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (text) {
      openChat();
      setTextToExplain(text);
      if (selection) {
        selection.removeAllRanges();
      }
    }
  };

  const showButton = rects.length > 0;

  return (
    <ChatProvider>
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
            {!(expanded && chatOpened) && <Text>{fullText}</Text>}

            {endpoint && showButton && (
              <Portal>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconQuote size={16} />}
                  style={{
                    position: "fixed",
                    left: `${endpoint.x + 8}px`,
                    top: `${endpoint.y + 8}px`,
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
              referencedText={textToExplain}
              onResetReferencedText={() => setTextToExplain(null)}
            />
          )}
        </AppShell.Aside>
      </AppShell>
    </ChatProvider>
  );
}

export default App;
