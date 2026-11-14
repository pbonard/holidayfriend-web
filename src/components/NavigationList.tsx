'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, rootMarker } from '@/styles/tokens.stylex';
import CompassIcon from '@/components/icons/CompassIcon';
import InboxIcon from '@/components/icons/InboxIcon';
import PlusIcon from '@/components/icons/PlusIcon';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof CompassIcon;
  // at the end of a phone's bar, whatever its place in the sidebar
  lastOnPhone?: boolean;
};

const NAV: NavItem[] = [
  // the first in the sidebar, the last in a phone's bar
  {
    href: '/post/create',
    label: 'Create post',
    Icon: PlusIcon,
    lastOnPhone: true,
  },
  { href: '/explore', label: 'Explore', Icon: CompassIcon },
  { href: '/invites', label: 'Invites', Icon: InboxIcon },
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
  return NAV.map(({ href, label, Icon, lastOnPhone }) => {
    const active = pathname?.startsWith(href) ?? false;
    return (
      <Link
        key={href}
        href={href}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        {...stylex.props(
          styles.item,
          active && styles.itemActive,
          lastOnPhone && styles.lastOnPhone,
        )}
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
  // in a row on the right of a phone's bar (the auto margin, before the create button), a column in the sidebar
  nav: {
    display: 'flex',
    flexDirection: { default: 'row', [breakpoints.desktop]: 'column' },
    marginLeft: { default: 'auto', [breakpoints.desktop]: 0 },
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
    // square in a phone's bar
    minWidth: { default: '44px', [breakpoints.desktop]: 0 },
    height: '44px',
    paddingInline: {
      default: 0,
      [breakpoints.desktop]: {
        default: '12px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: 0,
      },
    },
    // a line around the current one only. always there and unseen on the others, so nothing moves between them
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    color: { default: auth.text, ':hover': auth.text },
    backgroundColor: { default: 'transparent', ':hover': auth.control },
  },
  lastOnPhone: {
    order: { default: 1, [breakpoints.desktop]: 0 },
  },
  itemActive: {
    borderColor: auth.border,
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
