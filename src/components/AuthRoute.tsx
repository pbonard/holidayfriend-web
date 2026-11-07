'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useProfileStatus } from '@/hooks/useProfile';
import { auth, spacing } from '@/styles/tokens.stylex';
import Button from '@/components/Button';

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
        <p role="alert">Couldn&apos;t load your account.</p>
        <Button
          disabled={profile.isFetching}
          onClick={() => profile.refetch()}
          xstyle={styles.retry}
        >
          Try again
        </Button>
      </main>
    );
  }

  return null;
}

const styles = stylex.create({
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: '100vh',
    padding: spacing.xl,
    color: auth.text,
  },
  retry: {
    width: '140px',
    height: '40px',
    fontSize: '14px',
  },
});
