'use client';

import { useId, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { field } from '@/styles/field';

const LENGTH = 6;

// one real input stretched over six drawn boxes: paste, backspace and the
// sms autofill of ios/android (autocomplete="one-time-code") all work as with a normal input
export default function OTPInput() {
  const { control } = useFormContext();
  const errorId = useId();
  const [focused, setFocused] = useState(false);

  return (
    <Controller
      name="otp"
      control={control}
      rules={{
        validate: (data: string) => {
          if (data.length !== LENGTH) {
            return 'Enter the 6-digit code';
          }
        },
      }}
      render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { error } }) => {
        const activeIndex = Math.min(value.length, LENGTH - 1);
        return (
          <div>
            <div {...stylex.props(styles.boxes)}>
              {Array.from({ length: LENGTH }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  {...stylex.props(
                    styles.box,
                    error && field.controlError,
                    focused && index === activeIndex && styles.active,
                  )}
                >
                  {value[index] ?? ''}
                </div>
              ))}
              <input
                ref={ref}
                name={name}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={LENGTH}
                aria-label="6-digit code"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                value={value}
                onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, LENGTH))}
                // the caret always sits after the last digit, so backspace removes it
                onSelect={(event) => {
                  const end = event.currentTarget.value.length;
                  event.currentTarget.setSelectionRange(end, end);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  onBlur();
                }}
                {...stylex.props(styles.input)}
              />
            </div>
            {error && (
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
  boxes: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: `repeat(${LENGTH}, 1fr)`,
    gap: '8px',
  },
  box: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '56px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.border,
    backgroundColor: auth.control,
    fontSize: '24px',
    fontWeight: 700,
  },
  active: {
    borderColor: auth.link,
  },
  // invisible but still the thing that is focused, typed into and autofilled
  input: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    borderWidth: 0,
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'transparent',
    caretColor: 'transparent',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    cursor: 'text',
    '::selection': {
      backgroundColor: 'transparent',
    },
  },
});
