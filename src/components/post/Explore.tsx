'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useInfiniteCityPosts } from '@/hooks/usePost';
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

  // the next page as the end of the list scrolls near, like a list's onEndReached
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = posts;
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const end = endRef.current;
    // a failed page waits for its retry button instead of asking again on every scroll
    if (!end || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      // a screen ahead, so the next posts are usually there before they're scrolled to
      { rootMargin: '0px 0px 600px 0px' },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

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

  return (
    <>
      <header {...stylex.props(styles.header)}>
        <div>
          <p {...stylex.props(styles.eyebrow)}>Exploring</p>
          <h1 {...stylex.props(styles.title)}>
            {place ? placeLabel(place) : ' '}
          </h1>
        </div>
        <div {...stylex.props(styles.search)}>
          {/* a new city is a new page to go back from, keeping the tab */}
          <CitySearch onPick={(next) => show(next, role, true)} />
        </div>
      </header>

      <div {...stylex.props(styles.tabs)}>
        <RoleTabs
          role={role}
          // a tab only filters the same city, so it replaces the entry instead of adding one
          onChange={(nextRole) => place && show(place, nextRole, false)}
        />
      </div>

      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.feed)}>
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
        {place && (
          <aside {...stylex.props(styles.aside)}>
            <CreatePostCard city={place.city} />
          </aside>
        )}
      </div>
    </>
  );
}

const styles = stylex.create({
  // the search under the title on a phone, on its right on a desktop
  header: {
    display: 'flex',
    flexDirection: { default: 'column', [breakpoints.desktop]: 'row' },
    alignItems: { default: 'stretch', [breakpoints.desktop]: 'flex-start' },
    justifyContent: 'space-between',
    gap: { default: '16px', [breakpoints.desktop]: '24px' },
  },
  eyebrow: {
    fontSize: '15px',
    fontWeight: 500,
    color: auth.muted,
  },
  title: {
    marginTop: '2px',
    fontSize: { default: '34px', [breakpoints.desktop]: '38px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  search: {
    width: { default: '100%', [breakpoints.desktop]: '360px' },
    flexShrink: 0,
    marginTop: { default: 0, [breakpoints.desktop]: '10px' },
  },
  tabs: {
    marginTop: { default: '20px', [breakpoints.desktop]: '24px' },
    paddingBottom: '16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: auth.cardBorder,
  },
  // the posts and the create card beside them on a desktop, the card after the posts on a phone
  content: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.desktop]: 'minmax(0, 1fr) 280px',
    },
    alignItems: 'start',
    gap: { default: '16px', [breakpoints.desktop]: '24px' },
    marginTop: { default: '20px', [breakpoints.desktop]: '24px' },
  },
  feed: {
    minWidth: 0,
  },
  // one wide card per row
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '16px', [breakpoints.desktop]: '18px' },
    listStyle: 'none',
  },
  aside: {
    position: { default: 'static', [breakpoints.desktop]: 'sticky' },
    top: '36px',
  },
});
