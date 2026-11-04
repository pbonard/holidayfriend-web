'use client';

import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import AppleSignInButton from '@/components/auth/AppleSignInButton';
import Button from '@/components/Button';
import EmailInput from '@/components/auth/EmailInput';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

interface FormValue {
  email: string;
}

export default function SignupForm() {
  const emailSignupForm = useForm<FormValue>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (formValues: FormValue) => {
    // no signup api yet, the email reaching here has already passed EmailInput's validation
    void formValues;
  };

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.providers)}>
        <GoogleSignInButton />
        <AppleSignInButton />
      </div>

      <p {...stylex.props(styles.divider)}>or</p>

      <FormProvider {...emailSignupForm}>
        {/* noValidate: react-hook-form shows the errors instead of the browser's bubbles */}
        <form
          noValidate
          onSubmit={emailSignupForm.handleSubmit(onSubmit)}
          {...stylex.props(styles.form)}
        >
          <EmailInput />
          <Button
            type="submit"
            disabled={emailSignupForm.formState.isSubmitting}
            xstyle={styles.submit}
          >
            Continue with email
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '40px',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '8px',
    backgroundColor: 'transparent',
  },
  providers: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  divider: {
    fontSize: '14px',
    color: auth.muted,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  // the same box as the google and apple buttons above it
  submit: {
    position: 'relative',
    left: '1px',
    alignSelf: 'center',
    maxWidth: '318px',
    height: '32px',
    marginTop: '10px',
    borderRadius: '4px',
    fontSize: '14px',
  },
});
