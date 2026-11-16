'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useDeleteMessages } from '@/hooks/useChat';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

// in the input's place while messages are chosen: how many, Cancel, and Delete, which asks first. deleted for both
// people, as on mobile. done once they're all deleted: the ones that failed stay chosen, to try again
export default function MessageSelectionBar({
  roomId,
  name,
  ids,
  onDone,
}: {
  roomId: string;
  name: string;
  // the messages chosen, still in the chat
  ids: string[];
  onDone: () => void;
}) {
  const deleteMessagesMutation = useDeleteMessages(roomId);
  const [confirming, setConfirming] = useState(false);
  const count = ids.length;
  const what = count === 1 ? 'message' : 'messages';

  const remove = () => {
    deleteMessagesMutation.mutate(ids, {
      onSuccess: () => {
        setConfirming(false);
        onDone();
      },
    });
  };

  return (
    <div {...stylex.props(styles.bar)}>
      <Button variant="secondary" onClick={onDone} xstyle={styles.button}>
        Cancel
      </Button>
      <span aria-live="polite" {...stylex.props(styles.count)}>
        {count === 0 ? 'Select messages' : `${count} selected`}
      </span>
      <Button
        disabled={count === 0}
        onClick={() => {
          deleteMessagesMutation.reset();
          setConfirming(true);
        }}
        xstyle={styles.button}
      >
        Delete
      </Button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete ${count} ${what}?`}
      >
        <p {...stylex.props(styles.explain)}>
          {count === 1 ? 'It’s' : 'They’re'} deleted for you and{' '}
          {name || 'them'}.
        </p>
        {deleteMessagesMutation.isError && (
          <p role="alert" {...stylex.props(styles.error)}>
            {deleteMessagesMutation.error.message}
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
            disabled={deleteMessagesMutation.isPending || count === 0}
            onClick={remove}
            xstyle={styles.action}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const styles = stylex.create({
  // as tall as the input it stands in for
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    paddingBlock: '16px',
    paddingInline: { default: '12px', [breakpoints.desktop]: '24px' },
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: auth.cardBorder,
  },
  // as wide as its label: Button fills its row otherwise, and would push the count and Delete out of it
  button: {
    flexShrink: 0,
    width: 'auto',
    height: '48px',
    paddingInline: '20px',
  },
  count: {
    flexGrow: 1,
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: 600,
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
