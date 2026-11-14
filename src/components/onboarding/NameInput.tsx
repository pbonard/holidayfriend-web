'use client';

import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';
import type { ProfileFormValue } from '@/types/profile';

// the name the profile shows, on posts and invites
export default function NameInput() {
  const { control } = useFormContext<ProfileFormValue>();
  const nameId = useId();
  const errorId = useId();

  return (
    <Controller
      name="name"
      control={control}
      rules={{
        validate: (data) => data.trim().length > 0 || 'Enter your name',
      }}
      render={({
        field: { name, value, onChange, onBlur, ref },
        fieldState: { error },
      }) => (
        <>
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
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              ref={ref}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              {...stylex.props(styles.control, error && field.controlError)}
            />
            {error && (
              <p id={errorId} role="alert" {...stylex.props(field.error)}>
                {error.message}
              </p>
            )}
          </div>
        </>
      )}
    />
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
    backgroundColor: auth.input,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
});
