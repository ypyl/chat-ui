import { ActionIcon, Affix, Box, Dialog } from "@mantine/core";
import type { AffixProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMessageCircle } from "@tabler/icons-react";
import { ChatPanel } from "./ChatPanel";

export interface ChatWidgetProps {
  /** Title in the panel header. */
  title?: string;
  /** Where the launcher sits and the dialog opens. */
  position?: AffixProps["position"];
  /** Dialog body height. */
  dialogHeight?: number | string;
}

/**
 * The whole chat experience as one element: a floating launcher that opens a dialog. Drop it inside
 * `<ChatProvider>` above your app and it takes over nothing else — no shell, no routing, no layout.
 * For a docked panel (sidebar, split view, full page) use `<ChatPanel>` directly.
 */
export function ChatWidget({ title, position = { bottom: 20, right: 20 }, dialogHeight = "calc(50vh - 20px)" }: ChatWidgetProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Affix position={position}>
        <ActionIcon variant="filled" aria-label="Chat" size="xl" radius="xl" onClick={open}>
          <IconMessageCircle />
        </ActionIcon>
      </Affix>

      <Dialog opened={opened} onClose={close} size="lg" radius="md" p="xs">
        <Box style={{ height: dialogHeight }}>
          <ChatPanel title={title} onClose={close} />
        </Box>
      </Dialog>
    </>
  );
}
