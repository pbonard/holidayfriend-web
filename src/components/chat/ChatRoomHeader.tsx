'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { useLeaveChat } from '@/hooks/useChat';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import MoreIcon from '@/components/icons/MoreIcon';
import { profilePath } from '@/utils';

export default function ChatRoomHeader({
  roomId,
  name,
}: {
  roomId: string;
  name: string;
}) {
  const router = useRouter();
  const leaveChatMutation = useLeaveChat(roomId);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // closes on a click outside it, or Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const leave = () => {
    leaveChatMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirming(false);
        router.replace('/chats');
      },
    });
  };

  return (
    <div ref={menuRef} {...stylex.props(styles.anchor)}>
      <button
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((shown) => !shown)}
        {...stylex.props(styles.trigger)}
      >
        <MoreIcon size={20} vertical />
      </button>
      {open && (
        <div role="menu" {...stylex.props(styles.menu)}>
          <Link
            role="menuitem"
            href={profilePath(roomId)}
            onClick={() => setOpen(false)}
            {...stylex.props(styles.item)}
          >
            View profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            {...stylex.props(styles.item, styles.danger)}
          >
            Leave chat
          </button>
        </div>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Leave this chat?"
      >
        <p {...stylex.props(styles.explain)}>
          The messages with {name || 'them'} are removed for you. They keep
          theirs. To chat again, send them an invite.
        </p>
        {leaveChatMutation.isError && (
          <p role="alert" {...stylex.props(styles.error)}>
            {leaveChatMutation.error.message || "Couldn't leave the chat."}
          </p>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            onClick={() => setConfirming(false)}
            xstyle={styles.action}
          >
            Cancel
          </Button>
          <Button
            disabled={leaveChatMutation.isPending}
            onClick={leave}
            xstyle={styles.action}
          >
            Leave
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const styles = stylex.create({
  anchor: {
    position: 'relative',
    flexShrink: 0,
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderWidth: 0,
    borderRadius: '10px',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    color: auth.text,
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '180px',
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
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '15px',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  danger: {
    color: auth.danger,
  },
  explain: {
    fontSize: '16px',
    lineHeight: 1.5,
    color: auth.muted,
  },
  error: {
    marginTop: '12px',
    fontSize: '14px',
    color: auth.danger,
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px',
  },
  action: {
    flexGrow: 1,
    height: '48px',
  },
});
