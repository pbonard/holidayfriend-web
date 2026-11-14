'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, rootMarker } from '@/styles/tokens.stylex';
import CompassIcon from '@/components/icons/CompassIcon';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof CompassIcon;
};

const NAV: NavItem[] = [
  { href: '/explore', label: 'Explore', Icon: CompassIcon },
];

// the sidebar's links, the current page's marked. the path is known while prerendering only on pages built
// ahead, a post's page has it only at request time: the links show without the current one until then
export default function NavigationList() {
  return (
    <nav {...stylex.props(styles.nav)}>
      <Suspense fallback={<NavLinks pathname={null} />}>
        <CurrentNavLinks />
      </Suspense>
    </nav>
  );
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

// the links, the one of pathname marked as the current page. none while it isn't known
function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV.map(({ href, label, Icon }) => {
    const active = pathname?.startsWith(href) ?? false;
    return (
      <Link
        key={href}
        href={href}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        {...stylex.props(styles.item, active && styles.itemActive)}
      >
        <span {...stylex.props(styles.iconWrap)}>
          <Icon size={20} />
        </span>
        <span {...stylex.props(styles.label)}>{label}</span>
      </Link>
    );
  });
}

// the [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)] keys: the desktop sidebar collapsed, as in
// Sidebar. written out each time: stylex compiles the call only where it's a key of stylex.create
const styles = stylex.create({
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: {
      default: 'center',
      [breakpoints.desktop]: {
        default: 'flex-start',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'center',
      },
    },
    gap: '12px',
    height: '44px',
    paddingInline: {
      default: 0,
      [breakpoints.desktop]: {
        default: '12px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: 0,
      },
    },
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    color: { default: auth.text, ':hover': auth.text },
    backgroundColor: { default: 'transparent', ':hover': auth.control },
  },
  itemActive: {
    backgroundColor: auth.control,
  },
  iconWrap: {
    position: 'relative',
    display: 'flex',
  },
  // only in the open desktop sidebar, the narrow one shows the icons alone
  label: {
    display: {
      default: 'none',
      [breakpoints.desktop]: {
        default: 'inline',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'none',
      },
    },
    flexShrink: 0,
  },
});
