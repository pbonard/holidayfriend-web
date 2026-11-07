'use client';

import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { ProfileFormValue } from '@/types/profile';
import ChevronRightIcon from '@/components/icons/ChevronRightIcon';

type PromptRowProps = {
  name: keyof ProfileFormValue;
  label: string;
  Icon: React.ComponentType;
};

// a line of the list that turns into its own input when tapped
export default function PromptRow({ name, label, Icon }: PromptRowProps) {
  const { control } = useFormContext<ProfileFormValue>();
  const [editing, setEditing] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { name: fieldName, value, onChange, onBlur, ref } }) => {
        const answer = value.trim();
        if (editing) {
          return (
            <div {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.icon)}>
                <Icon />
              </span>
              <input
                aria-label={label}
                autoFocus
                maxLength={100}
                placeholder={label}
                name={fieldName}
                ref={ref}
                value={value}
                onChange={onChange}
                onBlur={() => {
                  onBlur();
                  setEditing(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
                {...stylex.props(styles.input)}
              />
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={() => setEditing(true)}
            {...stylex.props(styles.row, styles.button)}
          >
            <span {...stylex.props(styles.icon, answer ? styles.answered : null)}>
              <Icon />
            </span>
            <span {...stylex.props(styles.text, answer ? styles.answered : null)}>
              {label}
              {answer && (
                <>
                  : <strong {...stylex.props(styles.answer)}>{answer}</strong>
                </>
              )}
            </span>
            <ChevronRightIcon xstyle={styles.chevron} />
          </button>
        );
      }}
    />
  );
}

const styles = stylex.create({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
    minHeight: '64px',
    paddingBlock: '10px',
    borderWidth: 0,
    borderBottomWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
  },
  button: {
    backgroundColor: 'transparent',
    color: auth.muted,
    fontFamily: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  icon: {
    display: 'flex',
    flexShrink: 0,
    color: auth.text,
  },
  text: {
    flexGrow: 1,
    minWidth: 0,
    fontSize: '15px',
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },
  answered: {
    color: auth.text,
    fontWeight: 500,
  },
  answer: {
    fontWeight: 700,
  },
  chevron: {
    flexShrink: 0,
    color: auth.muted,
  },
  input: {
    flexGrow: 1,
    minWidth: 0,
    height: '40px',
    paddingInline: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.link,
    borderRadius: '8px',
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
