'use client';

import { usePathname } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, fonts } from '@/styles/tokens.stylex';
import type { ProfileFormValue } from '@/types/profile';

const STEPS = ['/onboarding/profile', '/onboarding/about'];

// the form lives here, so what was typed in a step is still there when coming back to it
export default function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = Math.max(STEPS.indexOf(pathname), 0) + 1;
  const profileForm = useForm<ProfileFormValue>({
    defaultValues: {
      name: '',
      basedInCountry: '',
      basedInCity: '',
      aboutMe: '',
      grewUpIn: '',
      languages: '',
      dreamDestination: '',
      obsession: '',
      localSpot: '',
      bestTrip: '',
      birthDecade: '',
      funFact: '',
      showBasedIn: 'city',
    },
  });

  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.bar)}>
          <span {...stylex.props(styles.brand)}>Holidayfriend</span>
          <span {...stylex.props(styles.step)}>
            Step {step} of {STEPS.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Profile setup"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step}
          {...stylex.props(styles.track)}
        >
          <div {...stylex.props(styles.progress, step === 1 && styles.halfway)} />
        </div>
      </header>
      <main {...stylex.props(styles.main)}>
        <section {...stylex.props(styles.card)}>
          <FormProvider {...profileForm}>{children}</FormProvider>
        </section>
      </main>
    </div>
  );
}

const styles = stylex.create({
  page: {
    minHeight: '100vh',
    backgroundColor: auth.page,
    color: auth.text,
    fontFamily: fonts.sans,
  },
  header: {
    backgroundColor: auth.card,
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: { default: '48px', [breakpoints.desktop]: '56px' },
    paddingInline: { default: '20px', [breakpoints.desktop]: '120px' },
  },
  brand: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  step: {
    fontSize: '14px',
    fontWeight: 500,
    color: auth.muted,
  },
  track: {
    height: '5px',
    backgroundColor: auth.border,
  },
  progress: {
    width: '100%',
    height: '100%',
    backgroundColor: auth.accent,
    transition: 'width 200ms ease',
  },
  halfway: {
    width: '50%',
  },
  main: {
    display: 'flex',
    justifyContent: 'center',
    paddingBlock: { default: 0, [breakpoints.desktop]: '64px' },
    paddingInline: { default: 0, [breakpoints.desktop]: '20px' },
  },
  card: {
    width: '100%',
    maxWidth: { default: 'none', [breakpoints.desktop]: '760px' },
    paddingBlock: { default: '28px', [breakpoints.desktop]: '40px' },
    paddingInline: { default: '20px', [breakpoints.desktop]: '40px' },
    backgroundColor: auth.card,
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderBottomWidth: '1px',
    borderRadius: { default: 0, [breakpoints.desktop]: '18px' },
  },
});
