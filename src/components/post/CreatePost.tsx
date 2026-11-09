'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotLoggedInError } from '@/api/axios';
import { useCreatePost } from '@/hooks/usePost';
import PostForm, { emptyPostForm } from '@/components/post/PostForm';

// the create screen's part that runs in the browser: which request the form sends, and where it goes after
export default function CreatePost() {
  const router = useRouter();
  const createPostMutation = useCreatePost();
  const notLoggedIn = createPostMutation.error instanceof NotLoggedInError;

  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);

  return (
    <PostForm
      defaultValues={emptyPostForm()}
      submitLabel="Publish"
      isPending={createPostMutation.isPending}
      // not logging in again is shown by going to the login page, not as an error here
      errorMessage={notLoggedIn ? undefined : createPostMutation.error?.message}
      onSubmit={(request) =>
        createPostMutation.mutate(request, {
          // replace: back must not return to a post that is already published
          onSuccess: () => router.replace('/explore'),
        })
      }
    />
  );
}
