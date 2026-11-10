'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useProfileStatus } from '@/hooks/useProfile';
import { auth, spacing } from '@/styles/tokens.stylex';
import ErrorText from '@/components/ErrorText';

export default function AuthRoute() {
  const router = useRouter();
  const profile = useProfileStatus();
  const hasProfile = profile.data?.hasProfile;
  const notLoggedIn = profile.error instanceof NotLoggedInError;

  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    } else if (hasProfile === false) {
      router.replace('/onboarding/profile');
    } else if (hasProfile) {
      router.replace('/explore');
    }
  }, [notLoggedIn, hasProfile, router]);

  // not onboarding: this failing says nothing about whether they have a profile
  if (profile.isError && !notLoggedIn) {
    return (
      <main {...stylex.props(styles.main)}>
        <ErrorText
          message="Couldn't load your account."
          isRetrying={profile.isFetching}
          onRetry={() => profile.refetch()}
          xstyle={styles.retry}
        />
      </main>
    );
  }

  return null;
}

const styles = stylex.create({
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: spacing.xl,
    color: auth.text,
  },
  // in the middle of a screen of its own
  retry: {
    alignItems: 'center',
  },
});
