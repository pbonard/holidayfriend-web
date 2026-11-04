"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import * as stylex from "@stylexjs/stylex";
import { field } from "@/styles/field";

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function EmailInput() {
  const { control } = useFormContext();
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
        <div {...stylex.props(field.root, styles.root)}>
          <input
            aria-label="Email"
            ref={ref}
            name={name}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...stylex.props(field.control, styles.control, error && field.controlError)}
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

// the same box as the sign in buttons around it
const styles = stylex.create({
  root: {
    position: "relative",
    left: "1px",
    alignSelf: "center",
    width: "100%",
    maxWidth: "318px",
  },
  control: {
    height: "32px",
    borderRadius: "4px",
  },
});
