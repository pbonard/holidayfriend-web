'use client';

import * as stylex from '@stylexjs/stylex';
import { deletePending, retryPending, type PendingMessage } from '@/db/pending';
import { useMyId } from '@/hooks/useChat';
import { auth, breakpoints } from '@/styles/tokens.stylex';

// one's own message until chat answers, at the end of the chat (db/pending), dimmed: once chat answers it's a message
// and this goes. the text in its bubble, "Sending…" under it. not sent (it failed, or a reload stopped it), with Retry
// and Delete
export default function PendingMessageItem({ item }: { item: PendingMessage }) {
  const myId = useMyId();
  const failed = item.status === 'failed';

  return (
    <div {...stylex.props(styles.message)}>
      <div {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.bubble)}>{item.text}</p>
        {failed ? (
          <div {...stylex.props(styles.failed)}>
            <span role="status" {...stylex.props(styles.notSent)}>
              Not sent
            </span>
            <button
              type="button"
              disabled={!myId}
              onClick={() => myId && retryPending(myId, item.key)}
              {...stylex.props(styles.action)}
            >
              Retry
            </button>
            <button
              type="button"
              disabled={!myId}
              aria-label="Delete message not sent"
              onClick={() =>
                myId && void deletePending(myId, item.roomId, item.key)
              }
              {...stylex.props(styles.action)}
            >
              Delete
            </button>
          </div>
        ) : (
          <span role="status" {...stylex.props(styles.sending)}>
            Sending…
          </span>
        )}
      </div>
    </div>
  );
}

const styles = stylex.create({
  // on the right, as one's own messages are
  message: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  // as wide as its text, on the right
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    maxWidth: { default: '85%', [breakpoints.desktop]: '70%' },
  },
  // as MessageItem's own bubble, dimmed until it's kept
  bubble: {
    paddingBlock: '10px',
    paddingInline: '16px',
    borderRadius: '16px',
    borderBottomRightRadius: '4px',
    backgroundColor: auth.accent,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    fontSize: '16px',
    lineHeight: 1.45,
    opacity: 0.6,
  },
  // where a kept message has its time
  sending: {
    fontSize: '12px',
    color: auth.muted,
  },
  // under it, in a row: what happened, and what to do
  failed: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
  },
  notSent: {
    color: auth.danger,
  },
  action: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: auth.link, ':hover': auth.text },
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    textDecoration: { default: 'none', ':hover': 'underline' },
  },
});
