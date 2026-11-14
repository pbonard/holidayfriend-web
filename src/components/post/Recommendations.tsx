'use client';

import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useGetPostDetail, useInfiniteCityPosts } from '@/hooks/usePost';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { breakpoints } from '@/styles/tokens.stylex';
import type { Place } from '@/types/post';
import PostCard from '@/components/post/PostCard';

// enough to fill the row past the screen's edge
const ENOUGH = 6;
// pages of the city's feed read for them at most, so a city with few of the role isn't read to its end
const MAX_PAGES = 4;

// more posts of the city by the same kind of people as the post: travelers' under a traveler's, locals' under a
// local's. from the city's feed, the same pages the explore screen has loaded, filtered here. the post and the
// viewer are the same queries the post's page has, so they cost nothing more
export default function Recommendations({
  place,
  postId,
}: {
  // the city the post was found in
  place: Place;
  postId: string;
}) {
  // the kind of people: the post's role, nothing to recommend until it's loaded
  const role = useGetPostDetail(postId).data?.role;
  // the viewer's own city, for the cards to tell an author from home
  const myProfile = useMyProfileBrief();
  const myBasedIn: Place | null = myProfile.data
    ? {
        country: myProfile.data.basedInCountry,
        city: myProfile.data.basedInCity,
      }
    : null;
  const posts = useInfiniteCityPosts(place);
  const recommended = role
    ? (posts.data?.pages.flat() ?? []).filter(
        (post) => post.role === role && post.id !== postId,
      )
    : [];

  // the next page while the row is short and the city has more
  const pageCount = posts.data?.pages.length ?? 0;
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = posts;
  const short = role !== undefined && recommended.length < ENOUGH;
  useEffect(() => {
    if (
      short &&
      pageCount > 0 &&
      pageCount < MAX_PAGES &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      fetchNextPage();
    }
  }, [
    short,
    pageCount,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  // extras: nothing at all rather than a loading line or an error under the post
  if (recommended.length === 0) {
    return null;
  }

  return (
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Recommendations</h2>
      <ul {...stylex.props(styles.row)}>
        {recommended.map((post) => (
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
    display: 'flex',
    flexShrink: 0,
    // most of a phone's width, so the next card peeks in and says the row scrolls
    width: { default: '85%', [breakpoints.desktop]: '300px' },
    scrollSnapAlign: 'start',
  },
});
