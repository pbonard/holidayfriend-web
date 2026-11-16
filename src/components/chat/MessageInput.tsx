'use client';

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import * as stylex from '@stylexjs/stylex';
import { sendText } from '@/db/pending';
import { useMyId } from '@/hooks/useChat';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import SendIcon from '@/components/icons/SendIcon';
import { fitToContent } from '@/utils';
import { readDraft, saveDraft, subscribeDraft } from '@/utils/chatDraft';

// long enough for anything typed in a chat
const MESSAGE_MAX = 2000;

// the message being written at the bottom of a chat. Enter sends it, Shift+Enter starts a new line. what's sent is
// cleared at once and shows at the end of the chat as pending (db/pending), not sent with a retry when it fails. the
// text being written is kept per chat through a reload (utils/chatDraft)
export default function MessageInput({
  roomId,
  name,
}: {
  roomId: string;
  name: string;
}) {
  const myId = useMyId();
  // this chat's draft. none while prerendering and until the person logged in is known
  const text = useSyncExternalStore(
    subscribeDraft,
    () => (myId ? readDraft(myId, roomId) : ''),
    () => '',
  );
  const setText = (value: string) => {
    if (myId) saveDraft(myId, roomId, value);
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(myId) && text.trim().length > 0;

  // as tall as its text: as it's typed, as a kept draft shows after a reload, and as it's cleared on sending
  useLayoutEffect(() => {
    if (textareaRef.current) fitToContent(textareaRef.current);
  }, [text]);

  const send = () => {
    const message = text.trim();
    if (!message || !myId) return;
    setText('');
    void sendText(myId, roomId, message);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      {...stylex.props(styles.bar)}
    >
      <div {...stylex.props(styles.row)}>
        <textarea
          ref={textareaRef}
          aria-label={`Message to ${name || 'them'}`}
          rows={1}
          maxLength={MESSAGE_MAX}
          value={text}
          // until the person logged in is known: what's typed is kept under them
          readOnly={!myId}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // not while an input method composes a character (korean, japanese…): its Enter picks the character
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            }
          }}
          {...stylex.props(styles.input)}
        />
        <Button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          xstyle={styles.square}
        >
          <SendIcon size={20} />
        </Button>
      </div>
    </form>
  );
}

const styles = stylex.create({
  bar: {
    flexShrink: 0,
    paddingBlock: '16px',
    paddingInline: { default: '12px', [breakpoints.desktop]: '24px' },
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: auth.cardBorder,
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },
  // Button's looks, an icon in a square as tall as the input's first line
  square: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '48px',
    height: '48px',
    padding: 0,
    borderRadius: '12px',
  },
  // grows with its text up to a few lines, then scrolls
  input: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: '48px',
    maxHeight: '160px',
    paddingBlock: '12px',
    paddingInline: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    borderRadius: '12px',
    outline: 'none',
    resize: 'none',
    backgroundColor: auth.input,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    lineHeight: 1.4,
  },
});
