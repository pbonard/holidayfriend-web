'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useGetPostDetail } from '@/hooks/usePost';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { breakpoints } from '@/styles/tokens.stylex';
import type { Place } from '@/types/post';
import Button from '@/components/Button';
import ErrorText from '@/components/ErrorText';
import StatusText from '@/components/StatusText';
import ChatIcon from '@/components/icons/ChatIcon';
import MoreIcon from '@/components/icons/MoreIcon';
import PostCard from '@/components/post/PostCard';
import Modal from '@/components/Modal';
import SayHiForm from '@/components/post/SayHiForm';
import { placeFromPath } from '@/utils/citySearch';

// the server's 404 body, matched exactly as a missing route is a 404 too
const POST_NOT_FOUND = 'Post not found';

// a post's own page, from the city it was found in: /explore/jp/tokyo/{id}. the page puts the way back to that
// city above it. the recommendations are more of its posts by the same kind of people
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
              <>
                {/* the viewer's own post has nobody to say hi to. waits for the viewer, so it never shows on
                    their own post for a moment */}
                {myProfile.data && myProfile.data.id !== post.data.authorId && (
                  <Button
                    aria-haspopup="dialog"
                    onClick={() => setSayingHi(true)}
                    xstyle={styles.sayHi}
                  >
                    <ChatIcon size={18} />
                    Say hi
                  </Button>
                )}
                {/* nothing behind it yet */}
                <Button
                  variant="secondary"
                  disabled
                  aria-label="More options"
                  xstyle={styles.more}
                >
                  <MoreIcon size={20} />
                </Button>
              </>
            }
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    padding: 0,
    borderRadius: '50%',
    backgroundColor: 'transparent',
  },
});
