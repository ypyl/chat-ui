import { ActionIcon, Affix, AppShell, Box, Burger, Dialog, MantineProvider, Text } from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { IconMessageCircle } from "@tabler/icons-react";
function App() {
  const [opened, { toggle }] = useDisclosure();
  const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure();
  const handleClose = () => { closeChat(); setExpanded(false); };
  const [expanded, setExpanded] = useState(false);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
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
      >
        <AppShell.Header>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div>Logo</div>
        </AppShell.Header>

        <AppShell.Navbar>Navbar</AppShell.Navbar>

        <AppShell.Main>
          <Text onMouseUp={handleMouseUp} style={{ display: expanded ? "none" : undefined }}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde provident eos fugiat id necessitatibus magni
            ducimus molestias. Placeat, consequatur. Quisquam, quae magnam perspiciatis excepturi iste sint itaque sunt
            laborum. Nihil?
          </Text>

          {expanded && chatOpened && (
            <Box style={{ height: "calc(100vh - 100px)", padding: "var(--mantine-spacing-md)" }}>
              <ChatPanel expanded onMinimize={() => setExpanded(false)} onClose={handleClose} />
            </Box>
          )}

          {!chatOpened && (
            <Affix position={{ bottom: 20, right: 20 }}>
              <ActionIcon variant="filled" aria-label="Chat" size="xl" radius="xl" onClick={openChat}>
                <IconMessageCircle/>
              </ActionIcon>
            </Affix>
          )}

          <Dialog withBorder opened={chatOpened && !expanded} onClose={handleClose} size="lg" radius="md" p="xs">
            <Box style={{ height: "500px" }}>
              <ChatPanel onExpand={() => setExpanded(true)} onClose={handleClose} />
            </Box>
          </Dialog>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
