'use client';

import { useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { PostFormValue } from '@/types/post';
import { fitToContent } from '@/utils';

// reddit's limit
const BODY_MAX = 40_000;

export default function BodyInput() {
  const { register } = useFormContext<PostFormValue>();

  return (
    <textarea
      aria-label="Body"
      placeholder="Body"
      rows={5}
      maxLength={BODY_MAX}
      {...register('body', {
        required: true,
        onChange: (event) => fitToContent(event.target),
      })}
      {...stylex.props(styles.body)}
    />
  );
}

const styles = stylex.create({
  body: {
    paddingBlock: '16px',
    paddingInline: 0,
    borderWidth: 0,
    borderBottomWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.cardBorder, ':focus': auth.border },
    outline: 'none',
    backgroundColor: 'transparent',
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '16px',
    lineHeight: 1.5,
    // grows with what is written (fitToContent), so there's nothing to drag or scroll
    resize: 'none',
    overflow: 'hidden',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
});
