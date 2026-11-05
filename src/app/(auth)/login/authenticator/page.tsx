import type { Metadata } from 'next';
import AuthenticatorLoginForm from '@/components/auth/AuthenticatorLoginForm';
import AuthHeader from '@/components/auth/AuthHeader';
import BackLink from '@/components/BackLink';

export const metadata: Metadata = {
  title: 'Enter your code · Holidayfriend',
};

export default function AuthenticatorLoginPage() {
  return (
    <>
      <BackLink />
      <AuthHeader
        title="Enter your code"
        description="Open your Authenticator and enter 6-digit code."
      />
      <AuthenticatorLoginForm />
    </>
  );
}
