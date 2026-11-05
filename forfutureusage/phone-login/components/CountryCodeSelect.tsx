'use client';

import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon';

// a native select, so phones open their own picker wheel or sheet
export default function CountryCodeSelect() {
  const { control } = useFormContext();
  const options = useMemo(
    () =>
      getCountries()
        .map((country) => ({ country, label: `${country} +${getCountryCallingCode(country)}` }))
        .sort((a, b) => a.country.localeCompare(b.country)),
    [],
  );

  return (
    <Controller
      name="countryCode"
      control={control}
      render={({ field: { name, value, onChange, onBlur, ref } }) => (
        <div {...stylex.props(styles.wrapper)}>
          <select
            ref={ref}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            aria-label="Country code"
            autoComplete="tel-country-code"
            {...stylex.props(field.control, styles.select)}
          >
            {options.map(({ country, label }) => (
              <option key={country} value={country}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDownIcon xstyle={styles.chevron} />
        </div>
      )}
    />
  );
}

const styles = stylex.create({
  wrapper: {
    position: 'relative',
    flexShrink: 0,
    width: '116px',
  },
  select: {
    width: '100%',
    paddingInlineEnd: '32px',
    appearance: 'none',
    cursor: 'pointer',
  },
  // sits over the select's right edge, clicks pass through to the select underneath
  chevron: {
    position: 'absolute',
    insetInlineEnd: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: auth.muted,
    pointerEvents: 'none',
  },
});
