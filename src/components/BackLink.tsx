import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

export default function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} {...stylex.props(styles.link)}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path
          d="M8.5 3 4.5 7l4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back
    </Link>
  );
}

const styles = stylex.create({
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '36px',
    fontSize: '16px',
    fontWeight: 600,
    color: { default: auth.link, ':hover': auth.text },
  },
});
