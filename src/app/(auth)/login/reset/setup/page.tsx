import type { Metadata } from 'next';
import AuthenticatorSetupForm from '@/components/auth/AuthenticatorSetupForm';
import AuthHeader from '@/components/auth/AuthHeader';

export const metadata: Metadata = {
  title: 'Set up a new authenticator · Holidayfriend',
};

export default function ResetSetupPage() {
  return (
    <>
      <AuthHeader
        title="Set up a new authenticator"
        description="Scan this with Google Authenticator on your phone, then enter 6-digit code it shows."
      />
      <AuthenticatorSetupForm reset />
    </>
  );
}
