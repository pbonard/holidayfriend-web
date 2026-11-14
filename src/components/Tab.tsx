'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, fonts, rootMarker } from '@/styles/tokens.stylex';
import SidebarCollapseIcon from '@/components/icons/SidebarCollapseIcon';
import NavigationList from '@/components/NavigationList';
import {
  isSidebarCollapsed,
  setSidebarCollapsed,
  subscribeSidebar,
} from '@/utils/sidebar';

// the collapsed look comes from <html data-sidebar="collapsed"> (the when.ancestor keys below): that attribute is set before the
// first paint, this component's state only once react has loaded, so the state is only for the toggle's label
export default function Tab({ children }: { children: React.ReactNode }) {
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
          {/* the "Hf" mark where the sidebar is narrow (a phone's, or collapsed), the name where it's open. both
              go home, to the city being explored */}
          <Link
            href="/explore"
            aria-label="Holidayfriend"
            {...stylex.props(styles.mark)}
          >
            <span aria-hidden="true">
              H<span {...stylex.props(styles.markAccent)}>f</span>
            </span>
          </Link>
          <Link href="/explore" {...stylex.props(styles.brand)}>
            Holidayfriend
          </Link>
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
        <NavigationList />
      </aside>
      <main {...stylex.props(styles.main)}>{children}</main>
    </div>
  );
}

// a collapsed desktop sidebar
const NARROW = '58px';
// the desktop sidebar open
const WIDE = '220px';

// the [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)] keys: the desktop sidebar collapsed, from
// <html data-sidebar="collapsed">, which carries rootMarker. written out each time: stylex compiles the call only
// where it's a key of stylex.create, a shared constant would run in the browser and throw.
// a phone has no sidebar but a bar across the top of the page, scrolling away with it. only the desktop one collapses
const styles = stylex.create({
  // the bar over the page on a phone, the sidebar beside it on a desktop
  page: {
    display: 'flex',
    flexDirection: { default: 'column', [breakpoints.desktop]: 'row' },
    minHeight: '100vh',
    backgroundColor: auth.page,
    color: auth.text,
    fontFamily: fonts.sans,
  },
  // a phone's: one row, the mark on the left, the links on the right, creating a post the last. a desktop's: a column the window's
  // height, staying as the page scrolls
  sidebar: {
    position: { default: 'static', [breakpoints.desktop]: 'sticky' },
    top: 0,
    flexShrink: 0,
    display: 'flex',
    flexDirection: { default: 'row', [breakpoints.desktop]: 'column' },
    alignItems: { default: 'center', [breakpoints.desktop]: 'stretch' },
    gap: { default: '8px', [breakpoints.desktop]: '12px' },
    width: {
      default: '100%',
      [breakpoints.desktop]: {
        default: WIDE,
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          NARROW,
      },
    },
    height: { default: 'auto', [breakpoints.desktop]: '100vh' },
    paddingBlock: { default: '8px', [breakpoints.desktop]: '28px' },
    paddingInline: {
      default: '12px',
      [breakpoints.desktop]: {
        default: '16px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: '8px',
      },
    },
    backgroundColor: auth.card,
    // under the bar on a phone, beside the sidebar on a desktop
    borderBottomWidth: { default: '1px', [breakpoints.desktop]: 0 },
    borderRightWidth: { default: 0, [breakpoints.desktop]: '1px' },
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    transition: 'width 160ms ease',
  },
  // the very top: the mark alone on a phone, the name and the toggle in a row on an open desktop sidebar, the mark
  // over the toggle on a collapsed one
  top: {
    display: 'flex',
    flexDirection: {
      default: 'column',
      [breakpoints.desktop]: {
        default: 'row',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'column',
      },
    },
    alignItems: 'center',
    justifyContent: {
      default: 'center',
      [breakpoints.desktop]: {
        default: 'space-between',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'center',
      },
    },
    gap: '10px',
    paddingInline: {
      default: 0,
      [breakpoints.desktop]: {
        default: '12px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: 0,
      },
    },
    marginBottom: { default: 0, [breakpoints.desktop]: '8px' },
  },
  // "Hf" on its own, the f in the accent's light shade as the links
  mark: {
    display: {
      default: 'flex',
      [breakpoints.desktop]: {
        default: 'none',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'flex',
      },
    },
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '40px',
    height: '40px',
    // only for the focus ring's corners, there's no box to see
    borderRadius: '10px',
    color: auth.text,
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.06em',
    lineHeight: 1,
    textDecoration: 'none',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  markAccent: {
    color: auth.link,
  },
  // the name, only on an open desktop sidebar
  brand: {
    display: {
      default: 'none',
      [breakpoints.desktop]: {
        default: 'inline',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'none',
      },
    },
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: auth.text,
    textDecoration: 'none',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  // only on a desktop: a phone's sidebar is always narrow
  toggle: {
    display: { default: 'none', [breakpoints.desktop]: 'flex' },
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
  main: {
    flexGrow: 1,
    minWidth: 0,
    paddingBlock: { default: '20px', [breakpoints.desktop]: '36px' },
    paddingInline: { default: '16px', [breakpoints.desktop]: '40px' },
  },
});
