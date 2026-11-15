'use client';

import * as stylex from '@stylexjs/stylex';
import { useAttributeWhileShown } from '@/hooks/useAttributeWhileShown';
import { chatRoomMarker } from '@/styles/tokens.stylex';

// an open chat's box: data-chat-room makes a phone hide the list beside it (ChatList's when.siblingAfter keys). only
// while it's shown: going back to the list keeps this chat hidden in the page, and the list must show then
export default function ChatRoomPane({ children }: { children: React.ReactNode }) {
  const ref = useAttributeWhileShown<HTMLElement>('data-chat-room');
  return (
    <section
      ref={ref}
      {...stylex.props(chatRoomMarker, styles.pane)}
      data-chat-room=""
    >
      {children}
    </section>
  );
}

const styles = stylex.create({
  pane: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
  },
});
