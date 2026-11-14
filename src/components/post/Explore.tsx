'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useEndReached } from '@/hooks/useEndReached';
import { useInfiniteCityPosts } from '@/hooks/usePost';
import { useScrolled } from '@/hooks/useScrolled';
import { useMyProfileBrief } from '@/hooks/useProfile';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { Place, PostRole } from '@/types/post';
import CitySearch from '@/components/CitySearch';
import ErrorText from '@/components/ErrorText';
import StatusText from '@/components/StatusText';
import CreatePostCard from '@/components/post/CreatePostCard';
import PostCard from '@/components/post/PostCard';
import RoleTabs from '@/components/RoleTabs';
import { explorePath, placeFromPath, placeLabel } from '@/utils/citySearch';
import { readLastExplored, saveLastExplored } from '@/utils/lastExplored';

function roleOf(value: string | null): PostRole | undefined {
  return value === 'local' || value === 'traveler' ? value : undefined;
}

// the tab stays when the city changes
function withRole(path: string, role: PostRole | undefined) {
  return role ? `${path}?role=${role}` : path;
}

// the city is the path and the tab the query (/explore/jp/tokyo?role=local), so back, reload and a shared link keep them.
// /explore alone goes on to the city explored last, or the first time to the one the viewer's profile is based in
export default function Explore() {
  const router = useRouter();
  const params = useParams<{ country?: string; city?: string }>();
  const searchParams = useSearchParams();

  const role = roleOf(searchParams.get('role'));
  const ownCity = !params.country || !params.city;
  const place =
    params.country && params.city
      ? placeFromPath(params.country, params.city)
      : null;
  // the viewer's own city: where /explore goes, and what the cards compare their authors with
  const myProfile = useMyProfileBrief();
  const myBasedIn: Place | null = myProfile.data
    ? {
        country: myProfile.data.basedInCountry,
        city: myProfile.data.basedInCity,
      }
    : null;
  const posts = useInfiniteCityPosts(place);
  const loaded = posts.data?.pages.flat() ?? [];
  // the tab filters what's loaded. a tab with few matches stays short, so the end below stays in view and the
  // observer keeps loading pages until the screen fills or the city has no more
  const filteredItems = role
    ? loaded.filter((post) => post.role === role)
    : loaded;

  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } =
    posts;
  const endRef = useEndReached(posts);

  // the desktop's search sticks from the very top, so from the first pixel scrolled the posts go under it and it
  // shows a line under itself
  const scrolled = useScrolled();

  // kept as the city to come back to. strings and not place, which is a new object every render
  const placeCountry = place?.country;
  const placeCity = place?.city;
  useEffect(() => {
    if (placeCountry && placeCity) {
      saveLastExplored({ country: placeCountry, city: placeCity });
    }
  }, [placeCountry, placeCity]);

  const basedInPath = myBasedIn ? explorePath(myBasedIn) : null;
  useEffect(() => {
    if (!ownCity) {
      return;
    }
    // the city explored last doesn't wait for the profile, the viewer's own city is for the first time
    const lastExplored = readLastExplored();
    const path = lastExplored ? explorePath(lastExplored) : basedInPath;
    if (path) {
      // replace: back from the city must not land on /explore and be sent on again
      router.replace(withRole(path, role));
    }
  }, [ownCity, basedInPath, role, router]);

  const notLoggedIn =
    myProfile.error instanceof NotLoggedInError ||
    posts.error instanceof NotLoggedInError;
  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);

  const show = (next: Place, nextRole: PostRole | undefined, push: boolean) => {
    const url = withRole(explorePath(next), nextRole);
    if (push) {
      router.push(url);
    } else {
      router.replace(url);
    }
  };

  if (notLoggedIn) {
    return null;
  }

  const title = (
    <>
      <p {...stylex.props(styles.eyebrow)}>Currently exploring</p>
      <h1 {...stylex.props(styles.title)}>
        {place ? placeLabel(place) : ' '}
      </h1>
    </>
  );
  // a new city is a new page to go back from, keeping the tab
  const search = <CitySearch onPick={(next) => show(next, role, true)} />;
  const tabs = (
    <RoleTabs
      role={role}
      // a tab only filters the same city, so it replaces the entry instead of adding one
      onChange={(nextRole) => place && show(place, nextRole, false)}
    />
  );

  // one of each, in two layouts. a desktop's: the side column (the city, the tabs, the create card) on the right,
  // staying, and the search above the posts on the left, staying too. a phone's: one column, search, city and tabs,
  // posts, create card. there the two columns' boxes step aside (display: contents) and their pieces line up by
  // order. the side comes first in the page, so its h1 is the first thing read
  return (
    <div {...stylex.props(styles.content)}>
      <div {...stylex.props(styles.side)}>
        <div {...stylex.props(styles.heading)}>
          {title}
          <div {...stylex.props(styles.tabs)}>{tabs}</div>
        </div>
        {place && (
          <div {...stylex.props(styles.create)}>
            <CreatePostCard city={place.city} />
          </div>
        )}
      </div>

      <div {...stylex.props(styles.feed)}>
        {/* stays above the posts as they scroll under it on a desktop, scrolls away with them on a phone */}
        <div {...stylex.props(styles.search, scrolled && styles.searchScrolled)}>
          {search}
        </div>
        <div {...stylex.props(styles.posts)}>
          {place === null ? (
            // only /explore, the page of a city that isn't listed is a 404
            myProfile.isError ? (
              <ErrorText
                message="Couldn't load your city."
                isRetrying={myProfile.isFetching}
                onRetry={() => myProfile.refetch()}
              />
            ) : (
              <StatusText>Loading…</StatusText>
            )
          ) : posts.isPending ? (
            <StatusText>Loading posts…</StatusText>
          ) : posts.isError && loaded.length === 0 ? (
            <ErrorText
              message={posts.error.message}
              isRetrying={posts.isFetching}
              onRetry={() => posts.refetch()}
            />
          ) : filteredItems.length === 0 && !hasNextPage ? (
            // only once every post is loaded: until then the next pages may still have some
            <StatusText>
              {role === 'local'
                ? `No locals have posted in ${place.city} yet.`
                : role === 'traveler'
                  ? `No travelers have posted in ${place.city} yet.`
                  : `No posts in ${place.city} yet. Be the first one.`}
            </StatusText>
          ) : (
            <>
              <ul {...stylex.props(styles.list)}>
                {filteredItems.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} place={place} myBasedIn={myBasedIn} />
                  </li>
                ))}
              </ul>
              {/* what the observer watches: the end of what's loaded */}
              <div ref={endRef} />
              {isFetchingNextPage ? (
                <StatusText>Loading more…</StatusText>
              ) : (
                isFetchNextPageError && (
                  <ErrorText
                    message={
                      posts.error?.message ?? "Couldn't load more posts."
                    }
                    isRetrying={posts.isFetching}
                    onRetry={() => fetchNextPage()}
                  />
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = stylex.create({
  // the posts and the side column beside them on a desktop. the side column fits the three tabs on a big screen,
  // narrower with the window, where the tabs scroll sideways
  content: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.desktop]: 'minmax(0, 1fr) clamp(300px, 26vw, 360px)',
    },
    alignItems: 'start',
    columnGap: '24px',
  },
  // a desktop's right column, staying as the posts scroll, as far from the window's top as main's padding
  side: {
    display: { default: 'contents', [breakpoints.desktop]: 'block' },
    gridColumnStart: 2,
    gridRowStart: 1,
    position: { default: 'static', [breakpoints.desktop]: 'sticky' },
    top: '36px',
  },
  // the city and the tabs: under the search on a phone, at the top of the side column on a desktop
  heading: {
    order: 1,
    marginTop: { default: '24px', [breakpoints.desktop]: 0 },
    marginBottom: '20px',
  },
  // the small line over the city
  eyebrow: {
    fontSize: '15px',
    fontWeight: 500,
    color: auth.muted,
  },
  // smaller in the side column on a desktop, where a long city wraps instead of widening it
  title: {
    marginTop: '2px',
    fontSize: { default: '34px', [breakpoints.desktop]: '30px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  tabs: {
    marginTop: { default: '20px', [breakpoints.desktop]: '16px' },
  },
  // the last on a phone, after the posts. under the tabs on a desktop
  create: {
    order: 3,
    marginTop: { default: '16px', [breakpoints.desktop]: 0 },
  },
  feed: {
    display: { default: 'contents', [breakpoints.desktop]: 'block' },
    gridColumnStart: 1,
    gridRowStart: 1,
    minWidth: 0,
  },
  // a desktop's: sticks to the top of the window above the posts, inside their column (a sticky box stays within
  // its parent, and the column is as tall as the posts). it takes in main's top padding (the negative margin, given
  // back as padding), so stuck it sits where it does unscrolled, level with the side column, and its background
  // covers the posts scrolling under it, down to the gap before the first one. above the cards' city tags and title
  // links (z-index 1). its line is always there and unseen until the page scrolls, so nothing moves when it shows.
  // a phone's: the first thing, in the page's flow
  search: {
    order: 0,
    position: { default: 'static', [breakpoints.desktop]: 'sticky' },
    top: 0,
    zIndex: 2,
    marginTop: { default: 0, [breakpoints.desktop]: '-36px' },
    paddingTop: { default: 0, [breakpoints.desktop]: '36px' },
    paddingBottom: { default: 0, [breakpoints.desktop]: '18px' },
    borderBottomWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    backgroundColor: auth.page,
    transition: 'border-color 120ms ease',
  },
  // the posts are going under it
  searchScrolled: {
    borderBottomColor: auth.cardBorder,
  },
  posts: {
    order: 2,
    minWidth: 0,
  },
  // one wide card per row
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '16px', [breakpoints.desktop]: '18px' },
    listStyle: 'none',
  },
});
