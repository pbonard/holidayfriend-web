'use client';

import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import {
  getExampleNumber,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';
import * as stylex from '@stylexjs/stylex';
import { field } from '@/styles/field';

type FormValue = {
  countryCode: CountryCode;
  phoneNumber: string;
};

type PhoneNumberInputProps = {
  id: string;
  errorId: string;
};

export default function PhoneNumberInput({
  id,
  errorId,
}: PhoneNumberInputProps) {
  const { control } = useFormContext<FormValue>();
  const countryCode = useWatch({ control, name: 'countryCode' });

  return (
    <Controller
      name="phoneNumber"
      control={control}
      rules={{
        validate: (data, formValues) => {
          if (data.trim().length === 0) {
            return 'Enter your phone number';
          }
          if (!isValidPhoneNumber(data, formValues.countryCode)) {
            return 'Enter a valid phone number';
          }
        },
      }}
      render={({
        field: { name, value, onChange, onBlur, ref },
        fieldState: { error },
      }) => (
        <input
          id={id}
          ref={ref}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          // keep the characters national formats use, libphonenumber ignores them when validating
          onChange={(event) =>
            onChange(event.target.value.replace(/[^\d\s()-]/g, ''))
          }
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...stylex.props(
            field.control,
            styles.input,
            error && field.controlError,
          )}
        />
      )}
    />
  );
}

const styles = stylex.create({
  input: {
    flexGrow: 1,
    minWidth: 0,
  },
});
