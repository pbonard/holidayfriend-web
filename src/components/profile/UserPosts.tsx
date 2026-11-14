'use client';

import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { ROLE_LABELS } from '@/constants';
import { useEndReached } from '@/hooks/useEndReached';
import { useInfiniteUserPosts } from '@/hooks/usePost';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { UserPostItem as UserPost } from '@/types/post';
import ErrorText from '@/components/ErrorText';
import StatusText from '@/components/StatusText';
import { postPath } from '@/utils/citySearch';

// a person's posts on their profile, newest first, the next page as the end of the list scrolls near. no "see
// more": the profile is where all of them are
export default function UserPosts({ userId }: { userId: string }) {
  const posts = useInfiniteUserPosts(userId);
  const loaded = posts.data?.pages.flat() ?? [];
  const endRef = useEndReached(posts);

  return (
    <section {...stylex.props(styles.card)}>
      <h2 {...stylex.props(styles.heading)}>Recent posts</h2>
      {posts.isPending ? (
        <StatusText xstyle={styles.status}>Loading posts…</StatusText>
      ) : posts.isError && loaded.length === 0 ? (
        <ErrorText
          message={posts.error.message}
          isRetrying={posts.isFetching}
          onRetry={() => posts.refetch()}
          xstyle={styles.status}
        />
      ) : loaded.length === 0 ? (
        <StatusText xstyle={styles.status}>No posts yet.</StatusText>
      ) : (
        <>
          <ul {...stylex.props(styles.list)}>
            {loaded.map((post) => (
              <li key={post.id}>
                <UserPostItem post={post} />
              </li>
            ))}
          </ul>
          {/* what the observer watches: the end of what's loaded */}
          <div ref={endRef} />
          {posts.isFetchingNextPage ? (
            <StatusText xstyle={styles.status}>Loading more…</StatusText>
          ) : (
            posts.isFetchNextPageError && (
              <ErrorText
                message={posts.error?.message ?? "Couldn't load more posts."}
                isRetrying={posts.isFetching}
                onRetry={() => posts.fetchNextPage()}
                xstyle={styles.status}
              />
            )
          )}
        </>
      )}
    </section>
  );
}

// a post as a line of the profile: its title, the role and its cities under it, then the start of its body. it
// opens the post's page from its first city, a local's own or where a traveler goes first
function UserPostItem({ post }: { post: UserPost }) {
  const meta = [
    ROLE_LABELS[post.role],
    post.places.map((place) => place.city).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
  const content = (
    <>
      <p {...stylex.props(styles.title)}>{post.title}</p>
      {meta && <p {...stylex.props(styles.meta)}>{meta}</p>}
      <p {...stylex.props(styles.body)}>{post.body}</p>
    </>
  );
  const firstPlace = post.places[0];

  // a post whose cities didn't load has no city page to open it from
  return firstPlace ? (
    <Link
      href={postPath(firstPlace, post.id)}
      {...stylex.props(styles.item, styles.link)}
    >
      {content}
    </Link>
  ) : (
    <div {...stylex.props(styles.item)}>{content}</div>
  );
}

const styles = stylex.create({
  card: {
    padding: { default: '22px', [breakpoints.desktop]: '32px' },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '18px',
    backgroundColor: auth.card,
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  status: {
    paddingTop: '20px',
    paddingBottom: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    listStyle: 'none',
  },
  item: {
    display: 'block',
    paddingBlock: '16px',
    paddingInline: '18px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '12px',
    overflowWrap: 'anywhere',
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    borderColor: { default: auth.cardBorder, ':hover': auth.border },
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
    transition: 'border-color 120ms ease',
  },
  title: {
    fontSize: '17px',
    fontWeight: 700,
    lineHeight: 1.35,
  },
  // the start of the body, 2 lines and … as the feed's cards cut theirs. line breaks show as spaces, so it stays one
  // paragraph
  body: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    marginTop: '8px',
    fontSize: '15px',
    lineHeight: 1.5,
    color: auth.muted,
  },
  // right under the title, it says who wrote it as what and where
  meta: {
    marginTop: '2px',
    fontSize: '14px',
    color: auth.muted,
  },
});
