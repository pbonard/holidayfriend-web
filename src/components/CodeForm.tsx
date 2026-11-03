'use client';

import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import OTPInput from '@/components/OTPInput';

interface FormValue {
  otp: string;
}

export default function CodeForm() {
  const smsOTPForm = useForm<FormValue>({
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (formValues: FormValue) => {
    // no sms api yet, the 6 digits reaching here are already checked by OTPInput
    void formValues;
  };

  const resendCode = () => {
    // no sms api yet, the code would be requested again for the saved number
  };

  return (
    <FormProvider {...smsOTPForm}>
      <form noValidate onSubmit={smsOTPForm.handleSubmit(onSubmit)}>
        <OTPInput />
        <Button type="submit" disabled={smsOTPForm.formState.isSubmitting} xstyle={styles.submit}>
          Verify
        </Button>
      </form>
      <p {...stylex.props(styles.resend)}>
        Didn&apos;t get it?
        <button type="button" onClick={resendCode} {...stylex.props(styles.resendButton)}>
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
