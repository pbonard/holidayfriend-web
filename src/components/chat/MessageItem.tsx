import * as stylex from '@stylexjs/stylex';
import { textOf } from '@/db/message';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { StoredMessage } from '@/types/chat';
import { timeOfId } from '@/utils';

type MessageItemProps = {
  message: StoredMessage;
  // one's own: on the right, in the accent
  mine: boolean;
  // the first of its day: the day's pill goes above it
  isDayFirst: boolean;
};

// a message with the time it was sent under it, after its day's pill when it's the day's first
export default function MessageItem({ message, mine, isDayFirst }: MessageItemProps) {
  const sent = timeOfId(message.id);
  return (
    <>
      {isDayFirst && (
        <div {...stylex.props(styles.day)}>
          <span {...stylex.props(styles.dayLabel)}>{dayLabel(sent)}</span>
        </div>
      )}
      <div {...stylex.props(styles.message, mine && styles.mine)}>
        <p {...stylex.props(styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs)}>
          {textOf(message)}
        </p>
        <time dateTime={sent.toISOString()} {...stylex.props(styles.time)}>
          {sent.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </time>
      </div>
    </>
  );
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

// "Today", "Yesterday", then the date: "Mon, Nov 10", with the year when it isn't this one
function dayLabel(date: Date, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

const styles = stylex.create({
  day: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '8px',
    marginBottom: '20px',
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
});
