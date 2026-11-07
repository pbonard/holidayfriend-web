'use client';

import { useEffect, useEffectEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { useAuthContext } from '@/contexts/AuthContext';
import { useConfirmAuthenticatorSetup } from '@/hooks/useAuth';
import Button from '@/components/Button';
import AuthenticatorQRCode from '@/components/auth/AuthenticatorQRCode';
import OTPInput from '@/components/auth/OTPInput';

interface FormValue {
  otp: string;
}

export default function AuthenticatorSetupForm({ reset }: { reset?: boolean }) {
  const router = useRouter();
  const { authenticatorSetup: setup, setAuthenticatorSetup } = useAuthContext();
  const setupForm = useForm<FormValue>({ defaultValues: { otp: '' } });
  const confirmAuthenticatorSetupMutation = useConfirmAuthenticatorSetup();

  const redirectWithoutSetup = useEffectEvent(() => {
    if (!setup) {
      router.replace('/login');
    }
  });

  // only when the page shows, finishing the setup clears it too and goes elsewhere
  useEffect(() => {
    redirectWithoutSetup();
  }, []);

  // the router keeps this page alive, a new setup starts with nothing typed for the last one
  const setupToken = setup?.setupToken;
  useEffect(() => {
    setupForm.reset();
  }, [setupToken, setupForm]);

  if (!setup) {
    return null;
  }

  const onSubmit = ({ otp }: FormValue) =>
    confirmAuthenticatorSetupMutation.mutate(otp, {
      onSuccess: () => {
        router.replace('/');
        setAuthenticatorSetup(null);
      },
      onError: () =>
        setupForm.setError('otp', {
          message: 'Incorrect code. Check the latest one in your app',
        }),
    });

  return (
    <FormProvider {...setupForm}>
      <AuthenticatorQRCode setup={setup} />
      <form noValidate onSubmit={setupForm.handleSubmit(onSubmit)}>
        <OTPInput />
        <Button
          type="submit"
          disabled={confirmAuthenticatorSetupMutation.isPending}
          xstyle={styles.submit}
        >
          {reset ? 'Reset' : 'Verify'}
        </Button>
      </form>
    </FormProvider>
  );
}

const styles = stylex.create({
  submit: {
    height: '32px',
    marginTop: '28px',
    borderRadius: '4px',
    fontSize: '14px',
  },
});
