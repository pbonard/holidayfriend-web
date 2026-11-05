import type { Metadata } from 'next';
import AuthHeader from '@/components/auth/AuthHeader';
import EmailCodeForm from '@/components/auth/EmailCodeForm';
import BackLink from '@/components/BackLink';

export const metadata: Metadata = {
  title: 'Enter the 6-digit code · Holidayfriend',
};

export default function ResetCodePage() {
  return (
    <>
      <BackLink />
      <AuthHeader
        title="Enter the 6-digit code"
        description="We sent it to your email."
      />
      <EmailCodeForm isReset />
    </>
  );
}
