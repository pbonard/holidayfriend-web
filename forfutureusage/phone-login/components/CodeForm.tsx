'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { resendSMSOTP, verifySMSOTP } from '@/api/auth';
import Button from '@/components/Button';
import OTPInput from '@/components/auth/OTPInput';

interface FormValue {
  otp: string;
}

export default function CodeForm() {
  const router = useRouter();
  const smsOTPForm = useForm<FormValue>({
    defaultValues: {
      otp: '',
    },
  });
  const verify = useMutation({
    mutationFn: verifySMSOTP,
    onSuccess: () => router.replace('/'),
    onError: ({ message }) => smsOTPForm.setError('otp', { message }),
  });
  const resend = useMutation({
    mutationFn: resendSMSOTP,
    onError: ({ message }) => smsOTPForm.setError('otp', { message }),
  });

  // the 6 digits reaching here are already checked by OTPInput
  const onSubmit = ({ otp }: FormValue) => verify.mutate(otp);

  return (
    <FormProvider {...smsOTPForm}>
      <form noValidate onSubmit={smsOTPForm.handleSubmit(onSubmit)}>
        <OTPInput />
        <Button
          type="submit"
          disabled={verify.isPending}
          xstyle={styles.submit}
        >
          Verify
        </Button>
      </form>
      <p {...stylex.props(styles.resend)}>
        Didn&apos;t get it?
        <button
          type="button"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
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
    marginTop: '20px',
  },
  resend: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '32px',
    fontSize: '15px',
    color: auth.muted,
  },
  resendButton: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 700,
    color: { default: auth.link, ':hover': auth.text },
    cursor: 'pointer',
  },
});
