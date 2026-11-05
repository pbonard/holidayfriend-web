'use client';

import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import ChevronLeftIcon from '@/components/icons/ChevronLeftIcon';

export default function BackLink() {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()} {...stylex.props(styles.link)}>
      <ChevronLeftIcon />
      Back
    </button>
  );
}

const styles = stylex.create({
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '36px',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 600,
    color: { default: auth.link, ':hover': auth.text },
    cursor: 'pointer',
  },
});
