'use client';

import { Controller, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { SayHiFormValue } from '@/components/post/SayHiForm';
import { fitToContent } from '@/utils';

// the server's limit on an invite's message
export const MESSAGE_MAX = 300;

// the message of an invite, with how much of the limit it uses
export default function MessageInput({
  recipientName,
}: {
  recipientName: string;
}) {
  const { control } = useFormContext<SayHiFormValue>();

  return (
    <Controller
      name="message"
      control={control}
      rules={{
        // only spaces is no message
        validate: (data) => data.trim().length > 0,
      }}
      render={({ field: { name, value, onChange, onBlur, ref } }) => (
        <div {...stylex.props(styles.root)}>
          <textarea
            aria-label={`Message to ${recipientName}`}
            placeholder="Introduce yourself and say what you'd like to do together…"
            rows={4}
            maxLength={MESSAGE_MAX}
            // the dialog moves the focus here when it opens
            autoFocus
            ref={ref}
            name={name}
            value={value}
            onChange={(event) => {
              onChange(event);
              fitToContent(event.target);
            }}
            onBlur={onBlur}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.count)}>
            {value.length}/{MESSAGE_MAX}
          </span>
        </div>
      )}
    />
  );
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  input: {
    minHeight: '120px',
    padding: '14px',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    outline: 'none',
    backgroundColor: auth.input,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    lineHeight: 1.5,
    // grows with what is written (fitToContent), the sheet scrolls past its max height
    resize: 'none',
    overflow: 'hidden',
    transition: 'border-color 120ms ease',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
  count: {
    alignSelf: 'flex-end',
    fontSize: '13px',
    color: auth.placeholder,
  },
});
