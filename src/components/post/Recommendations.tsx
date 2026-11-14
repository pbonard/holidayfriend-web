'use client';

import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useEndReachedHorizontally } from '@/hooks/useEndReached';
import { useGetPostDetail, useInfiniteCityPosts } from '@/hooks/usePost';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { breakpoints } from '@/styles/tokens.stylex';
import type { Place } from '@/types/post';
import PostCard from '@/components/post/PostCard';

// pages of the city's feed read for a first one at most, while there's no row to scroll yet, so a city with none of
// the role isn't read to its end
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

  // the next page as the row's end scrolls near its right edge. it also fills a row shorter than the screen: its
  // end is in view, so the next page comes until it isn't or the city has no more
  const { rowRef, endRef } = useEndReachedHorizontally(posts);

  // no row to scroll while there's none of the role yet: a few more pages for a first one
  const pageCount = posts.data?.pages.length ?? 0;
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = posts;
  const empty = role !== undefined && recommended.length === 0;
  useEffect(() => {
    if (
      empty &&
      pageCount > 0 &&
      pageCount < MAX_PAGES &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      fetchNextPage();
    }
  }, [
    empty,
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
      <ul ref={rowRef} {...stylex.props(styles.row)}>
        {recommended.map((post) => (
          <li key={post.id} {...stylex.props(styles.item)}>
            <PostCard post={post} place={place} myBasedIn={myBasedIn} />
          </li>
        ))}
        {/* what the observer watches: the end of what's loaded. an li, the only child a list can have */}
        <li ref={endRef} aria-hidden="true" {...stylex.props(styles.end)} />
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
  // takes no room but the row's gap before it
  end: {
    flexShrink: 0,
    width: '1px',
  },
});
