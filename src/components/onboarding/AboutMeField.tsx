'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { ProfileFormValue } from '@/types/profile';

const HINT = "A few lines so people know who they're saying hi to.";

export default function AboutMeField() {
  const { register, getValues } = useFormContext<ProfileFormValue>();
  const [writing, setWriting] = useState(false);

  return writing || getValues('aboutMe') ? (
    <textarea
      aria-label="About me"
      autoFocus
      rows={3}
      maxLength={300}
      placeholder={HINT}
      {...register('aboutMe', {
        onBlur: (event) => setWriting(event.target.value.trim().length > 0),
      })}
      {...stylex.props(styles.textarea)}
    />
  ) : (
    <button type="button" onClick={() => setWriting(true)} {...stylex.props(styles.hint)}>
      {HINT}
    </button>
  );
}

const styles = stylex.create({
  textarea: {
    display: 'block',
    width: '100%',
    paddingBlock: '12px',
    paddingInline: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: auth.control,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    lineHeight: 1.5,
    resize: 'vertical',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
  hint: {
    width: '100%',
    paddingBlock: '18px',
    paddingInline: '20px',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: { default: auth.border, ':hover': auth.muted },
    borderRadius: '10px',
    backgroundColor: 'transparent',
    color: auth.muted,
    fontFamily: 'inherit',
    fontSize: '15px',
    lineHeight: 1.5,
    textAlign: 'left',
    cursor: 'pointer',
  },
});
