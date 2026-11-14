'use client';

import { Controller, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { PostFormValue } from '@/types/post';
import { fitToContent } from '@/utils';

// reddit's limit
const TITLE_MAX = 300;

// a textarea and not an input, so a long title wraps and the box grows like the body's
export default function TitleInput() {
  const { control } = useFormContext<PostFormValue>();

  return (
    <Controller
      name="title"
      control={control}
      rules={{ validate: (data) => data.trim().length > 0 }}
      render={({ field: { name, value, onChange, onBlur, ref } }) => (
        <textarea
          aria-label="Title"
          placeholder="Title"
          rows={1}
          maxLength={TITLE_MAX}
          ref={ref}
          name={name}
          value={value}
          // a title is one line: enter doesn't break it
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          }}
          onChange={(event) => {
            const textarea = event.target;
            // pasting can still bring line breaks in, so they become spaces. set on the box too, so it's measured
            // as it'll show. only then: setting the value moves the caret to the end
            if (/[\r\n]/.test(textarea.value)) {
              textarea.value = textarea.value.replace(/\s*[\r\n]+\s*/g, ' ');
            }
            onChange(textarea.value);
            fitToContent(textarea);
          }}
          onBlur={onBlur}
          {...stylex.props(styles.title)}
        />
      )}
    />
  );
}

const styles = stylex.create({
  title: {
    paddingBlock: '12px',
    paddingInline: 0,
    borderWidth: 0,
    borderBottomWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.cardBorder, ':focus': auth.border },
    outline: 'none',
    backgroundColor: 'transparent',
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.4,
    // grows with what is written (fitToContent), so there's nothing to drag or scroll
    resize: 'none',
    overflow: 'hidden',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
});
