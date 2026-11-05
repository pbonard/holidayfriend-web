import type { Metadata } from 'next';
import AuthenticatorSetupForm from '@/components/auth/AuthenticatorSetupForm';
import AuthHeader from '@/components/auth/AuthHeader';

export const metadata: Metadata = {
  title: 'Set up your authenticator · Holidayfriend',
};

export default function AuthenticatorSetupPage() {
  return (
    <>
      <AuthHeader
        title="Set up your authenticator"
        description={
          <>
            Scan QR with an Authenticator application, then enter 6-digit code
            it shows.
            <br />
            We&apos;ll ask 6-digit again next time you login.
          </>
        }
      />
      <AuthenticatorSetupForm />
    </>
  );
}
