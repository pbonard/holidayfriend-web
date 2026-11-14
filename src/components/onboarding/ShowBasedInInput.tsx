'use client';

import { Controller, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import type { ProfileFormValue } from '@/types/profile';
import Toggle from '@/components/Toggle';

// how much of where they're based in shows on their posts: two switches over one value. the city on turns the
// country on, the country off turns the city off
export default function ShowBasedInInput() {
  const { control } = useFormContext<ProfileFormValue>();

  return (
    <Controller
      name="showBasedIn"
      control={control}
      render={({ field: { value: showBasedIn, onChange } }) => (
        <div {...stylex.props(styles.visibility)}>
          <Toggle
            label="Show your country"
            description="On your posts, so people from home can find you"
            checked={showBasedIn !== 'none'}
            onChange={(on) => onChange(on ? 'country' : 'none')}
          />
          <Toggle
            label="Show your city"
            description="Shows your country too"
            checked={showBasedIn === 'city'}
            onChange={(on) => onChange(on ? 'city' : 'country')}
          />
        </div>
      )}
    />
  );
}

const styles = stylex.create({
  visibility: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '28px',
  },
});
