'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import { EMAIL } from '@/constants';
import {
  useLoginWithAuthenticator,
  useStartAuthenticatorReset,
} from '@/hooks/useAuth';
import Button from '@/components/Button';
import OTPInput from '@/components/auth/OTPInput';

interface FormValue {
  otp: string;
}

export default function AuthenticatorLoginForm() {
  const router = useRouter();
  const loginForm = useForm<FormValue>({ defaultValues: { otp: '' } });
  const loginWithAuthenticatorMutation = useLoginWithAuthenticator();
  const startAuthenticatorResetMutation = useStartAuthenticatorReset();
  const clearResetRequest = startAuthenticatorResetMutation.reset;

  const onSubmit = ({ otp }: FormValue) =>
    loginWithAuthenticatorMutation.mutate(otp, {
      onSuccess: () => router.replace('/'),
      onError: ({ message }) => loginForm.setError('otp', { message }),
    });

  useEffect(() => {
    if (!sessionStorage.getItem(EMAIL)) {
      router.replace('/login');
    }
  }, [router]);

  // the router keeps left pages alive, nothing typed here stays behind. a layout effect, the fields stop listening
  // to the form before a normal one is cleaned up
  useLayoutEffect(
    () => () => {
      loginForm.reset();
      clearResetRequest();
    },
    [loginForm, clearResetRequest],
  );

  return (
    <FormProvider {...loginForm}>
      <form noValidate onSubmit={loginForm.handleSubmit(onSubmit)}>
        <OTPInput />
        <Button
          type="submit"
          disabled={loginWithAuthenticatorMutation.isPending}
          xstyle={styles.submit}
        >
          Log in
        </Button>
      </form>
      <p {...stylex.props(styles.reset)}>
        Lost your phone?
        <button
          type="button"
          disabled={startAuthenticatorResetMutation.isPending}
          onClick={() =>
            startAuthenticatorResetMutation.mutate(undefined, {
              onSuccess: () => router.push('/login/reset/code'),
            })
          }
          {...stylex.props(styles.resetButton)}
        >
          Reset your authenticator
        </button>
      </p>
      {startAuthenticatorResetMutation.error && (
        <p role="alert" {...stylex.props(field.error)}>
          {startAuthenticatorResetMutation.error.message}
        </p>
      )}
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
  reset: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '24px',
    fontSize: '14px',
    color: auth.muted,
  },
  resetButton: {
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
