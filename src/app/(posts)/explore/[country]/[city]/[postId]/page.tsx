import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { breakpoints } from '@/styles/tokens.stylex';
import BackLink from '@/components/BackLink';
import PostDetail from '@/components/post/PostDetail';
import Recommendations from '@/components/post/Recommendations';
import { explorePath, placeFromPath } from '@/utils/citySearch';

type Params = Promise<{ country: string; city: string; postId: string }>;

export const metadata: Metadata = {
  title: 'Post · Holidayfriend',
};

// /explore/jp/tokyo/{id}: a post's own page, from the city it was found in. read on request inside the explore
// layout's suspense. a path that isn't a city of the list is a 404
export default async function PostPage({ params }: { params: Params }) {
  const { country, city, postId } = await params;
  const place = placeFromPath(country, city);
  if (!place) {
    notFound();
  }

  return (
    <>
      {/* a link and not the browser's back: a post opened from a shared link has nothing before it */}
      <BackLink href={explorePath(place)} xstyle={styles.back}>
        Back to {place.city}
      </BackLink>
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
