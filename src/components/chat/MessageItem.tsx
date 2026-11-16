import * as stylex from '@stylexjs/stylex';
import { isBlockEvent, previewOf } from '@/db/message';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { MessagingResponse } from '@/types/chat';
import ImageMessage from '@/components/chat/ImageMessage';
import VideoMessage from '@/components/chat/VideoMessage';
import VoiceMessage from '@/components/chat/VoiceMessage';
import { dayLabel, timeOfId } from '@/utils/time';

type MessageItemProps = {
  message: MessagingResponse;
  // one's own: on the right, in the accent
  mine: boolean;
  // the first of its day: the day's pill goes above it
  isDayFirst: boolean;
  // the other person's, for a block's pill
  name: string;
  // while messages are chosen to delete: whether this one is, and a click anywhere on it toggles it
  selection?: { selected: boolean; onToggle: () => void };
};

// a message (its text, or its photos or videos) with the time it was sent under it, after its day's pill when it's
// the day's first. while choosing, a round check on the left, and the message a button that toggles it: its photos
// don't open then. one's own blocking or unblocking is a pill in the middle, as mobile's
export default function MessageItem({
  message,
  mine,
  isDayFirst,
  name,
  selection,
}: MessageItemProps) {
  const sent = timeOfId(message.id);
  const dayPill = isDayFirst && (
    <div {...stylex.props(styles.day)}>
      <span {...stylex.props(styles.dayLabel)}>{dayLabel(sent)}</span>
    </div>
  );
  if (isBlockEvent(message)) {
    return (
      <>
        {dayPill}
        <div {...stylex.props(styles.event)}>
          <span {...stylex.props(styles.dayLabel)}>
            {message.contentType === 'block' ? 'You blocked' : 'You unblocked'}{' '}
            {name || 'them'}
          </span>
        </div>
      </>
    );
  }
  const content = (
    <div {...stylex.props(styles.message, mine && styles.mine)}>
      {message.contentType === 'image' ||
      message.contentType === 'video' ||
      message.contentType === 'audio' ? (
        // no bubble: the photos, videos or recording themselves, one under another
        <div {...stylex.props(styles.media, mine && styles.mediaMine)}>
          {message.contentType === 'audio' ? (
            // one recording
            <VoiceMessage filename={message.contents[0]} />
          ) : (
            message.contents.map((filename) =>
              message.contentType === 'image' ? (
                <ImageMessage key={filename} filename={filename} />
              ) : (
                <VideoMessage key={filename} filename={filename} />
              ),
            )
          )}
        </div>
      ) : (
        <p
          {...stylex.props(
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleTheirs,
          )}
        >
          {/* a text's, or an accepted invite's ("accept", holidayfriend-server's) */}
          {message.contents[0] ?? ''}
        </p>
      )}
      <time dateTime={sent.toISOString()} {...stylex.props(styles.time)}>
        {sent.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </time>
    </div>
  );
  return (
    <>
      {dayPill}
      {selection ? (
        <div {...stylex.props(styles.selectable)}>
          <span
            aria-hidden="true"
            {...stylex.props(
              styles.check,
              selection.selected && styles.checked,
            )}
          >
            {selection.selected && (
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
          <div {...stylex.props(styles.selectableMessage)}>{content}</div>
          <button
            type="button"
            role="checkbox"
            aria-checked={selection.selected}
            aria-label={previewOf(message)}
            onClick={selection.onToggle}
            {...stylex.props(styles.toggle)}
          />
        </div>
      ) : (
        content
      )}
    </>
  );
}

const styles = stylex.create({
  day: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '8px',
    marginBottom: '20px',
  },
  // a block's pill, as the day's, between the messages
  event: {
    display: 'flex',
    justifyContent: 'center',
  },
  dayLabel: {
    paddingBlock: '4px',
    paddingInline: '12px',
    borderRadius: '999px',
    backgroundColor: auth.card,
    color: auth.muted,
    fontSize: '12px',
    fontWeight: 600,
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
  },
  mine: {
    alignItems: 'flex-end',
  },
  // with the line breaks it was written with
  bubble: {
    maxWidth: { default: '85%', [breakpoints.desktop]: '70%' },
    paddingBlock: '10px',
    paddingInline: '16px',
    borderRadius: '16px',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    fontSize: '16px',
    lineHeight: 1.45,
  },
  // each photo or video as wide as it is, lined up on the side its message is on
  media: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    maxWidth: { default: '85%', [breakpoints.desktop]: '70%' },
  },
  mediaMine: {
    alignItems: 'flex-end',
  },
  bubbleMine: {
    backgroundColor: auth.accent,
    borderBottomRightRadius: '4px',
  },
  bubbleTheirs: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    backgroundColor: auth.card,
    borderBottomLeftRadius: '4px',
  },
  time: {
    fontSize: '12px',
    color: auth.muted,
  },
  // the check, then the message, as wide as the list
  selectable: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  selectableMessage: {
    flexGrow: 1,
    minWidth: 0,
  },
  check: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '22px',
    height: '22px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '50%',
    color: auth.hero,
  },
  checked: {
    borderColor: auth.link,
    backgroundColor: auth.link,
  },
  // over the whole row, so a click anywhere toggles it and reaches no link under it
  toggle: {
    position: 'absolute',
    inset: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: '12px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
});
