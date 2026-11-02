import { Button, Skeleton, Stack } from "@mantine/core";
import { memo } from "react";
import { isDeleted, isSameMessage, turnAnswers, turnReasoning } from "../store";
import type { Turn } from "../store";
import { MessageBubble } from "./MessageBubble";
import { ReasoningBlock } from "./ReasoningBlock";

export interface ChatTurnProps {
  turn: Turn;
  index: number;
  isLast: boolean;
  viewportHeight: number;
  registerTurn: (index: number, element: HTMLDivElement | null) => void;
  onSaveEdit: (messageId: string, text: string) => void;
  onDeleteTurn: (messageId: string) => void;
  onRestoreTurn: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
}

function ChatTurnImpl({
  turn,
  index,
  isLast,
  viewportHeight,
  registerTurn,
  onSaveEdit,
  onDeleteTurn,
  onRestoreTurn,
  onRegenerate,
}: ChatTurnProps) {
  return (
    <Stack
      ref={(element) => registerTurn(index, element)}
      gap="xs"
      style={{
        minHeight: isLast ? viewportHeight || "100%" : undefined,
        justifyContent: "flex-start",
        paddingTop: "var(--mantine-spacing-xs)",
      }}
    >
      {isDeleted(turn.user) ? (
        <Button variant="transparent" size="xs" p={4} onClick={() => onRestoreTurn(turn.user.id)}>
          Restore deleted messages
        </Button>
      ) : (
        <>
          <Stack gap={2} align="flex-end">
            <MessageBubble message={turn.user} onSaveEdit={onSaveEdit} onDeleteTurn={onDeleteTurn} />
          </Stack>
          <Stack gap={2} align="flex-start">
            {turn.replies.length === 0 ? (
              <Skeleton height={48} />
            ) : (
              <>
                <ReasoningBlock text={turnReasoning(turn)} />
                {turnAnswers(turn).map((reply) => (
                  <MessageBubble
                    key={reply.id}
                    message={reply}
                    onSaveEdit={onSaveEdit}
                    onDeleteTurn={onDeleteTurn}
                    onRegenerate={reply.role === "assistant" ? onRegenerate : undefined}
                  />
                ))}
              </>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}

/**
 * One question and its replies. Streaming replaces the transcript on every token, which rebuilds
 * `turn` and every callback in the panel, so memoising on values rather than identities is what
 * keeps a long conversation from re-rendering and re-parsing all of its markdown on each token.
 */
export const ChatTurn = memo(ChatTurnImpl, (a, b) => {
  if (
    a.index !== b.index ||
    a.isLast !== b.isLast ||
    a.viewportHeight !== b.viewportHeight ||
    a.registerTurn !== b.registerTurn ||
    a.onSaveEdit !== b.onSaveEdit ||
    a.onDeleteTurn !== b.onDeleteTurn ||
    a.onRestoreTurn !== b.onRestoreTurn ||
    a.onRegenerate !== b.onRegenerate ||
    !isSameMessage(a.turn.user, b.turn.user) ||
    a.turn.replies.length !== b.turn.replies.length
  ) {
    return false;
  }

  for (let i = 0; i < a.turn.replies.length; i++) {
    if (!isSameMessage(a.turn.replies[i], b.turn.replies[i])) return false;
  }
  return true;
});
