'use client';

import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import EmailInput from '@/components/EmailInput';
import GoogleSignInButton from '@/components/GoogleSignInButton';

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
        <Button variant="secondary">Continue with Apple</Button>
      </div>

      <div {...stylex.props(styles.divider)} role="separator">
        <span {...stylex.props(styles.rule)} />
        <span>or with email</span>
        <span {...stylex.props(styles.rule)} />
      </div>

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
            Create account
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
    gap: '24px',
  },
  providers: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: auth.muted,
  },
  rule: {
    flexGrow: 1,
    height: '1px',
    backgroundColor: auth.border,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submit: {
    marginTop: '16px',
  },
});
