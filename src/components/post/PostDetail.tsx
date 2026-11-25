'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import {
  useDeletePost,
  useGetPostDetail,
  useReportPost,
} from '@/hooks/usePost';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { Place } from '@/types/post';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import DropdownMenu from '@/components/DropdownMenu';
import ErrorText from '@/components/ErrorText';
import StatusText from '@/components/StatusText';
import ChatIcon from '@/components/icons/ChatIcon';
import MoreIcon from '@/components/icons/MoreIcon';
import PostCard from '@/components/post/PostCard';
import Modal from '@/components/Modal';
import SayHiForm from '@/components/post/SayHiForm';
import { editPostPath } from '@/utils';
import { explorePath, placeFromPath } from '@/utils/citySearch';

// the server's 404 body, matched exactly as a missing route is a 404 too
const POST_NOT_FOUND = 'Post not found';

// a post's own page, from the city it was found in: /explore/jp/tokyo/{id}. the page puts the way back to that
// city above it, and the related posts under it
export default function PostDetail() {
  const router = useRouter();
  const params = useParams<{ country: string; city: string; postId: string }>();
  const place = placeFromPath(params.country, params.city);
  if (!place) {
    notFound();
  }
  const post = useGetPostDetail(params.postId);
  // the viewer: to tell their own post, and the cards' authors from home. the explore screen has usually loaded it
  const myProfile = useMyProfileBrief();
  const myBasedIn: Place | null = myProfile.data
    ? {
        country: myProfile.data.basedInCountry,
        city: myProfile.data.basedInCity,
      }
    : null;
  // "Say hi" opens the message in a sheet over the page
  const [sayingHi, setSayingHi] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isMine = !!myProfile.data && myProfile.data.id === post.data?.authorId;
  // deleting and reporting ask first, in a modal over the page. one at a time, so one state says which
  const [confirming, setConfirming] = useState<'delete' | 'report' | null>(
    null,
  );
  const deletePostMutation = useDeletePost();
  const reportPostMutation = useReportPost();

  const notLoggedIn =
    post.error instanceof NotLoggedInError ||
    myProfile.error instanceof NotLoggedInError;
  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);
  if (notLoggedIn) {
    return null;
  }

  return (
    <>
      {post.isPending ? (
        <StatusText>Loading the post…</StatusText>
      ) : post.isError ? (
        post.error.message === POST_NOT_FOUND ? (
          <StatusText>This post isn&apos;t here anymore.</StatusText>
        ) : (
          <ErrorText
            message={post.error.message}
            isRetrying={post.isFetching}
            onRetry={() => post.refetch()}
          />
        )
      ) : (
        <>
          <PostCard
            post={post.data}
            place={place}
            myBasedIn={myBasedIn}
            detail
            actions={
              // waits for the viewer, so the buttons of someone else's post never show on their own for a moment
              myProfile.data && (
                <>
                  {/* the viewer's own post has nobody to say hi to */}
                  {!isMine && (
                    <Button
                      aria-haspopup="dialog"
                      onClick={() => setSayingHi(true)}
                      xstyle={styles.sayHi}
                    >
                      <ChatIcon size={18} />
                      Say hi
                    </Button>
                  )}
                  <DropdownMenu
                    open={moreOpen}
                    onOpenChange={setMoreOpen}
                    label="More options"
                    triggerStyle={styles.more}
                    trigger={<MoreIcon size={20} />}
                    items={
                      isMine
                        ? [
                            {
                              label: 'Edit post',
                              href: editPostPath(post.data.id),
                              onClick: () => setMoreOpen(false),
                            },
                            {
                              label: 'Delete post',
                              danger: true,
                              onClick: () => {
                                setMoreOpen(false);
                                setConfirming('delete');
                              },
                            },
                          ]
                        : [
                            {
                              label: 'Report post',
                              danger: true,
                              onClick: () => {
                                setMoreOpen(false);
                                setConfirming('report');
                              },
                            },
                          ]
                    }
                  />
                </>
              )
            }
          />

          <ConfirmModal
            open={confirming === 'delete'}
            onClose={() => setConfirming(null)}
            title="Delete this post?"
            description="It's gone for good, from every city it's in. Invites you got from it stay."
            confirmLabel="Delete"
            fallbackError="Couldn't delete the post."
            onConfirm={() => deletePostMutation.mutateAsync(post.data.id)}
            // back to the city it was opened from: the post's page has nothing left to show. replace, so back
            // doesn't return to it
            onDone={() => router.replace(explorePath(place))}
          />

          <ConfirmModal
            open={confirming === 'report'}
            onClose={() => setConfirming(null)}
            title="Report this post?"
            description="We'll check it against our rules, like hate, harassment, scams or ads, and take it down if it breaks them. The author isn't told who reported it."
            confirmLabel="Report"
            fallbackError="Couldn't report the post."
            doneMessage="Thanks for telling us. We'll check it against our rules and take it down if it breaks them."
            onConfirm={() => reportPostMutation.mutateAsync(post.data.id)}
          />

          <Modal
            open={sayingHi}
            onClose={() => setSayingHi(false)}
            title={`Say hi to ${post.data.authorName || 'them'}`}
          >
            <SayHiForm
              authorId={post.data.authorId}
              authorName={post.data.authorName}
              onClose={() => setSayingHi(false)}
            />
          </Modal>
        </>
      )}
    </>
  );
}

const styles = stylex.create({
  // Button's primary look, as wide as its words on a desktop and the whole width but the more button's on a phone
  sayHi: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: 'auto',
    flexGrow: { default: 1, [breakpoints.desktop]: 0 },
    height: '44px',
    paddingInline: '20px',
  },
  // Button's secondary look, round
  more: {
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':hover': auth.muted },
    borderRadius: '50%',
    color: auth.text,
    transition: 'background-color 120ms ease, border-color 120ms ease',
  },
});
