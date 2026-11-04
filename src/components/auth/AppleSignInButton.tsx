'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useMutation } from '@tanstack/react-query';
import * as stylex from '@stylexjs/stylex';
import { field } from '@/styles/field';
import { signInWithApple } from '@/api/auth';
import AppleIcon from '@/components/auth/AppleIcon';
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
  const signIn = useMutation({
    mutationFn: async (clientId: string) => {
      AppleID.auth.init({
        clientId,
        scope: 'email',
        // popup mode never navigates here, but apple requires it to be registered on the services id
        redirectURI: `${window.location.origin}/signup`,
        // the backend claims each nonce once, so a token can't be replayed
        nonce: crypto.randomUUID(),
        usePopup: true,
      });
      const { authorization } = await AppleID.auth.signIn();
      await signInWithApple(authorization.id_token);
    },
    onSuccess: () => router.replace('/'),
  });

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
          disabled={!CLIENT_ID || !ready || signIn.isPending}
          onClick={() => CLIENT_ID && signIn.mutate(CLIENT_ID)}
          xstyle={styles.button}
        >
          <span {...stylex.props(styles.tile)}>
            <AppleIcon />
          </span>
          Continue with Apple
        </Button>
      </div>
      {signIn.isError && !wasCancelled(signIn.error) && (
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
    maxWidth: '398px',
    height: '36px',
    borderWidth: 0,
    borderRadius: '4px',
    backgroundColor: { default: '#202124', ':hover': '#303134' },
    color: '#e8eaed',
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.25px',
    // google centers its text in the space right of the logo tile
    paddingLeft: '36px',
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
    width: '36px',
    height: '36px',
    color: '#ffffff',
  },
});
