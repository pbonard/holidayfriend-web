'use client';

import Image from 'next/image';
import * as stylex from '@stylexjs/stylex';
import { deletePending, retryPending, type PendingMessage } from '@/db/pending';
import { useMyId } from '@/hooks/useChat';
import PendingVideo from '@/components/chat/PendingVideo';
import VoicePlayer from '@/components/chat/VoicePlayer';
import { auth, breakpoints } from '@/styles/tokens.stylex';

// one's own message until chat answers, at the end of the chat (db/pending), dimmed: once chat answers it's a message
// and this goes. a text in its bubble, "Sending…" under it. photos and videos from the files picked, a photo opening
// full size and a video playing as sent ones do, with a thin line under them filling as the bytes go. not sent (it
// failed, or a reload stopped it), with Retry and Delete
export default function PendingMessageItem({ item }: { item: PendingMessage }) {
  const myId = useMyId();
  const failed = item.status === 'failed';
  const percent =
    item.total > 0
      ? Math.min(100, Math.round((item.sent / item.total) * 100))
      : 0;
  const what =
    item.contentType === 'text'
      ? 'message'
      : item.contentType === 'image'
        ? 'photos'
        : item.contentType === 'video'
          ? 'videos'
          : 'voice message';

  return (
    <div {...stylex.props(styles.message)}>
      <div {...stylex.props(styles.content)}>
        {item.contentType === 'text' ? (
          <p {...stylex.props(styles.bubble)}>{item.text}</p>
        ) : item.contentType === 'audio' ? (
          // the recording, still in this browser: it plays while it's sent
          item.urls.map((url) => (
            <div key={url} {...stylex.props(styles.dimmed)}>
              <VoicePlayer url={url} label="voice message" />
            </div>
          ))
        ) : (
          item.urls.map((url) =>
            item.contentType === 'image' ? (
              // opens it full size in a new tab, as a sent photo does: the file picked, still in this browser
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open photo"
                {...stylex.props(styles.link)}
              >
                {/* unoptimized: a local object url, next's image optimizer can't fetch it */}
                <Image
                  src={url}
                  alt={failed ? 'Photo not sent' : 'Photo being sent'}
                  width={240}
                  height={240}
                  unoptimized
                  {...stylex.props(styles.box, styles.image)}
                />
              </a>
            ) : (
              <PendingVideo
                key={url}
                url={url}
                label={failed ? 'Video not sent' : 'Video being sent'}
              />
            ),
          )
        )}
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
              aria-label={`Delete ${what} not sent`}
              onClick={() =>
                myId && void deletePending(myId, item.roomId, item.key)
              }
              {...stylex.props(styles.action)}
            >
              Delete
            </button>
          </div>
        ) : item.contentType === 'text' ? (
          <span role="status" {...stylex.props(styles.sending)}>
            Sending…
          </span>
        ) : (
          <div
            role="progressbar"
            aria-label={`Sending ${what}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            {...stylex.props(styles.track)}
          >
            <div {...stylex.props(styles.fill(percent))} />
          </div>
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
  // each as wide as it is, on the right
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
  // as wide as the photo, as ImageMessage's link
  link: {
    display: 'block',
    width: 'fit-content',
    maxWidth: '100%',
    borderRadius: '12px',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  // the size ImageMessage shows a photo at, so nothing moves when the message takes its place
  box: {
    display: 'block',
    maxWidth: '100%',
    borderRadius: '12px',
    // dimmed until it's kept
    opacity: 0.6,
  },
  // as ImageMessage shows it: whole, at its own shape, within 240 wide and 320 tall
  image: {
    display: 'block',
    width: 'auto',
    height: 'auto',
    maxWidth: 'min(240px, 100%)',
    maxHeight: '320px',
    backgroundColor: auth.card,
  },
  // until it's sent, as the photos are
  dimmed: {
    opacity: 0.6,
  },
  // where a kept message has its time
  sending: {
    fontSize: '12px',
    color: auth.muted,
  },
  // a thin line under them, the width of the widest
  track: {
    alignSelf: 'stretch',
    height: '3px',
    overflow: 'hidden',
    borderRadius: '2px',
    backgroundColor: auth.control,
  },
  // as wide as what's sent. the width changes as bytes go, a short transition smooths its steps
  fill: (percent: number) => ({
    width: `${percent}%`,
    height: '100%',
    backgroundColor: auth.link,
    transition: 'width 150ms linear',
  }),
  // under them, in a row: what happened, and what to do
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
