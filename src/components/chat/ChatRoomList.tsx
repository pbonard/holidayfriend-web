'use client';

import { Suspense, useEffect, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useChatPreviews } from '@/hooks/useChat';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { auth, breakpoints, chatRoomMarker } from '@/styles/tokens.stylex';
import StatusText from '@/components/StatusText';
import ChatPreviewItem from '@/components/chat/ChatPreviewItem';

// how often "1m ago" and such are worked out again
const MINUTE = 60 * 1000;

// the list's clock, a minute at a time. none while prerendering, which mustn't read the time: it would be the
// build's. it's read anew as a list starts watching it, so one opened later doesn't show an old time
let minute: Date | null = null;

function subscribeMinute(listener: () => void) {
  minute = new Date();
  listener();
  const timer = setInterval(() => {
    minute = new Date();
    listener();
  }, MINUTE);
  return () => clearInterval(timer);
}

function getMinute() {
  minute ??= new Date();
  return minute;
}

function getServerMinute() {
  return null;
}

// the chats kept in this browser, the newest first. the open one's marked: its id is known while prerendering only
// on /chats, a chat's page has it only at request time, so the list shows without it marked until then
export default function ChatRoomList() {
  const router = useRouter();
  const myProfile = useMyProfileBrief();

  const notLoggedIn = myProfile.error instanceof NotLoggedInError;
  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);

  return (
    <aside aria-label="Chats" {...stylex.props(styles.column)}>
      <h1 {...stylex.props(styles.title)}>Chats</h1>
      <Suspense fallback={<ChatRoomItems openRoomId={null} />}>
        <CurrentChatItems />
      </Suspense>
    </aside>
  );
}

function CurrentChatItems() {
  const { userId } = useParams<{ userId?: string }>();
  return <ChatRoomItems openRoomId={userId ?? null} />;
}

function ChatRoomItems({ openRoomId }: { openRoomId: string | null }) {
  const previews = useChatPreviews();
  const now = useSyncExternalStore(subscribeMinute, getMinute, getServerMinute);

  // nothing while they're read from IndexedDB, a moment
  if (previews === null) {
    return null;
  }
  if (previews.length === 0) {
    return (
      <StatusText xstyle={styles.empty}>
        No chats yet. Accept an invite, or say hi to someone, to start one.
      </StatusText>
    );
  }

  return (
    <ul {...stylex.props(styles.list)}>
      {previews.map((preview) => (
        <li key={preview.roomId}>
          <ChatPreviewItem
            preview={preview}
            open={preview.roomId === openRoomId}
            now={now}
          />
        </li>
      ))}
    </ul>
  );
}

// the [stylex.when.siblingAfter('[data-chat-room]', chatRoomMarker)] keys: an open chat beside the list, which a
// phone shows alone. written out each time: stylex compiles the call only where it's a key of stylex.create
const styles = stylex.create({
  // the whole width on a phone, a column on a desktop. it scrolls on its own
  column: {
    display: {
      default: 'flex',
      [stylex.when.siblingAfter('[data-chat-room]', chatRoomMarker)]: 'none',
      [breakpoints.desktop]: {
        default: 'flex',
        [stylex.when.siblingAfter('[data-chat-room]', chatRoomMarker)]: 'flex',
      },
    },
    flexDirection: 'column',
    flexShrink: 0,
    width: { default: '100%', [breakpoints.desktop]: '300px' },
    minHeight: 0,
    overflowY: 'auto',
    // as MessageList's: a phone's bounces within itself, a desktop's doesn't
    overscrollBehavior: { default: 'contain', [breakpoints.desktop]: 'none' },
    paddingBlock: { default: '20px', [breakpoints.desktop]: '28px' },
    paddingInline: '8px',
    borderRightWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderRightStyle: 'solid',
    borderRightColor: auth.cardBorder,
  },
  title: {
    paddingInline: '12px',
    marginBottom: '12px',
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.03em',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    listStyle: 'none',
  },
  empty: {
    paddingInline: '12px',
    fontSize: '15px',
    lineHeight: 1.45,
  },
});
