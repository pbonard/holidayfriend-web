'use client';

import { useLayoutEffect, useRef } from 'react';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { StoredMessage } from '@/types/chat';
import StatusText from '@/components/StatusText';
import MessageItem from '@/components/chat/MessageItem';
import { timeOfId } from '@/utils';

// how close to the bottom still counts as at it: a new message then scrolls into view
const NEAR_BOTTOM = 120;

type MessageListProps = {
  // oldest first, the latest pages of the chat. undefined while the first is read
  messages: StoredMessage[] | undefined;
  // older ones are kept too, onLoadEarlier reads the page before
  hasEarlier: boolean;
  onLoadEarlier: () => Promise<void>;
  // the person logged in, whose messages are on the right. undefined until it's loaded
  myId: string | undefined;
  // the other person's, for the list's label
  name: string;
};

// a chat's messages, the latest at the bottom, scrolling on their own. a page shows at first, earlier ones on asking
export default function MessageList({
  messages,
  hasEarlier,
  onLoadEarlier,
  myId,
  name,
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

  // earlier messages go above what's in view without moving it
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || heightBeforeRef.current === null) return;
    scroller.scrollTop += scroller.scrollHeight - heightBeforeRef.current;
    heightBeforeRef.current = null;
  }, [firstId]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    atBottomRef.current =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <
      NEAR_BOTTOM;
  };

  const showEarlier = () => {
    heightBeforeRef.current = scrollerRef.current?.scrollHeight ?? null;
    void onLoadEarlier();
  };

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      {...stylex.props(styles.scroller)}
    >
      {messages === undefined ? null : messages.length === 0 ? (
        <StatusText xstyle={styles.empty}>
          No messages here. A chat starts when an invite is accepted.
        </StatusText>
      ) : (
        <ol aria-label={`Messages with ${name}`} {...stylex.props(styles.list)}>
          {hasEarlier && (
            <li {...stylex.props(styles.earlier)}>
              <button
                type="button"
                onClick={showEarlier}
                {...stylex.props(styles.earlierButton)}
              >
                Show earlier messages
              </button>
            </li>
          )}
          {messages.map((message, index) => {
            const before = messages[index - 1];
            return (
              <li key={message.id}>
                <MessageItem
                  message={message}
                  mine={message.fromId === myId}
                  isDayFirst={
                    !before ||
                    timeOfId(before.id).toDateString() !==
                      timeOfId(message.id).toDateString()
                  }
                />
              </li>
            );
          })}
        </ol>
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
  earlier: {
    display: 'flex',
    justifyContent: 'center',
  },
  earlierButton: {
    paddingBlock: '6px',
    paddingInline: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '999px',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    color: auth.muted,
    fontFamily: 'inherit',
    fontSize: '13px',
    cursor: 'pointer',
  },
});
