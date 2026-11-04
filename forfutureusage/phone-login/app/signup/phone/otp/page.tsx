import type { Metadata } from 'next';
import AuthHeader from '@/components/AuthHeader';
import BackLink from '@/components/BackLink';
import CodeForm from '@/components/CodeForm';
import TextLink from '@/components/TextLink';

export const metadata: Metadata = {
  title: 'Enter the 6-digit code · Holiday Friend',
};

export default function PhoneCodePage() {
  return (
    <>
      <BackLink href="/signup/phone" />
      <AuthHeader
        title="Enter the 6-digit code"
        description={
          <>
            We sent it to your phone. <TextLink href="/signup/phone">Change</TextLink>
          </>
        }
      />
      <CodeForm />
    </>
  );
}
