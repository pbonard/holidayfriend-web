'use client';

import { useId, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import type { ProfileFormValue } from '@/types/profile';
import CitySearch from '@/components/CitySearch';
import CloseIcon from '@/components/icons/CloseIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import { placeLabel } from '@/utils/citySearch';

// the city the profile is based in, with its country: one search for both. the city holds the rule and the
// error, and its ref is what a failed submit focuses
export default function BasedInInput() {
  const { control, setValue } = useFormContext<ProfileFormValue>();
  const basedInCountry = useWatch({ control, name: 'basedInCountry' });
  const errorId = useId();
  // after changing a picked city, the search opens with the keyboard up
  const [changing, setChanging] = useState(false);

  return (
    <Controller
      name="basedInCity"
      control={control}
      rules={{
        validate: (city, { basedInCountry: country }) =>
          (Boolean(city) && Boolean(country)) || 'Select your city',
      }}
      render={({
        field: { value: basedInCity, onChange, ref },
        fieldState: { error },
      }) => {
        const basedIn =
          basedInCountry && basedInCity
            ? { country: basedInCountry, city: basedInCity }
            : null;

        return (
          <div {...stylex.props(field.root)}>
            {basedIn ? (
              <div {...stylex.props(styles.picked)}>
                <MapPinIcon size={18} xstyle={styles.pin} />
                <span {...stylex.props(styles.pickedLabel)}>
                  {placeLabel(basedIn)}
                </span>
                <button
                  type="button"
                  aria-label={`Change ${placeLabel(basedIn)}`}
                  onClick={() => {
                    setValue('basedInCountry', '');
                    onChange('');
                    setChanging(true);
                  }}
                  {...stylex.props(styles.change)}
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ) : (
              <CitySearch
                label="Search your city"
                autoFocus={changing}
                inputRef={ref}
                invalid={Boolean(error)}
                describedBy={error ? errorId : undefined}
                onPick={({ country, city }) => {
                  setValue('basedInCountry', country);
                  // through the controller, so the error goes once a city is picked
                  onChange(city);
                }}
              />
            )}
            {error?.message && (
              <p id={errorId} role="alert" {...stylex.props(field.error)}>
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

const styles = stylex.create({
  // the picked city, as tall as the search it replaces
  picked: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    height: '48px',
    paddingLeft: '16px',
    paddingRight: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '10px',
    backgroundColor: auth.control,
  },
  pin: {
    flexShrink: 0,
    color: auth.muted,
  },
  pickedLabel: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '16px',
  },
  change: {
    display: 'flex',
    padding: '8px',
    borderWidth: 0,
    borderRadius: '8px',
    backgroundColor: { default: 'transparent', ':hover': auth.border },
    color: { default: auth.muted, ':hover': auth.text },
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
});
