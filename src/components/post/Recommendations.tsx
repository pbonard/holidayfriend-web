'use client';

import * as stylex from '@stylexjs/stylex';
import { useGetRelatedPosts } from '@/hooks/usePost';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { breakpoints } from '@/styles/tokens.stylex';
import type { Place } from '@/types/post';
import PostCard from '@/components/post/PostCard';

// the posts most like the post, by the same kind of people: of the city, then of the rest of its country
export default function Recommendations({
  place,
  postId,
}: {
  // the city the post was found in
  place: Place;
  postId: string;
}) {
  // the viewer's own city, for the cards to tell an author from home
  const myProfile = useMyProfileBrief();
  const myBasedIn: Place | null = myProfile.data
    ? {
        country: myProfile.data.basedInCountry,
        city: myProfile.data.basedInCity,
      }
    : null;
  const related = useGetRelatedPosts(postId, place).data ?? [];

  // extras: nothing at all rather than a loading line or an error under the post
  if (related.length === 0) {
    return null;
  }

  return (
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Related posts</h2>
      <ul {...stylex.props(styles.row)}>
        {related.map((post) => (
          <li key={post.id} {...stylex.props(styles.item)}>
            <PostCard post={post} place={place} myBasedIn={myBasedIn} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const styles = stylex.create({
  section: {
    marginTop: { default: '28px', [breakpoints.desktop]: '36px' },
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  // one row that scrolls sideways, a card at a time on a phone
  row: {
    display: 'flex',
    gap: '14px',
    // room for the cards' focus ring, which the scrolling would cut, taken back by the margin so the cards line up
    padding: '4px',
    marginTop: '10px',
    marginInline: '-4px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    listStyle: 'none',
  },
  item: {
    display: 'grid',
    flexShrink: 0,
    // most of a phone's width, so the next card peeks in and says the row scrolls
    width: { default: '85%', [breakpoints.desktop]: '300px' },
    scrollSnapAlign: 'start',
  },
});
