'use client';

import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import { useStartEmailLogin } from '@/hooks/useAuth';
import AppleSignInButton from '@/components/auth/AppleSignInButton';
import Button from '@/components/Button';
import EmailInput from '@/components/auth/EmailInput';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

interface FormValue {
  email: string;
}

export default function SignupForm() {
  const router = useRouter();
  const emailSignupForm = useForm<FormValue>({
    defaultValues: {
      email: '',
    },
  });

  const startEmailLoginMutation = useStartEmailLogin();

  // the email reaching here has already passed EmailInput's validation
  const onSubmit = ({ email }: FormValue) =>
    startEmailLoginMutation.mutate(email, {
      onSuccess: ({ isSignup }) => router.push(isSignup ? '/signup/code' : '/login/authenticator'),
      onError: ({ message }) => emailSignupForm.setError('email', { message }),
    });

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
            disabled={startEmailLoginMutation.isPending}
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
    gap: '24px',
    // the box only frames the form next to the picture, without the picture the form stands alone
    paddingBlock: { default: 0, [breakpoints.desktop]: '36px' },
    paddingInline: { default: 0, [breakpoints.desktop]: '40px' },
    borderWidth: { default: 0, [breakpoints.desktop]: '0.5px' },
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '8px',
    backgroundColor: 'transparent',
  },
  providers: {
    // an error of either button shows below both of them, in the gap above "or"
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    maxWidth: { default: '260px', [breakpoints.desktop]: '278px' },
    height: '40px',
    marginTop: '28px',
    borderRadius: '4px',
    fontSize: '14px',
  },
});
