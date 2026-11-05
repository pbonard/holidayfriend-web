'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import * as stylex from '@stylexjs/stylex';
import { breakpoints } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import { useSignInWithGoogle } from '@/hooks/useAuth';

const REDRAW_DELAY_MS = 150; // redraws load google's frame again, so not on every pixel of a resize

// google only hands out an id token through its own rendered button, so this can't be our Button
export default function GoogleSignInButton() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const signInWithGoogleMutation = useSignInWithGoogle();

  const [initialized, setInitialized] = useState(false);

  const initialize = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID;
    if (!clientId) {
      return;
    }
    google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) =>
        signInWithGoogleMutation.mutate(credential, {
          onSuccess: () => router.replace('/'),
        }),
    });
    setInitialized(true);
  };

  // google's button has a fixed width, so it's drawn again whenever the space for it changes
  useEffect(() => {
    const container = containerRef.current;
    if (!initialized || !container) {
      return;
    }
    let drawnWidth = 0;
    let timer: ReturnType<typeof setTimeout>;
    const draw = (width: number) => {
      container.replaceChildren();
      google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        width,
      });
    };
    const observer = new ResizeObserver(() => {
      const width = container.offsetWidth;
      if (width === drawnWidth) {
        return;
      }
      const isFirstDraw = drawnWidth === 0;
      drawnWidth = width;
      clearTimeout(timer);
      timer = setTimeout(() => draw(width), isFirstDraw ? 0 : REDRAW_DELAY_MS);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [initialized]);

  return (
    <div>
      {/* hl: the button's label otherwise follows the browser's language, the page is in english */}
      <Script
        src="https://accounts.google.com/gsi/client?hl=en"
        onReady={initialize}
      />
      <div ref={containerRef} {...stylex.props(styles.button)} />
      {signInWithGoogleMutation.isError && (
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
    // the same box as the form's controls, google draws its button at the width it's given
    position: 'relative',
    left: '1px',
    width: '100%',
    maxWidth: { default: '260px', [breakpoints.desktop]: '278px' },
    marginInline: 'auto',
    minHeight: '40px',
    // the frame inside must not hold the column open when the window gets narrower
    contain: 'inline-size',
    overflow: 'hidden',
  },
});
