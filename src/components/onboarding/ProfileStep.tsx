'use client';

import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { ProfileFormValue } from '@/types/profile';
import Button from '@/components/Button';
import BasedInInput from '@/components/onboarding/BasedInInput';
import NameInput from '@/components/onboarding/NameInput';
import ShowBasedInInput from '@/components/onboarding/ShowBasedInInput';

// the name and the city. the name comes first: a failed submit focuses the first field registered, which is the
// first one rendered
export default function ProfileStep() {
  const router = useRouter();
  const { handleSubmit } = useFormContext<ProfileFormValue>();

  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => router.push('/onboarding/about'))}
    >
      <NameInput />

      <fieldset {...stylex.props(styles.basedIn)}>
        <legend {...stylex.props(styles.label)}>
          Currently based in <span {...stylex.props(styles.required)}>*</span>
        </legend>
        <BasedInInput />
        <ShowBasedInInput />
      </fieldset>

      <div {...stylex.props(styles.actions)}>
        <Button type="submit" xstyle={styles.next}>
          Next
        </Button>
      </div>
    </form>
  );
}

const styles = stylex.create({
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 700,
  },
  required: {
    color: auth.danger,
  },
  basedIn: {
    marginTop: '36px',
    borderWidth: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '36px',
  },
  next: {
    width: { default: '100%', [breakpoints.desktop]: '100px' },
  },
});
