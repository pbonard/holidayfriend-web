'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, fonts } from '@/styles/tokens.stylex';
import CompassIcon from '@/components/icons/CompassIcon';
import PlusIcon from '@/components/icons/PlusIcon';
import SidebarCollapseIcon from '@/components/icons/SidebarCollapseIcon';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof CompassIcon;
};

const NAV: NavItem[] = [
  { href: '/explore', label: 'Explore', Icon: CompassIcon },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div {...stylex.props(styles.page)}>
      <aside
        {...stylex.props(styles.sidebar, collapsed && styles.sidebarCollapsed)}
      >
        <div {...stylex.props(styles.top, collapsed && styles.topCollapsed)}>
          {!collapsed && (
            <span {...stylex.props(styles.brand)}>Holidayfriend</span>
          )}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
            {...stylex.props(styles.toggle)}
          >
            <SidebarCollapseIcon
              size={18}
              xstyle={collapsed && styles.flipped}
            />
          </button>
        </div>
        <Link
          href="/post/create"
          aria-label="Create post"
          {...stylex.props(styles.create, collapsed && styles.createCollapsed)}
        >
          <PlusIcon size={18} />
          <span {...stylex.props(styles.label, collapsed && styles.hidden)}>
            Create post
          </span>
        </Link>
        <nav {...stylex.props(styles.nav)}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                {...stylex.props(
                  styles.item,
                  collapsed && styles.itemCollapsed,
                  active && styles.itemActive,
                )}
              >
                <span {...stylex.props(styles.iconWrap)}>
                  <Icon size={20} />
                </span>
                <span
                  {...stylex.props(styles.label, collapsed && styles.hidden)}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main {...stylex.props(styles.main)}>{children}</main>
    </div>
  );
}

const styles = stylex.create({
  page: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: auth.page,
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
    width: { default: '68px', [breakpoints.desktop]: '240px' },
    height: '100vh',
    paddingBlock: { default: '16px', [breakpoints.desktop]: '28px' },
    paddingInline: { default: '12px', [breakpoints.desktop]: '16px' },
    backgroundColor: auth.card,
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: auth.cardBorder,
    transition: 'width 160ms ease',
  },
  sidebarCollapsed: {
    width: '68px',
    paddingInline: '12px',
  },
  // the brand and the toggle only fit the desktop sidebar
  top: {
    display: { default: 'none', [breakpoints.desktop]: 'flex' },
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: '12px',
    marginBottom: '8px',
  },
  topCollapsed: {
    justifyContent: 'center',
    paddingInline: 0,
  },
  brand: {
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
  },
  flipped: {
    transform: 'scaleX(-1)',
  },
  create: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: { default: '44px', [breakpoints.desktop]: '48px' },
    borderRadius: '10px',
    backgroundColor: { default: auth.accent, ':hover': auth.accentHover },
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '12px',
    transition: 'background-color 120ms ease',
  },
  createCollapsed: {
    height: '44px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: { default: 'center', [breakpoints.desktop]: 'flex-start' },
    gap: '12px',
    height: '44px',
    paddingInline: { default: 0, [breakpoints.desktop]: '12px' },
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    color: { default: auth.text, ':hover': auth.text },
    backgroundColor: { default: 'transparent', ':hover': auth.control },
  },
  itemCollapsed: {
    justifyContent: 'center',
    paddingInline: 0,
  },
  itemActive: {
    backgroundColor: auth.control,
  },
  iconWrap: {
    position: 'relative',
    display: 'flex',
  },
  label: {
    display: { default: 'none', [breakpoints.desktop]: 'inline' },
    flexShrink: 0,
  },
  hidden: {
    display: 'none',
  },
  main: {
    flexGrow: 1,
    minWidth: 0,
    paddingBlock: { default: '20px', [breakpoints.desktop]: '36px' },
    paddingInline: { default: '16px', [breakpoints.desktop]: '40px' },
  },
});
