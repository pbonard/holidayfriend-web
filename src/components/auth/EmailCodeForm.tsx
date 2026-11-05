'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { VERIFICATION_ID } from '@/constants';
import { useResendEmailOTP, useVerifyEmailOTP } from '@/hooks/useAuth';
import Button from '@/components/Button';
import OTPInput from '@/components/auth/OTPInput';

interface FormValue {
  otp: string;
}

export default function EmailCodeForm({
  isReset = false,
}: {
  isReset?: boolean;
}) {
  const router = useRouter();
  const emailOTPForm = useForm<FormValue>({
    defaultValues: {
      otp: '',
    },
  });
  const verifyEmailOTPMutation = useVerifyEmailOTP();
  const resendEmailOTPMutation = useResendEmailOTP(isReset);

  // the 6 digits reaching here are already checked by OTPInput
  const onSubmit = ({ otp }: FormValue) =>
    verifyEmailOTPMutation.mutate(otp, {
      onSuccess: () =>
        router.replace(isReset ? '/login/reset/setup' : '/signup/setup'),
      onError: () =>
        emailOTPForm.setError('otp', {
          message: 'That code is incorrect or has expired',
        }),
    });

  useEffect(() => {
    if (!sessionStorage.getItem(VERIFICATION_ID)) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <FormProvider {...emailOTPForm}>
      <form noValidate onSubmit={emailOTPForm.handleSubmit(onSubmit)}>
        <OTPInput />
        <Button
          type="submit"
          disabled={verifyEmailOTPMutation.isPending}
          xstyle={styles.submit}
        >
          Verify
        </Button>
      </form>
      <p {...stylex.props(styles.resend)}>
        Didn&apos;t get and spam also don&apos;t have it?
        <button
          type="button"
          disabled={resendEmailOTPMutation.isPending}
          onClick={() =>
            resendEmailOTPMutation.mutate(undefined, {
              onSuccess: () => emailOTPForm.clearErrors('otp'),
              onError: ({ message }) =>
                emailOTPForm.setError('otp', { message }),
            })
          }
          {...stylex.props(styles.resendButton)}
        >
          Resend code
        </button>
      </p>
    </FormProvider>
  );
}

const styles = stylex.create({
  submit: {
    height: '32px',
    marginTop: '20px',
    borderRadius: '4px',
    fontSize: '14px',
  },
  resend: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '24px',
    fontSize: '14px',
    color: auth.muted,
  },
  resendButton: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 700,
    color: { default: auth.link, ':hover': auth.text },
    cursor: 'pointer',
  },
});
