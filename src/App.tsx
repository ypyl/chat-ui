import { ActionIcon, Affix, AppShell, Box, Burger, Dialog, Text, Portal, Container, Switch } from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { ChatPanel } from "./ChatPanel";
import { IconMessageCircle, IconQuote } from "@tabler/icons-react";
import { useSelectionEndpoint } from "./useSelectionEndpoint";
import { useSelectionEnabled } from "./store/chatStore";

const fullText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?\nLorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt laborum. Nihil?";

type ChatView = "affix" | "dialog" | "expanded" | "aside";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [chatView, setChatView] = useState<ChatView>("affix");
  const [textToExplain, setTextToExplain] = useState<string | null>(null);
  const textElementRef = useRef<HTMLDivElement>(null);
  const { selectionEnabled, setSelectionEnabled } = useSelectionEnabled();
  const endpoint = useSelectionEndpoint({ ignoreSelector: "button", containerRef: textElementRef, enabled: selectionEnabled });

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
      if (chatView === "affix") {
        setChatView("dialog");
      }
      if (selection) {
        selection.removeAllRanges();
      }
    }
  };

  const showButton = endpoint !== null;

  const chatPanel = (
    <ChatPanel
      viewMode={chatView}
      onExpand={handleExpand}
      onMinimize={handleMinimize}
      onMoveToAside={handleMoveToAside}
      onMoveToDialog={handleMinimize}
      onClose={handleCloseChat}
      referencedText={textToExplain}
      onResetReferencedText={() => setTextToExplain(null)}
    />
  );

  return (
    <>
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
          <Switch
            checked={selectionEnabled}
            onChange={(e) => setSelectionEnabled(e.currentTarget.checked)}
            label="Selection"
            labelPosition="left"
            size="sm"
            style={{ marginRight: 16 }}
          />
        </AppShell.Header>

        <AppShell.Main style={{ overflow: "hidden" }}>
          <Container size="responsive">
            {chatView !== "expanded" && <Text ref={textElementRef}>{fullText}</Text>}

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
              <Container style={{ height: "calc(100vh - 100px)" }}>
                {chatPanel}
              </Container>
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
        <AppShell.Aside p="xs">
          {chatView === "aside" && chatPanel}
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
    </>
  );
}

export default App;
