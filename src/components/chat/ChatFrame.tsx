'use client';

import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useAttributeWhileShown } from '@/hooks/useAttributeWhileShown';
import { fillHeightMarker } from '@/styles/tokens.stylex';

const ABOVE_KEYBOARD_HEIGHT = '--above-keyboard-height';

// the chats screen's box: data-fill-height gives it the window's height (Tab's when.descendant keys). only while it's
// shown, so a page opened after it isn't sized as the chats screen while this one is kept hidden
export default function ChatFrame({ children }: { children: React.ReactNode }) {
  const ref = useAttributeWhileShown<HTMLDivElement>('data-fill-height');

  // while a phone's keyboard is open, the screen is only as tall as what's above it, so the input sits on the
  // keyboard and the header stays. ios shrinks neither 100dvh nor innerHeight for the keyboard, only the visual
  // viewport, and scrolls the page to show the input instead, which left a gap under it. a pinch zoom shrinks the
  // visual viewport too, but scales it: the scale tells the two apart
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const fit = () => {
      const keyboardOpen =
        viewport.scale === 1 && viewport.height < window.innerHeight - 1;
      if (keyboardOpen) {
        root.style.setProperty(ABOVE_KEYBOARD_HEIGHT, `${viewport.height}px`);
        window.scrollTo(0, 0);
      } else {
        root.style.removeProperty(ABOVE_KEYBOARD_HEIGHT);
      }
    };
    fit();
    viewport.addEventListener('resize', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      root.style.removeProperty(ABOVE_KEYBOARD_HEIGHT);
    };
  }, []);

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
