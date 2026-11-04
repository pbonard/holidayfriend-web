import type { Metadata } from 'next';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import AuthHeader from '@/components/auth/AuthHeader';
import BackLink from '@/components/BackLink';
import PhoneForm from '@/components/PhoneForm';

export const metadata: Metadata = {
  title: 'Verify your phone number · Holiday Friend',
};

export default function PhonePage() {
  return (
    <>
      <BackLink href="/signup" />
      <AuthHeader
        title="Verify your phone number"
        description="We'll text you a 6-digit code to confirm it's you."
      />
      <PhoneForm />
      <p {...stylex.props(styles.note)}>
        Message and data rates may apply. Your number isn&apos;t shown on your profile.
      </p>
    </>
  );
}

const styles = stylex.create({
  note: {
    marginTop: '24px',
    fontSize: '13px',
    lineHeight: 1.6,
    color: auth.muted,
  },
});
