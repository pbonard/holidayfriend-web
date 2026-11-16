'use client';

import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useAttributeWhileShown } from '@/hooks/useAttributeWhileShown';
import { fillHeightMarker } from '@/styles/tokens.stylex';

// where Tab pins the chats screen while a phone's keyboard is open
const VISIBLE_TOP = '--visible-top';
const VISIBLE_HEIGHT = '--visible-height';

// the chats screen's box: data-fill-height gives it the window's height (Tab's when.descendant keys). only while it's
// shown, so a page opened after it isn't sized as the chats screen while this one is kept hidden
export default function ChatFrame({ children }: { children: React.ReactNode }) {
  const ref = useAttributeWhileShown<HTMLDivElement>('data-fill-height');

  // while a phone's keyboard is open, the screen is what's above it, so the input sits on the keyboard and the header
  // stays. ios shrinks neither 100dvh nor innerHeight for the keyboard, only the visual viewport, and slides it down
  // over the page to show the input (offsetTop), which scrolling the window doesn't undo: the screen follows it. a
  // pinch zoom shrinks the visual viewport too, but scales it: the scale tells the two apart
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const clear = () => {
      root.style.removeProperty(VISIBLE_TOP);
      root.style.removeProperty(VISIBLE_HEIGHT);
    };
    const fit = () => {
      const keyboardOpen =
        viewport.scale === 1 && viewport.height < window.innerHeight - 1;
      if (keyboardOpen) {
        root.style.setProperty(VISIBLE_TOP, `${viewport.offsetTop}px`);
        root.style.setProperty(VISIBLE_HEIGHT, `${viewport.height}px`);
      } else {
        clear();
      }
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      clear();
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
