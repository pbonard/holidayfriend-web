'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import {
  useBlockChat,
  useCheckBlock,
  useLeaveChat,
  useReportUser,
} from '@/hooks/useChat';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import DropdownMenu from '@/components/DropdownMenu';
import Modal from '@/components/Modal';
import MoreIcon from '@/components/icons/MoreIcon';
import { profilePath } from '@/utils';

export default function ChatRoomMore({
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
  const reportUserMutation = useReportUser(roomId);
  // whether they're blocked: Block or Unblock, once it's known
  const didBlock = useCheckBlock(roomId).data?.didBlock;
  const [open, setOpen] = useState(false);
  // what's asked before it's done, or an unblock that failed
  const [confirming, setConfirming] = useState<
    'leave' | 'block' | 'unblockFailed' | 'report' | null
  >(null);

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
    <div {...stylex.props(styles.anchor)}>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        label="Chat options"
        triggerStyle={styles.trigger}
        trigger={<MoreIcon size={20} vertical />}
        items={[
          {
            label: 'View profile',
            href: profilePath(roomId),
            onClick: () => setOpen(false),
          },
          onSelectMessages && {
            label: 'Select messages',
            onClick: () => {
              setOpen(false);
              onSelectMessages();
            },
          },
          didBlock !== undefined && {
            label: didBlock ? 'Unblock' : 'Block',
            danger: !didBlock,
            disabled: blockChatMutation.isPending,
            onClick: () => {
              setOpen(false);
              // unblocking undoes it at once, blocking asks first
              if (didBlock) {
                unblock();
              } else {
                blockChatMutation.reset();
                setConfirming('block');
              }
            },
          },
          {
            // blocks too, unless they already are
            label: didBlock ? 'Report' : 'Report and block',
            danger: true,
            onClick: () => {
              setOpen(false);
              setConfirming('report');
            },
          },
          {
            label: 'Leave chat',
            danger: true,
            onClick: () => {
              setOpen(false);
              setConfirming('leave');
            },
          },
        ]}
      />

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

      <ConfirmModal
        open={confirming === 'report'}
        onClose={() => setConfirming(null)}
        title={`Report ${name || 'them'}?`}
        description={
          didBlock
            ? "They're banned if enough people report them. They aren't told who did."
            : "You won't get their messages, and they're banned if enough people report them. They aren't told who did, and you can unblock them from this menu."
        }
        confirmLabel={didBlock ? 'Report' : 'Report and block'}
        fallbackError="Couldn't report them."
        doneMessage="Thanks for telling us. They're blocked, and banned if enough people report them."
        onConfirm={() => reportUserMutation.mutateAsync()}
      />

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
    width: '40px',
    height: '40px',
    color: auth.text,
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
