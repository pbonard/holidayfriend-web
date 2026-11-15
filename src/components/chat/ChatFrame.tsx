'use client';

import * as stylex from '@stylexjs/stylex';
import { useAttributeWhileShown } from '@/hooks/useAttributeWhileShown';
import { fillHeightMarker } from '@/styles/tokens.stylex';

// the chats screen's box: data-fill-height gives it the window's height (Tab's when.descendant keys). only while it's
// shown, so a page opened after it isn't sized as the chats screen while this one is kept hidden
export default function ChatFrame({ children }: { children: React.ReactNode }) {
  const ref = useAttributeWhileShown<HTMLDivElement>('data-fill-height');
  return (
    <div
      ref={ref}
      {...stylex.props(fillHeightMarker, styles.screen)}
      data-fill-height=""
    >
      {children}
    </div>
  );
}

const styles = stylex.create({
  screen: {
    display: 'flex',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
  },
});
