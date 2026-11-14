'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import ChevronLeftIcon from '@/components/icons/ChevronLeftIcon';

type BackLinkProps = {
  // a page to go to, e.g. the city a post was found in. without it, back to the page before, as the browser's back
  href?: string;
  // the words, "Back" when left out
  children?: React.ReactNode;
  // placement from the caller (its margins and such), applied last
  xstyle?: StyleXStyles;
};

// the way back at the top of a screen: a link when it knows where to, the browser's back otherwise
export default function BackLink({
  href,
  children = 'Back',
  xstyle,
}: BackLinkProps) {
  const router = useRouter();
  const content = (
    <>
      <ChevronLeftIcon />
      {children}
    </>
  );

  return href ? (
    <Link href={href} {...stylex.props(styles.link, xstyle)}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => router.back()}
      {...stylex.props(styles.link, xstyle)}
    >
      {content}
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
    textDecoration: 'none',
    cursor: 'pointer',
  },
});
