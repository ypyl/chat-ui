import { ActionIcon, Affix, AppShell, Box, Burger, Dialog, Text, Container, Portal } from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { ChatPanel } from "./ChatPanel";
import { ChatProvider } from "./context/ChatProvider";
import { IconMessageCircle, IconQuote } from "@tabler/icons-react";
import { useSelectionRects } from "./useSelectionRects";
import { useSelectionEndPoint } from "./useSelectionEndPoint";

const fullText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?";

type ChatView = "affix" | "dialog" | "expanded" | "aside";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [chatView, setChatView] = useState<ChatView>("affix");
  const [textToExplain, setTextToExplain] = useState<string | null>(null);
  const rects = useSelectionRects({ ignoreSelector: "button" });
  const endpoint = useSelectionEndPoint(rects);

  const asideRef = useRef<HTMLDivElement>(null);
  const [asidePortalContainer, setAsidePortalContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatView === "aside") {
      setAsidePortalContainer(asideRef.current);
    } else {
      setAsidePortalContainer(null);
    }
  }, [chatView]);

  const handleOpenChat = () => setChatView("dialog");
  const handleCloseChat = () => setChatView("affix");
  const handleExpand = () => setChatView("expanded");
  const handleMoveToAside = () => setChatView("aside");
  const handleMinimize = () => setChatView("dialog");

  const handleExplainClick = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (text) {
      setTextToExplain(text);
      setChatView("dialog");
      if (selection) {
        selection.removeAllRanges();
      }
    }
  };

  const showButton = rects.length > 0;

  const chatPanel = (
    <ChatPanel
      expanded={chatView === "expanded"}
      onExpand={handleExpand}
      onMinimize={handleMinimize}
      onMoveToAside={handleMoveToAside}
      onClose={handleCloseChat}
      referencedText={textToExplain}
      onResetReferencedText={() => setTextToExplain(null)}
    />
  );

  return (
    <ChatProvider>
      <AppShell
        padding="md"
        header={{ height: 60 }}
        withBorder={false}
        aside={{
          width: { sm: 200, md: 300, lg: 400, xl: 500 },
          breakpoint: "sm",
          collapsed: { mobile: true, desktop: chatView !== "aside" },
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
            {chatView !== "expanded" && <Text>{fullText}</Text>}

            {endpoint && showButton && (
              <Portal>
                <ActionIcon
                  variant="light"
                  size="md"
                  aria-label="Explain selected text"
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
                  <IconQuote size={16} />
                </ActionIcon>
              </Portal>
            )}

            {chatView === "expanded" && (
              <Box style={{ height: "calc(100vh - 100px)" }}>
                {chatPanel}
              </Box>
            )}

            {chatView === "affix" && (
              <Affix position={{ bottom: 20, right: 20 }}>
                <ActionIcon variant="filled" aria-label="Chat" size="xl" radius="xl" onClick={handleOpenChat}>
                  <IconMessageCircle />
                </ActionIcon>
              </Affix>
            )}
          </Container>
        </AppShell.Main>
        <AppShell.Aside p="xs" ref={asideRef}>
          {asidePortalContainer && chatView === "aside" && createPortal(chatPanel, asidePortalContainer)}
        </AppShell.Aside>
      </AppShell>

      <Dialog
        opened={chatView === "dialog"}
        onClose={handleCloseChat}
        size="lg"
        radius="md"
        p="xs"
      >
        <Box style={{ height: "calc(50vh - 20px)" }}>
          {chatPanel}
        </Box>
      </Dialog>
    </ChatProvider>
  );
}

export default App;
