'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { useBlockChat, useCheckBlock, useLeaveChat } from '@/hooks/useChat';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import MoreIcon from '@/components/icons/MoreIcon';
import { profilePath } from '@/utils';

export default function ChatRoomHeader({
  roomId,
  name,
  onSelectMessages,
}: {
  roomId: string;
  name: string;
  // starts choosing messages to delete. not given when there's nothing to choose
  onSelectMessages?: () => void;
}) {
  const router = useRouter();
  const leaveChatMutation = useLeaveChat(roomId);
  const blockChatMutation = useBlockChat(roomId);
  // whether they're blocked: Block or Unblock, once it's known
  const didBlock = useCheckBlock(roomId).data?.didBlock;
  const [open, setOpen] = useState(false);
  // what's asked before it's done, or an unblock that failed
  const [confirming, setConfirming] = useState<
    'leave' | 'block' | 'unblockFailed' | null
  >(null);
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
        setConfirming(null);
        router.replace('/chats');
      },
    });
  };

  // at once, and if it fails, says so with a retry: the menu would still say Unblock
  const unblock = () => {
    blockChatMutation.mutate(false, {
      onSuccess: () => setConfirming(null),
      onError: () => setConfirming('unblockFailed'),
    });
  };

  const block = () => {
    blockChatMutation.mutate(true, {
      onSuccess: () => setConfirming(null),
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
          {onSelectMessages && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSelectMessages();
              }}
              {...stylex.props(styles.item)}
            >
              Select messages
            </button>
          )}
          {didBlock !== undefined && (
            <button
              type="button"
              role="menuitem"
              disabled={blockChatMutation.isPending}
              onClick={() => {
                setOpen(false);
                // unblocking undoes it at once, blocking asks first
                if (didBlock) {
                  unblock();
                } else {
                  blockChatMutation.reset();
                  setConfirming('block');
                }
              }}
              {...stylex.props(styles.item, !didBlock && styles.danger)}
            >
              {didBlock ? 'Unblock' : 'Block'}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirming('leave');
            }}
            {...stylex.props(styles.item, styles.danger)}
          >
            Leave chat
          </button>
        </div>
      )}

      <Modal
        open={confirming === 'block'}
        onClose={() => setConfirming(null)}
        title={`Block ${name || 'them'}?`}
      >
        <p {...stylex.props(styles.explain)}>
          You won&apos;t get their messages. They aren&apos;t told, and you can
          unblock them from this menu.
        </p>
        {blockChatMutation.isError && (
          <p role="alert" {...stylex.props(styles.error)}>
            {blockChatMutation.error.message || "Couldn't block them."}
          </p>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            onClick={() => setConfirming(null)}
            xstyle={styles.action}
          >
            Cancel
          </Button>
          <Button
            disabled={blockChatMutation.isPending}
            onClick={block}
            xstyle={styles.action}
          >
            Block
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirming === 'unblockFailed'}
        onClose={() => setConfirming(null)}
        title={`Couldn't unblock ${name || 'them'}`}
      >
        <p role="alert" {...stylex.props(styles.explain)}>
          {blockChatMutation.error?.message || 'Something went wrong.'} They
          stay blocked until it works.
        </p>
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            onClick={() => setConfirming(null)}
            xstyle={styles.action}
          >
            Close
          </Button>
          <Button
            disabled={blockChatMutation.isPending}
            onClick={unblock}
            xstyle={styles.action}
          >
            Try again
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirming === 'leave'}
        onClose={() => setConfirming(null)}
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
            onClick={() => setConfirming(null)}
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
