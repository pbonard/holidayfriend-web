'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { NotLoggedInError } from '@/api/axios';
import { useSaveProfile } from '@/hooks/useProfile';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { ProfileFormValue } from '@/types/profile';
import Button from '@/components/Button';
import ClockIcon from '@/components/icons/ClockIcon';
import GlobeIcon from '@/components/icons/GlobeIcon';
import HeartIcon from '@/components/icons/HeartIcon';
import HomeIcon from '@/components/icons/HomeIcon';
import LightbulbIcon from '@/components/icons/LightbulbIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import SendIcon from '@/components/icons/SendIcon';
import SuitcaseIcon from '@/components/icons/SuitcaseIcon';
import AboutMeField from '@/components/onboarding/AboutMeField';
import PromptRow from '@/components/onboarding/PromptRow';

const PROMPTS = [
  { name: 'grewUpIn', label: 'I grew up in', Icon: HomeIcon },
  { name: 'languages', label: 'Languages I speak', Icon: GlobeIcon },
  {
    name: 'dreamDestination',
    label: "Where I've always wanted to go",
    Icon: SendIcon,
  },
  { name: 'obsession', label: "I'm obsessed with", Icon: HeartIcon },
  { name: 'localSpot', label: 'My favorite local spot', Icon: MapPinIcon },
  { name: 'bestTrip', label: 'Best trip so far', Icon: SuitcaseIcon },
  { name: 'birthDecade', label: 'Decade I was born', Icon: ClockIcon },
  { name: 'funFact', label: 'My fun fact', Icon: LightbulbIcon },
] as const;

export default function AboutStep() {
  const router = useRouter();
  const { getValues } = useFormContext<ProfileFormValue>();
  const saveProfileMutation = useSaveProfile();
  const notLoggedIn = saveProfileMutation.error instanceof NotLoggedInError;

  // what the first step requires has to be there, so this one can't be the way in
  useEffect(() => {
    const { name, basedInCountry, basedInCity } = getValues();
    if (!name.trim() || !basedInCountry || !basedInCity) {
      router.replace('/onboarding/profile');
    }
  }, [getValues, router]);

  useEffect(() => {
    if (notLoggedIn) {
      router.replace('/login');
    }
  }, [notLoggedIn, router]);

  const onDone = () =>
    saveProfileMutation.mutate(getValues(), {
      // replace: back must not return to a form that is already saved
      onSuccess: () => router.replace('/explore'),
    });

  return (
    <>
      <AboutMeField />
      <div {...stylex.props(styles.prompts)}>
        {PROMPTS.map((prompt) => (
          <PromptRow key={prompt.name} {...prompt} />
        ))}
      </div>
      {saveProfileMutation.isError && !notLoggedIn && (
        <p role="alert" {...stylex.props(styles.error)}>
          {saveProfileMutation.error.message}
        </p>
      )}
      <div {...stylex.props(styles.actions)}>
        <Button
          variant="secondary"
          disabled={saveProfileMutation.isPending}
          onClick={() => router.back()}
          xstyle={styles.back}
        >
          Back
        </Button>
        <Button
          disabled={saveProfileMutation.isPending}
          onClick={onDone}
          xstyle={styles.done}
        >
          Done
        </Button>
      </div>
    </>
  );
}

const styles = stylex.create({
  prompts: {
    marginTop: '28px',
    display: 'grid',
    gridTemplateColumns: { default: '1fr', [breakpoints.desktop]: '1fr 1fr' },
    columnGap: '32px',
  },
  error: {
    marginTop: '28px',
    fontSize: '14px',
    lineHeight: '20px',
    color: auth.danger,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '28px',
  },
  back: {
    width: '90px',
    backgroundColor: 'transparent',
  },
  done: {
    width: '100px',
  },
});
