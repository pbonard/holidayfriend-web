import type { Metadata } from 'next';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import SignupForm from '@/components/auth/SignupForm';
import TextLink from '@/components/TextLink';

export const metadata: Metadata = {
  title: 'Holidayfriend',
};

export default function SignupPage() {
  return (
    <>
      <header {...stylex.props(styles.brand)}>
        <h1 {...stylex.props(styles.logo)}>Holidayfriend</h1>
        <p {...stylex.props(styles.tagline)}>For travelers who want to meet locals</p>
      </header>
      <SignupForm />
      <p {...stylex.props(styles.terms)}>
        By continuing, you agree to our <TextLink href="/terms">Terms of Service</TextLink> and{' '}
        <TextLink href="/privacy">Privacy Policy</TextLink>.
      </p>
    </>
  );
}

const styles = stylex.create({
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: { default: '16px', [breakpoints.desktop]: '20px' },
    marginBottom: '32px',
    textAlign: 'center',
  },
  logo: {
    fontFamily: 'var(--font-newsreader), Georgia, serif',
    fontSize: { default: '44px', [breakpoints.desktop]: '54px' },
    fontWeight: 400,
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  tagline: {
    fontFamily: 'var(--font-newsreader), Georgia, serif',
    fontSize: { default: '19px', [breakpoints.desktop]: '21px' },
    fontStyle: 'italic',
    fontWeight: 300,
    letterSpacing: '0.005em',
    color: auth.muted,
  },
  terms: {
    // without the form's box it lines up with the buttons, which are 1px off center to follow google's
    position: 'relative',
    left: { default: '1px', [breakpoints.desktop]: 0 },
    maxWidth: { default: '260px', [breakpoints.desktop]: 'none' },
    marginInline: { default: 'auto', [breakpoints.desktop]: 0 },
    marginTop: '24px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: auth.muted,
  },
});
