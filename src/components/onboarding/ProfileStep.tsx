'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import type { ProfileFormValue } from '@/types/profile';
import Button from '@/components/Button';
import CitySearch from '@/components/CitySearch';
import CloseIcon from '@/components/icons/CloseIcon';
import MapPinIcon from '@/components/icons/MapPinIcon';
import Toggle from '@/components/Toggle';
import { placeLabel } from '@/utils/citySearch';

export default function ProfileStep() {
  const router = useRouter();
  const nameErrorId = useId();
  const nameId = useId();
  const basedInErrorId = useId();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useFormContext<ProfileFormValue>();
  const nameError = errors.name?.message;
  // registered before the city below: a failed submit focuses the first field registered, and name is above it
  const nameField = register('name', {
    validate: (data) => data.trim().length > 0 || 'Enter your name',
  });
  const basedInCountry = useWatch<ProfileFormValue, 'basedInCountry'>({
    name: 'basedInCountry',
  });
  // one search for both: the city holds the rule and the error, and its ref is what a failed submit focuses
  const {
    field: { value: basedInCity, onChange: setBasedInCity, ref: basedInRef },
    fieldState: { error: basedInError },
  } = useController<ProfileFormValue, 'basedInCity'>({
    name: 'basedInCity',
    rules: {
      validate: (city, { basedInCountry: country }) =>
        (Boolean(city) && Boolean(country)) || 'Select your city',
    },
  });
  const basedIn =
    basedInCountry && basedInCity
      ? { country: basedInCountry, city: basedInCity }
      : null;
  // after changing a picked city, the search opens with the keyboard up
  const [changingBasedIn, setChangingBasedIn] = useState(false);
  // two switches over one value: the city on turns the country on, the country off turns the city off
  const {
    field: { value: showBasedIn, onChange: setShowBasedIn },
  } = useController<ProfileFormValue, 'showBasedIn'>({ name: 'showBasedIn' });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => router.push('/onboarding/about'))}
    >
      <label htmlFor={nameId} {...stylex.props(styles.label)}>
        Name <span {...stylex.props(styles.required)}>*</span>
      </label>
      <div {...stylex.props(field.root)}>
        <input
          id={nameId}
          placeholder="Enter your name"
          maxLength={30}
          autoComplete="given-name"
          aria-required="true"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          {...nameField}
          {...stylex.props(
            styles.control,
            styles.name,
            nameError ? field.controlError : null,
          )}
        />
        {nameError && (
          <p id={nameErrorId} role="alert" {...stylex.props(field.error)}>
            {nameError}
          </p>
        )}
      </div>

      <fieldset {...stylex.props(styles.basedIn)}>
        <legend {...stylex.props(styles.label)}>
          Currently based in <span {...stylex.props(styles.required)}>*</span>
        </legend>
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
                  setBasedInCity('');
                  setChangingBasedIn(true);
                }}
                {...stylex.props(styles.change)}
              >
                <CloseIcon size={16} />
              </button>
            </div>
          ) : (
            <CitySearch
              label="Search your city"
              autoFocus={changingBasedIn}
              inputRef={basedInRef}
              invalid={Boolean(basedInError)}
              describedBy={basedInError ? basedInErrorId : undefined}
              onPick={({ country, city }) => {
                setValue('basedInCountry', country);
                // through the controller, so the error goes once a city is picked
                setBasedInCity(city);
              }}
            />
          )}
          {basedInError?.message && (
            <p id={basedInErrorId} role="alert" {...stylex.props(field.error)}>
              {basedInError.message}
            </p>
          )}
        </div>
        <div {...stylex.props(styles.visibility)}>
          <Toggle
            label="Show your country"
            description="On your posts, so people from home can find you"
            checked={showBasedIn !== 'none'}
            onChange={(on) => setShowBasedIn(on ? 'country' : 'none')}
          />
          <Toggle
            label="Show your city"
            description="Shows your country too"
            checked={showBasedIn === 'city'}
            onChange={(on) => setShowBasedIn(on ? 'city' : 'country')}
          />
        </div>
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
  control: {
    display: 'block',
    width: '100%',
    height: '48px',
    paddingInline: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: auth.control,
    color: auth.text,
    opacity: { default: 1, ':disabled': 0.6 },
    cursor: { default: null, ':disabled': 'not-allowed' },
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
  name: {
    backgroundColor: auth.input,
  },
  basedIn: {
    marginTop: '36px',
    borderWidth: 0,
  },
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
  visibility: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '28px',
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
