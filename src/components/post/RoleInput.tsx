'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import type { PostFormValue, PostRole } from '@/types/post';

const ROLES: { value: PostRole; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'traveler', label: 'Traveler' },
];

export default function RoleInput() {
  const { control, setValue } = useFormContext<PostFormValue>();
  const role = useWatch({ control, name: 'role' });

  return (
    <div role="group" aria-label="I am a" {...stylex.props(styles.roles)}>
      {ROLES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={role === value}
          onClick={() => setValue('role', value)}
          {...stylex.props(styles.role, role === value && styles.roleSelected)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  roles: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  role: {
    height: '48px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':hover': auth.muted },
    borderRadius: '10px',
    backgroundColor: 'transparent',
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 120ms ease, border-color 120ms ease',
  },
  roleSelected: {
    borderColor: { default: auth.accent, ':hover': auth.accentHover },
    backgroundColor: { default: auth.accent, ':hover': auth.accentHover },
  },
});
