'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { breakpoints } from '@/styles/tokens.stylex';
import type { Message } from '@/types/chat';
import type { PendingMessage } from '@/db/pending';
import { useStartReached } from '@/hooks/useEndReached';
import StatusText from '@/components/StatusText';
import MessageItem from '@/components/chat/MessageItem';
import PendingMessageItem from '@/components/chat/PendingMessageItem';
import { sameDay, timeOfId } from '@/utils/time';

// how close to the bottom still counts as at it: a new message then scrolls into view
const NEAR_BOTTOM = 120;

type MessageListProps = {
  // oldest first, the latest pages of the chat. undefined while the first is read
  messages: Message[] | undefined;
  // older ones are kept too, onLoadEarlier reads the page before
  hasEarlier: boolean;
  onLoadEarlier: () => Promise<void>;
  // one's own messages on their way or not sent, after the messages (db/pending)
  pending: readonly PendingMessage[];
  // the person logged in, whose messages are on the right. undefined until it's loaded
  myId: string | undefined;
  // the other person's, for the list's label
  name: string;
  // while messages are chosen to delete: those chosen, and choosing or unchoosing one. not one's own messages on
  // their way, which have their own Delete
  selection?: { ids: ReadonlySet<string>; onToggle: (id: string) => void };
};

// a chat's messages, the latest at the bottom, scrolling on their own. a page shows at first, earlier ones as its top
// scrolls near
export default function MessageList({
  messages,
  hasEarlier,
  onLoadEarlier,
  pending,
  myId,
  name,
  selection,
}: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // whether it was at the bottom before the latest change, so a new message keeps it there
  const atBottomRef = useRef(true);
  // the height before showing earlier messages, to keep what was in view where it was
  const heightBeforeRef = useRef<number | null>(null);

  const lastId = messages?.at(-1)?.id;
  const lastIsMine = messages?.at(-1)?.fromId === myId;
  const firstId = messages?.[0]?.id;

  // to the bottom at first, and as messages come while it's there, or when one's own is sent
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (atBottomRef.current || lastIsMine) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [lastId, lastIsMine]);

  // to the bottom as one's own messages start on their way
  const pendingCount = pending.length;
  const pendingBefore = useRef(pendingCount);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller && pendingCount > pendingBefore.current) {
      scroller.scrollTop = scroller.scrollHeight;
    }
    pendingBefore.current = pendingCount;
  }, [pendingCount]);

  // earlier messages go above what's in view without moving it
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || heightBeforeRef.current === null) return;
    scroller.scrollTop += scroller.scrollHeight - heightBeforeRef.current;
    heightBeforeRef.current = null;
  }, [firstId]);

  // earlier ones as the top comes near (useStartReached), one page at a time. one that fails isn't asked again, so a
  // broken IndexedDB doesn't ask on and on
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [earlierFailed, setEarlierFailed] = useState(false);
  const showEarlier = useCallback(async () => {
    heightBeforeRef.current = scrollerRef.current?.scrollHeight ?? null;
    setLoadingEarlier(true);
    try {
      await onLoadEarlier();
    } catch {
      heightBeforeRef.current = null;
      setEarlierFailed(true);
    } finally {
      setLoadingEarlier(false);
    }
  }, [onLoadEarlier]);
  const { boxRef, startRef } = useStartReached({
    hasNextPage: hasEarlier,
    isFetchingNextPage: loadingEarlier,
    isFetchNextPageError: earlierFailed,
    fetchNextPage: showEarlier,
  });
  // the box is both: scrollerRef for the scrolling above, boxRef for what's watched in
  const setScroller = useCallback(
    (scroller: HTMLDivElement | null) => {
      scrollerRef.current = scroller;
      boxRef(scroller);
    },
    [boxRef],
  );

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    atBottomRef.current =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <
      NEAR_BOTTOM;
  };

  return (
    <div
      ref={setScroller}
      onScroll={handleScroll}
      {...stylex.props(styles.scroller)}
    >
      {messages === undefined ? null : messages.length === 0 ? (
        <StatusText xstyle={styles.empty}>
          No messages here. A chat starts when an invite is accepted.
        </StatusText>
      ) : (
        <>
          {/* what's watched: earlier messages as it scrolls near. outside the list, so it adds no gap */}
          <div ref={startRef} aria-hidden="true" />
          <ol
            aria-label={`Messages with ${name}`}
            {...stylex.props(styles.list)}
          >
            {messages.map((message, index) => {
              const before = messages[index - 1];
              return (
                <li key={message.id}>
                  <MessageItem
                    message={message}
                    mine={message.fromId === myId}
                    isDayFirst={
                      !before ||
                      !sameDay(timeOfId(before.id), timeOfId(message.id))
                    }
                    selection={
                      selection && {
                        selected: selection.ids.has(message.id),
                        onToggle: () => selection.onToggle(message.id),
                      }
                    }
                  />
                </li>
              );
            })}
            {pending.map((item) => (
              <li key={item.key}>
                <PendingMessageItem item={item} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

const styles = stylex.create({
  scroller: {
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
    // a phone's bounces at its ends within itself, without moving the page around it. a desktop's doesn't bounce
    overscrollBehavior: { default: 'contain', [breakpoints.desktop]: 'none' },
    paddingBlock: '20px',
    paddingInline: { default: '16px', [breakpoints.desktop]: '24px' },
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    listStyle: 'none',
  },
  empty: {
    textAlign: 'center',
  },
});
