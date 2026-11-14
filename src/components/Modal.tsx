'use client';

import { useEffect, useId, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import CloseIcon from '@/components/icons/CloseIcon';

// a sheet that slides up from the bottom on a phone, a dialog that grows in the middle on a desktop
const slideUp = stylex.keyframes({
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' },
});
const slideDown = stylex.keyframes({
  from: { transform: 'translateY(0)' },
  to: { transform: 'translateY(100%)' },
});
const popIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(12px) scale(0.96)' },
  to: { opacity: 1, transform: 'translateY(0) scale(1)' },
});
const popOut = stylex.keyframes({
  from: { opacity: 1, transform: 'translateY(0) scale(1)' },
  to: { opacity: 0, transform: 'translateY(12px) scale(0.96)' },
});
const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const fadeOut = stylex.keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });

type ModalProps = {
  // shown while true. turning false plays the closing animation, the modal and its children go at its end
  open: boolean;
  // the ✕, Esc and a click on the backdrop ask for it, the parent closes it by turning open false
  onClose: () => void;
  // the heading, what a screen reader announces the modal as
  title: React.ReactNode;
  children: React.ReactNode;
};

// the browser's <dialog> opened with showModal: it keeps the focus inside, Esc closes it, and the page behind it
// can't be clicked or scrolled. its children are only there while it's open, so their state starts over each time
export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // in the page: from opening to the end of the closing animation
  const [shown, setShown] = useState(open);
  // playing the closing animation
  const [closing, setClosing] = useState(false);

  // open follows the parent: shown at once, closing animates first. set while rendering, as react suggests for
  // state that follows a prop
  if (open && (!shown || closing)) {
    setShown(true);
    setClosing(false);
  } else if (!open && shown && !closing) {
    setClosing(true);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!shown || !dialog) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    // the page behind doesn't scroll under the sheet
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [shown]);

  if (!shown) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Esc asks the parent, so it closes with the same animation instead of the browser's instant close
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // a click on the dimmed backdrop lands on the dialog itself, a click inside lands on its content
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onAnimationEnd={(event) => {
        // the sheet's own closing animation, not the backdrop's or a child's
        if (
          closing &&
          event.target === event.currentTarget &&
          !event.pseudoElement
        ) {
          dialogRef.current?.close();
          setShown(false);
          setClosing(false);
        }
      }}
      {...stylex.props(styles.dialog, closing && styles.closing)}
    >
      <div {...stylex.props(styles.sheet)}>
        {/* a phone's sheet shows it can be pulled, a desktop's dialog doesn't need it */}
        <span aria-hidden="true" {...stylex.props(styles.grabber)} />
        <header {...stylex.props(styles.header)}>
          <h2 id={titleId} {...stylex.props(styles.title)}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            {...stylex.props(styles.close)}
          >
            <CloseIcon size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

const styles = stylex.create({
  // the <dialog> is the sheet's frame: pinned to the bottom across the width on a phone, in the middle on a
  // desktop. ::backdrop is the dimmed page behind it
  dialog: {
    width: { default: '100%', [breakpoints.desktop]: '480px' },
    maxWidth: '100%',
    maxHeight: { default: '90dvh', [breakpoints.desktop]: '80dvh' },
    marginTop: 'auto',
    marginBottom: { default: 0, [breakpoints.desktop]: 'auto' },
    marginInline: { default: 0, [breakpoints.desktop]: 'auto' },
    padding: 0,
    // a phone's sheet has only its top edge, its sides and bottom are the screen's
    borderTopWidth: '1px',
    borderBottomWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderLeftWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderRightWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderTopLeftRadius: { default: '20px', [breakpoints.desktop]: '18px' },
    borderTopRightRadius: { default: '20px', [breakpoints.desktop]: '18px' },
    borderBottomLeftRadius: { default: 0, [breakpoints.desktop]: '18px' },
    borderBottomRightRadius: { default: 0, [breakpoints.desktop]: '18px' },
    backgroundColor: auth.card,
    color: auth.text,
    boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.45)',
    overflowY: 'auto',
    animationName: { default: slideUp, [breakpoints.desktop]: popIn },
    // next to nothing for who asked for less motion. not none: the closing waits for the animation's end
    animationDuration: {
      default: '280ms',
      [breakpoints.desktop]: '200ms',
      '@media (prefers-reduced-motion: reduce)': '1ms',
    },
    // fast out, gentle in: the way a sheet settles
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    animationFillMode: 'both',
    '::backdrop': {
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      animationName: fadeIn,
      animationDuration: '200ms',
      animationFillMode: 'both',
    },
  },
  closing: {
    animationName: { default: slideDown, [breakpoints.desktop]: popOut },
    animationDuration: {
      default: '220ms',
      [breakpoints.desktop]: '160ms',
      '@media (prefers-reduced-motion: reduce)': '1ms',
    },
    animationTimingFunction: 'cubic-bezier(0.4, 0, 1, 1)',
    '::backdrop': {
      animationName: fadeOut,
      animationDuration: '200ms',
    },
  },
  sheet: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingTop: { default: '10px', [breakpoints.desktop]: '24px' },
    paddingInline: { default: '20px', [breakpoints.desktop]: '24px' },
    // above the home indicator on a phone without a home button
    paddingBottom: {
      default: 'max(20px, env(safe-area-inset-bottom))',
      [breakpoints.desktop]: '24px',
    },
  },
  grabber: {
    display: { default: 'block', [breakpoints.desktop]: 'none' },
    alignSelf: 'center',
    width: '40px',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: auth.border,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  close: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '36px',
    height: '36px',
    padding: 0,
    borderWidth: 0,
    borderRadius: '50%',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    color: { default: auth.muted, ':hover': auth.text },
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
});
