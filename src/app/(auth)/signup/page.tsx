import type { Metadata } from 'next';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import AuthHeader from '@/components/AuthHeader';
import SignupForm from '@/components/SignupForm';
import TextLink from '@/components/TextLink';

export const metadata: Metadata = {
  title: 'Create your account · Holiday Friend',
};

export default function SignupPage() {
  return (
    <>
      <AuthHeader title="Create your account" />
      <SignupForm />
      <p {...stylex.props(styles.terms)}>
        By continuing, you agree to our <TextLink href="/terms">Terms of Service</TextLink> and{' '}
        <TextLink href="/privacy">Privacy Policy</TextLink>.
      </p>
    </>
  );
}

const styles = stylex.create({
  terms: {
    marginTop: '24px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: auth.muted,
  },
});
