'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NotLoggedInError } from '@/api/axios';
import { useGetPostDetail, useUpdatePost } from '@/hooks/usePost';
import ErrorText from '@/components/ErrorText';
import StatusText from '@/components/StatusText';
import PostForm from '@/components/post/PostForm';

// the server's 404 body, as on the post's page
const POST_NOT_FOUND = 'Post not found';

// the edit screen's part that runs in the browser: the post as it is in the create form, sent back as an update.
// the post comes from its page's query, so opening it from there shows the form at once
export default function EditPost() {
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const post = useGetPostDetail(id);
  const updatePostMutation = useUpdatePost();
  const notLoggedIn =
    post.error instanceof NotLoggedInError ||
    updatePostMutation.error instanceof NotLoggedInError;

  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);
  if (notLoggedIn) {
    return null;
  }

  if (post.isPending) {
    return <StatusText>Loading the post…</StatusText>;
  }
  if (post.isError) {
    return post.error.message === POST_NOT_FOUND ? (
      <StatusText>This post isn&apos;t here anymore.</StatusText>
    ) : (
      <ErrorText
        message={post.error.message}
        isRetrying={post.isFetching}
        onRetry={() => post.refetch()}
      />
    );
  }

  return (
    <PostForm
      // the form reads these once, so it's only made once the post is here
      defaultValues={{
        role: post.data.role,
        places: post.data.places,
        title: post.data.title,
        body: post.data.body,
      }}
      submitLabel="Save"
      isPending={updatePostMutation.isPending}
      errorMessage={updatePostMutation.error?.message}
      onSubmit={(request) =>
        updatePostMutation.mutate(
          { id, ...request },
          // back to the post's page it was opened from, which asks for the post again
          { onSuccess: () => router.back() },
        )
      }
    />
  );
}
