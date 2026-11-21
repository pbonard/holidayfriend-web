'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

export type MenuItem = {
  label: string;
  // a link when given, otherwise a button that runs onClick
  href?: string;
  onClick?: () => void;
  // red, for what's hard to take back
  danger?: boolean;
  // while what it started is still on its way
  disabled?: boolean;
};

type DropdownMenuProps = {
  open: boolean;
  // the button and a click outside or Esc ask for it, the parent decides. an item doesn't close it by itself, so
  // one that waits on the server can stay open until it's done
  onOpenChange: (open: boolean) => void;
  // what a screen reader calls the button
  label: string;
  // the button's look, and what's in it (the icon)
  triggerStyle?: StyleXStyles;
  trigger: React.ReactNode;
  // false for one that isn't there right now
  items: (MenuItem | false | undefined)[];
  // what went wrong with the last item chosen, under the items
  error?: string | null;
};

// where the menu goes: under the button, its right edge on the button's
type Position = { top: number; right: number };

function positionUnder(button: HTMLElement): Position {
  const rect = button.getBoundingClientRect();
  return { top: rect.bottom + 6, right: window.innerWidth - rect.right };
}

// a button that opens a small menu under it. the menu is put on the page's body and placed by the button, so a
// scrolling row it's in (like the recommendations) can't cut it off
export default function DropdownMenu({
  open,
  onOpenChange,
  label,
  triggerStyle,
  trigger,
  items,
  error,
}: DropdownMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  // follows the button as the page or a row scrolls, before the paint so it never shows in the wrong place
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const button = buttonRef.current;
    const place = () => setPosition(positionUnder(button));
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  // closes on a click outside the button and the menu, or Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        onOpenChange(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        {...stylex.props(styles.trigger, triggerStyle)}
      >
        {trigger}
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.top, right: position.right }}
            {...stylex.props(styles.menu)}
          >
            {items.map(
              (item) =>
                item &&
                (item.href ? (
                  <Link
                    key={item.label}
                    role="menuitem"
                    href={item.href}
                    onClick={item.onClick}
                    {...stylex.props(styles.item, item.danger && styles.danger)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={item.onClick}
                    {...stylex.props(styles.item, item.danger && styles.danger)}
                  >
                    {item.label}
                  </button>
                )),
            )}
            {error && (
              <p role="alert" {...stylex.props(styles.error)}>
                {error}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

const styles = stylex.create({
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 0,
    borderRadius: '10px',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
  // fixed and placed by the button, top and right come from positionUnder
  menu: {
    position: 'fixed',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '180px',
    maxWidth: 'calc(100vw - 32px)',
    padding: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '12px',
    backgroundColor: auth.surface,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
  },
  item: {
    display: 'block',
    width: '100%',
    paddingBlock: '10px',
    paddingInline: '12px',
    borderWidth: 0,
    borderRadius: '8px',
    // :not(:disabled) and not :enabled, which a link never is
    backgroundColor: {
      default: 'transparent',
      ':hover:not(:disabled)': auth.control,
    },
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '15px',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: { default: 'pointer', ':disabled': 'progress' },
    opacity: { default: 1, ':disabled': 0.6 },
  },
  danger: {
    color: auth.danger,
  },
  error: {
    maxWidth: '240px',
    paddingBlock: '6px',
    paddingInline: '12px',
    fontSize: '13px',
    color: auth.danger,
  },
});
