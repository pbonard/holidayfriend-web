"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import * as stylex from "@stylexjs/stylex";
import { field } from "@/styles/field";

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function EmailInput() {
  const { control } = useFormContext();
  const inputId = useId();
  const errorId = useId();

  return (
    <Controller
      name="email"
      control={control}
      rules={{
        validate: (data: string) => {
          if (data.trim().length === 0) {
            return "Enter your email";
          }
          if (!EMAIL_PATTERN.test(data.trim())) {
            return "Enter a valid email address";
          }
        },
      }}
      render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { error } }) => (
        <div {...stylex.props(field.root)}>
          <label htmlFor={inputId} {...stylex.props(field.label)}>
            Email
          </label>
          <input
            id={inputId}
            ref={ref}
            name={name}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...stylex.props(field.control, error && field.controlError)}
          />
          {error && (
            <p id={errorId} role="alert" {...stylex.props(field.error)}>
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
