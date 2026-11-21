'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  // what happens if they go on
  description: React.ReactNode;
  // the red button's label, e.g. "Delete"
  confirmLabel: string;
  // shown when the failure has no message of its own
  fallbackError: string;
  // the request itself, e.g. a mutation's mutateAsync. its pending state and failure are this modal's
  onConfirm: () => Promise<unknown>;
  // once it's done: a message in place of the question with a Done button that closes, or nothing here and onDone
  doneMessage?: React.ReactNode;
  onDone?: () => void;
};

// asks before something that can't be taken back, deleting or reporting a post, and does it
export default function ConfirmModal({
  open,
  onClose,
  title,
  ...confirm
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {/* inside the modal, so a failure or the done message from the last time is gone when it opens again */}
      <Confirm onClose={onClose} {...confirm} />
    </Modal>
  );
}

function Confirm({
  onClose,
  description,
  confirmLabel,
  fallbackError,
  onConfirm,
  doneMessage,
  onDone,
}: Omit<ConfirmModalProps, 'open' | 'title'>) {
  const router = useRouter();
  const confirmMutation = useMutation({
    mutationFn: onConfirm,
    onSuccess: onDone,
  });
  const notLoggedIn = confirmMutation.error instanceof NotLoggedInError;

  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);

  if (confirmMutation.isSuccess && doneMessage) {
    return (
      <>
        <p {...stylex.props(styles.explain)}>{doneMessage}</p>
        <div {...stylex.props(styles.actions)}>
          <Button onClick={onClose} xstyle={styles.action}>
            Done
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p {...stylex.props(styles.explain)}>{description}</p>
      {/* not logging in again is shown by going to the login page, not as an error here */}
      {confirmMutation.isError && !notLoggedIn && (
        <p role="alert" {...stylex.props(styles.error)}>
          {confirmMutation.error.message || fallbackError}
        </p>
      )}
      <div {...stylex.props(styles.actions)}>
        <Button variant="secondary" onClick={onClose} xstyle={styles.action}>
          Cancel
        </Button>
        <Button
          disabled={confirmMutation.isPending}
          onClick={() => confirmMutation.mutate()}
          xstyle={[styles.action, styles.confirm]}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

// as the chat's leave and block modals
const styles = stylex.create({
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
  confirm: {
    backgroundColor: auth.danger,
  },
});
