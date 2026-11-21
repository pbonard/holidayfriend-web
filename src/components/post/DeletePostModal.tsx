'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useDeletePost } from '@/hooks/usePost';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

type DeletePostModalProps = {
  open: boolean;
  onClose: () => void;
  postId: string;
  // once it's deleted: the post's page leaves for its city, a feed's card is gone from the feed by itself
  onDeleted: () => void;
};

// asks before deleting one's own post for good, from its page's more button or its card's
export default function DeletePostModal({
  open,
  onClose,
  postId,
  onDeleted,
}: DeletePostModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete this post?">
      {/* inside the modal, so a failure from the last time is gone when it opens again */}
      <DeletePostConfirm
        postId={postId}
        onCancel={onClose}
        onDeleted={onDeleted}
      />
    </Modal>
  );
}

function DeletePostConfirm({
  postId,
  onCancel,
  onDeleted,
}: {
  postId: string;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const deletePostMutation = useDeletePost();
  const notLoggedIn = deletePostMutation.error instanceof NotLoggedInError;

  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);

  const deletePost = () => {
    deletePostMutation.mutate(postId, { onSuccess: onDeleted });
  };

  return (
    <>
      <p {...stylex.props(styles.explain)}>
        It&apos;s gone for good, from every city it&apos;s in. Invites you got
        from it stay.
      </p>
      {/* not logging in again is shown by going to the login page, not as an error here */}
      {deletePostMutation.isError && !notLoggedIn && (
        <p role="alert" {...stylex.props(styles.error)}>
          {deletePostMutation.error.message || "Couldn't delete the post."}
        </p>
      )}
      <div {...stylex.props(styles.actions)}>
        <Button
          variant="secondary"
          onClick={onCancel}
          xstyle={styles.action}
        >
          Cancel
        </Button>
        <Button
          disabled={deletePostMutation.isPending}
          onClick={deletePost}
          xstyle={[styles.action, styles.delete]}
        >
          Delete
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
  delete: {
    backgroundColor: auth.danger,
  },
});
