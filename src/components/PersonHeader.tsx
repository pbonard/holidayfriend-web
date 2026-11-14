import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import { profilePath } from '@/utils';

type PersonHeaderProps = {
  userId: string;
  // '' when their profile is gone
  name: string;
  // a post's own page: a bigger circle and name
  large?: boolean;
  // the line under the name, e.g. a post's role and where its author is based in. none when left out
  children?: React.ReactNode;
  // placement from the caller (its growing in a row and such), applied last
  xstyle?: StyleXStyles;
};

// who someone is at the top of a card: the first letter of their name in a circle in place of a photo, their name,
// and a line under it. the circle and the name open their profile. both links sit above a card's own link that
// covers it (a post card's title link), so they open the profile and not what the card opens
export default function PersonHeader({
  userId,
  name,
  large = false,
  children,
  xstyle,
}: PersonHeaderProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const href = profilePath(userId);

  return (
    <div {...stylex.props(styles.person, xstyle)}>
      {/* a bigger target than the name. the name's link is the one a screen reader and the tab key get, this one
          would only say the same again */}
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        {...stylex.props(styles.avatar, large && styles.largeAvatar)}
      >
        {initial}
      </Link>
      <div {...stylex.props(styles.who)}>
        <p {...stylex.props(styles.name, large && styles.largeName)}>
          <Link href={href} {...stylex.props(styles.nameLink)}>
            {name}
          </Link>
        </p>
        {children && (
          <p {...stylex.props(styles.subtitle, large && styles.largeSubtitle)}>
            {children}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = stylex.create({
  person: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  avatar: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: auth.control,
    color: auth.text,
    fontSize: '17px',
    fontWeight: 700,
    textDecoration: 'none',
    filter: { default: 'none', ':hover': 'brightness(1.25)' },
    transition: 'filter 120ms ease',
  },
  largeAvatar: {
    width: '56px',
    height: '56px',
    fontSize: '20px',
  },
  who: {
    minWidth: 0,
  },
  name: {
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  largeName: {
    fontSize: '19px',
  },
  nameLink: {
    position: 'relative',
    zIndex: 1,
    color: auth.text,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  // wraps on a narrow card, its pieces (a role, a dot, a place) apart by the column gap
  subtitle: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '6px',
    fontSize: '14px',
    lineHeight: 1.3,
    color: auth.muted,
  },
  largeSubtitle: {
    fontSize: '15px',
  },
});
