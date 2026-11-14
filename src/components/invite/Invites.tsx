'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useEndReached } from '@/hooks/useEndReached';
import { useInfiniteInvites } from '@/hooks/useInvite';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import ErrorText from '@/components/ErrorText';
import StatusText from '@/components/StatusText';
import InviteCard from '@/components/invite/InviteCard';

// the pending invites sent to the viewer, newest first, the next page as the end of the list scrolls near
export default function Invites() {
  const router = useRouter();
  const invites = useInfiniteInvites();
  const loaded = invites.data?.pages.flat() ?? [];
  const endRef = useEndReached(invites);

  const notLoggedIn = invites.error instanceof NotLoggedInError;
  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);
  if (notLoggedIn) {
    return null;
  }

  return (
    <div {...stylex.props(styles.page)}>
      <h1 {...stylex.props(styles.title)}>Invites</h1>
      <p {...stylex.props(styles.subtitle)}>
        People who said hi to you. Accept to start chatting.
      </p>

      {invites.isPending ? (
        <StatusText>Loading invites…</StatusText>
      ) : invites.isError && loaded.length === 0 ? (
        <ErrorText
          message={invites.error.message}
          isRetrying={invites.isFetching}
          onRetry={() => invites.refetch()}
        />
      ) : loaded.length === 0 && !invites.hasNextPage ? (
        // only once every page is loaded: answering the last of a page empties it, the next may still have some
        <StatusText>No invites right now.</StatusText>
      ) : (
        <>
          <ul {...stylex.props(styles.list)}>
            {loaded.map((invite) => (
              <li key={invite.id}>
                <InviteCard invite={invite} />
              </li>
            ))}
          </ul>
          {/* what the observer watches: the end of what's loaded. answering cards brings it near too */}
          <div ref={endRef} />
          {invites.isFetchingNextPage ? (
            <StatusText>Loading more…</StatusText>
          ) : (
            invites.isFetchNextPageError && (
              <ErrorText
                message={invites.error?.message ?? "Couldn't load more invites."}
                isRetrying={invites.isFetching}
                onRetry={() => invites.fetchNextPage()}
              />
            )
          )}
        </>
      )}
    </div>
  );
}

const styles = stylex.create({
  // one column of cards, no wider than reads well, in the middle of the screen
  page: {
    maxWidth: '760px',
    marginInline: 'auto',
  },
  title: {
    fontSize: { default: '34px', [breakpoints.desktop]: '38px' },
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  subtitle: {
    marginTop: '6px',
    fontSize: '16px',
    lineHeight: 1.4,
    color: auth.muted,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '24px',
    listStyle: 'none',
  },
});
