import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { breakpoints } from '@/styles/tokens.stylex';
import BackLink from '@/components/BackLink';
import PostDetail from '@/components/post/PostDetail';
import Recommendations from '@/components/post/Recommendations';
import { placeFromPath } from '@/utils/citySearch';

type Params = Promise<{ country: string; city: string; postId: string }>;

export const metadata: Metadata = {
  title: 'Post · Holidayfriend',
};

// /explore/jp/tokyo/{id}: a post's own page, from the city it was found in. a path that isn't a city of the list
// is a 404. the way back doesn't need the path, so it shows at once. the path is read inside the page's own
// suspense, so going from one post to another doesn't wait for it before anything shows
export default function PostPage({ params }: { params: Params }) {
  return (
    <>
      {/* the browser's back, to wherever the post was opened from: a city, a profile, another post */}
      <BackLink xstyle={styles.back} />
      <Suspense>
        <Post params={params} />
      </Suspense>
    </>
  );
}

async function Post({ params }: { params: Params }) {
  const { country, city, postId } = await params;
  const place = placeFromPath(country, city);
  if (!place) {
    notFound();
  }

  return (
    <>
      <PostDetail />
      {/* more of the city's posts by the same kind of people, once the post is there */}
      <Recommendations place={place} postId={postId} />
    </>
  );
}

const styles = stylex.create({
  // closer to the post than a sign in screen's
  back: {
    marginBottom: { default: '20px', [breakpoints.desktop]: '28px' },
  },
});
