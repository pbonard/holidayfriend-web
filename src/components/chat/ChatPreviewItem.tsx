'use client';

import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { previewOf } from '@/db/message';
import { useMyId } from '@/hooks/useChat';
import { useGetProfile } from '@/hooks/useProfile';
import { auth } from '@/styles/tokens.stylex';
import type { ChatPreview } from '@/types/chat';
import { chatPath } from '@/utils';
import { timeAgo, timeOfId } from '@/utils/time';

type ChatPreviewItemProps = {
  preview: ChatPreview;
  // the chat open beside the list
  open: boolean;
  // when "1m ago" is from, the list's clock. null while prerendering, the time shows once in the browser
  now: Date | null;
};

// a chat in the list: the other person, the latest message and when. the latest message bold and bright while
// something's unread, grey once it's read. the name is
// their profile's, from holidayfriend-server: my-server's chat doesn't know holidayfriend's names
export default function ChatPreviewItem({ preview, open, now }: ChatPreviewItemProps) {
  const myId = useMyId();
  const profile = useGetProfile(preview.roomId);
  const name = profile.data?.name || (profile.isPending ? '' : 'Someone');
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const sent = timeOfId(preview.last.id);
  const mine = preview.last.fromId === myId;

  return (
    <Link
      href={chatPath(preview.roomId)}
      aria-current={open ? 'page' : undefined}
      {...stylex.props(styles.item, open && styles.open)}
    >
      <span aria-hidden="true" {...stylex.props(styles.avatar)}>
        {initial}
      </span>
      <span {...stylex.props(styles.text)}>
        <span {...stylex.props(styles.row)}>
          <span {...stylex.props(styles.name)}>{name}</span>
          {now && (
            <time dateTime={sent.toISOString()} {...stylex.props(styles.time)}>
              {timeAgo(sent, now)}
            </time>
          )}
        </span>
        <span {...stylex.props(styles.row)}>
          <span
            {...stylex.props(styles.last, preview.unread && styles.lastUnread)}
          >
            {/* the bold says it to the eye, this to a screen reader */}
            {preview.unread && (
              <span {...stylex.props(styles.visuallyHidden)}>Unread: </span>
            )}
            {mine && 'You: '}
            {previewOf(preview.last)}
          </span>
        </span>
      </span>
    </Link>
  );
}

const styles = stylex.create({
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBlock: '10px',
    paddingInline: '12px',
    // a line around the open one only, as the sidebar's current page. always there and unseen on the others, so
    // nothing moves between them
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '12px',
    color: auth.text,
    textDecoration: 'none',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '-2px',
  },
  // as the sidebar's current page (NavigationList's itemActive)
  open: {
    borderColor: auth.border,
    backgroundColor: auth.control,
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: auth.control,
    fontSize: '17px',
    fontWeight: 700,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flexGrow: 1,
    minWidth: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '16px',
    fontWeight: 700,
  },
  time: {
    flexShrink: 0,
    fontSize: '13px',
    color: auth.muted,
  },
  // one line, cut with an ellipsis
  last: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    color: auth.muted,
  },
  // something unread: bold and bright. read ones stay grey (last)
  lastUnread: {
    color: auth.text,
    fontWeight: 700,
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
});
