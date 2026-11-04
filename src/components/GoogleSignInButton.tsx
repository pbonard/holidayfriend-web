'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useMutation } from '@tanstack/react-query';
import * as stylex from '@stylexjs/stylex';
import { field } from '@/styles/field';
import { signInWithGoogle } from '@/api/auth';

const MAX_BUTTON_WIDTH = 400; // the most google's button accepts

// google only hands out an id token through its own rendered button, so this can't be our Button
export default function GoogleSignInButton() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const signIn = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: () => router.replace('/'),
  });

  const renderButton = () => {
    const container = containerRef.current;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID;
    if (!container || !clientId) {
      return;
    }
    google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => signIn.mutate(credential),
    });
    google.accounts.id.renderButton(container, {
      type: 'standard',
      size: 'large',
      text: 'continue_with',
      width: Math.min(container.offsetWidth, MAX_BUTTON_WIDTH),
    });
  };

  return (
    <div>
      {/* hl: the button's label otherwise follows the browser's language, the page is in english */}
      <Script
        src="https://accounts.google.com/gsi/client?hl=en"
        onReady={renderButton}
      />
      <div ref={containerRef} {...stylex.props(styles.button)} />
      {signIn.isError && (
        <p role="alert" {...stylex.props(field.error)}>
          Couldn&apos;t sign in with Google. Please try again.
        </p>
      )}
    </div>
  );
}

const styles = stylex.create({
  // holds the space until google's script draws the button
  button: {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '44px',
  },
});
