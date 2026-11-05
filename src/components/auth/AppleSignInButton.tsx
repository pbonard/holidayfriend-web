'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import * as stylex from '@stylexjs/stylex';
import { field } from '@/styles/field';
import { useSignInWithApple } from '@/hooks/useAuth';
import AppleIcon from '@/components/icons/AppleIcon';
import Button from '@/components/Button';

const CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_SIGN_IN_CLIENT_ID;
// not an error, the person just changed their mind
const CANCELLED = ['popup_closed_by_user', 'user_cancelled_authorize'];

function wasCancelled(error: unknown) {
  return CANCELLED.includes((error as { error?: string }).error ?? '');
}

export default function AppleSignInButton() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const signInWithAppleMutation = useSignInWithApple();

  return (
    <div>
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        onReady={() => setReady(true)}
      />
      <div {...stylex.props(styles.row)}>
        <Button
          variant="secondary"
          // stays disabled until NEXT_PUBLIC_APPLE_SIGN_IN_CLIENT_ID is set
          disabled={!CLIENT_ID || !ready || signInWithAppleMutation.isPending}
          onClick={() =>
            CLIENT_ID &&
            signInWithAppleMutation.mutate(CLIENT_ID, { onSuccess: () => router.replace('/') })
          }
          xstyle={styles.button}
        >
          <span {...stylex.props(styles.tile)}>
            <AppleIcon size={16} />
          </span>
          Continue with Apple
        </Button>
      </div>
      {signInWithAppleMutation.isError && !wasCancelled(signInWithAppleMutation.error) && (
        <p role="alert" {...stylex.props(field.error)}>
          Couldn&apos;t sign in with Apple. Please try again.
        </p>
      )}
    </div>
  );
}

// the same box google draws for its large filled_black button, which can't be restyled to match ours
const styles = stylex.create({
  row: {
    display: 'flex',
    justifyContent: 'center',
  },
  button: {
    position: 'relative',
    // google's button sits 1px off center inside its frame
    left: '1px',
    maxWidth: '318px',
    height: '32px',
    borderWidth: 0,
    borderRadius: '4px',
    backgroundColor: { default: '#202124', ':hover': '#303134' },
    color: '#e8eaed',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.25px',
    // google centers its text in the space right of the logo tile
    paddingLeft: '28px',
    // no fading while the script loads, so it never looks different from google's button
    opacity: 1,
  },
  tile: {
    position: 'absolute',
    left: 0,
    top: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    color: '#ffffff',
  },
});
