'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext, useWatch } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { CITIES_BY_COUNTRY, COUNTRIES } from '@/constants/profile';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import type { ProfileFormValue } from '@/types/profile';
import Button from '@/components/Button';
import StepHeader from '@/components/onboarding/StepHeader';

export default function ProfileStep() {
  const router = useRouter();
  const nameErrorId = useId();
  const nameId = useId();
  const countryErrorId = useId();
  const cityErrorId = useId();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useFormContext<ProfileFormValue>();
  const nameError = errors.name?.message;
  const countryError = errors.basedInCountry?.message;
  const cityError = errors.basedInCity?.message;
  const basedInCountry = useWatch<ProfileFormValue, 'basedInCountry'>({
    name: 'basedInCountry',
  });
  const basedInCity = useWatch<ProfileFormValue, 'basedInCity'>({
    name: 'basedInCity',
  });

  return (
    <>
      <StepHeader
        title="Set up your profile"
        description="Tell us a little about yourself."
      />
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
            {...register('name', {
              validate: (data) => data.trim().length > 0 || 'Enter your name',
            })}
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
          <div {...stylex.props(styles.places)}>
            <div {...stylex.props(field.root)}>
              <select
                aria-label="Country you're based in"
                aria-required="true"
                aria-invalid={countryError ? true : undefined}
                aria-describedby={countryError ? countryErrorId : undefined}
                {...register('basedInCountry', {
                  validate: (data) => Boolean(data) || 'Select your country',
                  // the city chosen belongs to the country before
                  onChange: () => setValue('basedInCity', ''),
                })}
                {...stylex.props(
                  styles.control,
                  !basedInCountry && styles.unselected,
                  countryError ? field.controlError : null,
                )}
              >
                <option value="">Select country</option>
                {COUNTRIES.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              {countryError && (
                <p
                  id={countryErrorId}
                  role="alert"
                  {...stylex.props(field.error)}
                >
                  {countryError}
                </p>
              )}
            </div>
            <div {...stylex.props(field.root)}>
              <select
                aria-label="City you're based in"
                aria-required="true"
                aria-invalid={cityError ? true : undefined}
                aria-describedby={cityError ? cityErrorId : undefined}
                disabled={!basedInCountry}
                {...register('basedInCity', {
                  // it can't be chosen before the country, which has its own error
                  validate: (data, { basedInCountry: country }) =>
                    !country || Boolean(data) || 'Select your city',
                })}
                {...stylex.props(
                  styles.control,
                  !basedInCity && styles.unselected,
                  cityError ? field.controlError : null,
                )}
              >
                <option value="">Select city</option>
                {(CITIES_BY_COUNTRY[basedInCountry] ?? []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {cityError && (
                <p id={cityErrorId} role="alert" {...stylex.props(field.error)}>
                  {cityError}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <div {...stylex.props(styles.actions)}>
          <Button type="submit" xstyle={styles.next}>
            Next
          </Button>
        </div>
      </form>
    </>
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
  unselected: {
    color: auth.muted,
  },
  basedIn: {
    marginTop: '36px',
    borderWidth: 0,
  },
  places: {
    display: 'grid',
    gridTemplateColumns: { default: '1fr', [breakpoints.desktop]: '1fr 1fr' },
    columnGap: '12px',
    // stacked on phones, with room for the country's error
    rowGap: '28px',
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
