'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, fonts, rootMarker } from '@/styles/tokens.stylex';
import PlusIcon from '@/components/icons/PlusIcon';
import SidebarCollapseIcon from '@/components/icons/SidebarCollapseIcon';
import NavigationList from '@/components/NavigationList';
import {
  isSidebarCollapsed,
  setSidebarCollapsed,
  subscribeSidebar,
} from '@/utils/sidebar';

// the collapsed look comes from <html data-sidebar="collapsed"> (the when.ancestor keys below): that attribute is set before the
// first paint, this component's state only once react has loaded, so the state is only for the toggle's label
export default function Sidebar({ children }: { children: React.ReactNode }) {
  // false while prerendering, the attribute once in the browser
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    isSidebarCollapsed,
    () => false,
  );

  return (
    <div {...stylex.props(styles.page)}>
      <aside {...stylex.props(styles.sidebar)}>
        <div {...stylex.props(styles.top)}>
          <span {...stylex.props(styles.brand)}>Holidayfriend</span>
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setSidebarCollapsed(!collapsed)}
            {...stylex.props(styles.toggle)}
          >
            <SidebarCollapseIcon size={18} />
          </button>
        </div>
        <Link
          href="/post/create"
          aria-label="Create post"
          {...stylex.props(styles.create)}
        >
          <PlusIcon size={18} />
          <span {...stylex.props(styles.label)}>Create post</span>
        </Link>
        <NavigationList />
      </aside>
      <main {...stylex.props(styles.main)}>{children}</main>
    </div>
  );
}

// a phone's sidebar, and a collapsed one on a desktop
const NARROW = '58px';
// the desktop sidebar open
const WIDE = '220px';

// the [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)] keys: the desktop sidebar collapsed, from
// <html data-sidebar="collapsed">, which carries rootMarker. written out each time: stylex compiles the call only
// where it's a key of stylex.create, a shared constant would run in the browser and throw.
// only the desktop one collapses, a phone's is always narrow
const styles = stylex.create({
  page: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: auth.page,
    // a phone's safari scrolls the page up behind its floating bars, above where the sticky sidebar starts.
    // the sidebar's color down the whole left edge fills that, so the sidebar doesn't look cut off at the top
    backgroundImage: {
      default: `linear-gradient(to right, ${auth.card} 0 calc(${NARROW} - 1px), ${auth.cardBorder} calc(${NARROW} - 1px) ${NARROW}, transparent ${NARROW})`,
      [breakpoints.desktop]: 'none',
    },
    color: auth.text,
    fontFamily: fonts.sans,
  },
  sidebar: {
    position: 'sticky',
    top: 0,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: {
      default: NARROW,
      [breakpoints.desktop]: {
        default: WIDE,
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          NARROW,
      },
    },
    height: '100vh',
    paddingBlock: { default: '16px', [breakpoints.desktop]: '28px' },
    paddingInline: {
      default: '8px',
      [breakpoints.desktop]: {
        default: '16px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: '8px',
      },
    },
    backgroundColor: auth.card,
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: auth.cardBorder,
    transition: 'width 160ms ease',
  },
  // the brand and the toggle only fit the desktop sidebar
  top: {
    display: { default: 'none', [breakpoints.desktop]: 'flex' },
    alignItems: 'center',
    justifyContent: {
      default: 'space-between',
      [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
        'center',
    },
    paddingInline: {
      default: '12px',
      [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: 0,
    },
    marginBottom: '8px',
  },
  brand: {
    display: {
      default: 'inline',
      [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: 'none',
    },
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  toggle: {
    display: 'flex',
    padding: '4px',
    borderWidth: 0,
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: { default: auth.muted, ':hover': auth.text },
    cursor: 'pointer',
    // the arrow points the other way, to expanding
    transform: {
      default: null,
      [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
        'scaleX(-1)',
    },
  },
  create: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    // about square in the narrow sidebar (a phone's, or collapsed), 41px wide between its padding and border
    height: {
      default: '40px',
      [breakpoints.desktop]: {
        default: '48px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          '40px',
      },
    },
    borderRadius: '10px',
    backgroundColor: { default: auth.accent, ':hover': auth.accentHover },
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '12px',
    transition: 'background-color 120ms ease',
  },
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
  main: {
    flexGrow: 1,
    minWidth: 0,
    paddingBlock: { default: '20px', [breakpoints.desktop]: '36px' },
    paddingInline: { default: '16px', [breakpoints.desktop]: '40px' },
  },
});
