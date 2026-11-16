'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints, rootMarker } from '@/styles/tokens.stylex';
import { useDeleteAccount, useLogout } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import GearIcon from '@/components/icons/GearIcon';

// the sidebar's last button: the end of a phone's bar, the bottom of a desktop's sidebar
export default function SettingsMenu() {
  const router = useRouter();
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const [open, setOpen] = useState(false);
  // what's asked before it's done
  const [confirming, setConfirming] = useState<'logout' | 'delete' | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // closes on a click outside it, or Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    });
  };

  const deleteAccount = () => {
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => router.replace('/login'),
    });
  };

  return (
    <div ref={menuRef} {...stylex.props(styles.anchor)}>
      <button
        type="button"
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((shown) => !shown)}
        {...stylex.props(styles.trigger, open && styles.triggerOpen)}
      >
        <GearIcon size={20} />
        <span {...stylex.props(styles.label)}>Settings</span>
      </button>
      {open && (
        <div role="menu" {...stylex.props(styles.menu)}>
          <Link
            role="menuitem"
            href="/onboarding/profile"
            onClick={() => setOpen(false)}
            {...stylex.props(styles.item)}
          >
            Update profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logoutMutation.reset();
              setConfirming('logout');
            }}
            {...stylex.props(styles.item)}
          >
            Log out
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              deleteAccountMutation.reset();
              setConfirming('delete');
            }}
            {...stylex.props(styles.item, styles.danger)}
          >
            Delete account
          </button>
        </div>
      )}

      <Modal
        open={confirming === 'logout'}
        onClose={() => setConfirming(null)}
        title="Log out?"
      >
        {logoutMutation.isError && (
          <p role="alert" {...stylex.props(styles.error)}>
            {logoutMutation.error.message || "Couldn't log out."}
          </p>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            onClick={() => setConfirming(null)}
            xstyle={styles.action}
          >
            Cancel
          </Button>
          <Button
            disabled={logoutMutation.isPending}
            onClick={logout}
            xstyle={styles.action}
          >
            Log out
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirming === 'delete'}
        onClose={() => setConfirming(null)}
        title="Delete your account?"
      >
        <p {...stylex.props(styles.explain)}>
          Your profile, posts and chats are deleted for good. This can&apos;t be
          undone.
        </p>
        {deleteAccountMutation.isError && (
          <p role="alert" {...stylex.props(styles.error)}>
            {deleteAccountMutation.error.message ||
              "Couldn't delete your account."}
          </p>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            onClick={() => setConfirming(null)}
            xstyle={styles.action}
          >
            Cancel
          </Button>
          <Button
            disabled={deleteAccountMutation.isPending}
            onClick={deleteAccount}
            xstyle={[styles.action, styles.dangerAction]}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// the [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)] keys: the desktop sidebar collapsed, as in
// Tab. written out each time: stylex compiles the call only where it's a key of stylex.create
const styles = stylex.create({
  // pushed to the bottom of a desktop's sidebar. a phone's bar has it after the links
  anchor: {
    position: 'relative',
    flexShrink: 0,
    marginTop: { default: 0, [breakpoints.desktop]: 'auto' },
  },
  // looks like the sidebar's links
  trigger: {
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
    width: { default: '44px', [breakpoints.desktop]: '100%' },
    height: '44px',
    paddingBlock: 0,
    paddingInline: {
      default: 0,
      [breakpoints.desktop]: {
        default: '12px',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]: 0,
      },
    },
    borderWidth: 0,
    borderRadius: '10px',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
  triggerOpen: {
    backgroundColor: auth.control,
  },
  // only in the open desktop sidebar
  label: {
    display: {
      default: 'none',
      [breakpoints.desktop]: {
        default: 'inline',
        [stylex.when.ancestor('[data-sidebar="collapsed"]', rootMarker)]:
          'none',
      },
    },
  },
  // below the button on a phone's bar, above it at the bottom of a desktop's sidebar
  menu: {
    position: 'absolute',
    top: { default: 'calc(100% + 6px)', [breakpoints.desktop]: 'auto' },
    bottom: { default: 'auto', [breakpoints.desktop]: 'calc(100% + 6px)' },
    right: { default: 0, [breakpoints.desktop]: 'auto' },
    left: { default: 'auto', [breakpoints.desktop]: 0 },
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '180px',
    padding: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.border,
    borderRadius: '12px',
    backgroundColor: auth.surface,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
  },
  item: {
    display: 'block',
    width: '100%',
    paddingBlock: '10px',
    paddingInline: '12px',
    borderWidth: 0,
    borderRadius: '8px',
    backgroundColor: { default: 'transparent', ':hover': auth.control },
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '15px',
    textAlign: 'left',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  danger: {
    color: auth.danger,
  },
  explain: {
    fontSize: '16px',
    lineHeight: 1.5,
    color: auth.muted,
  },
  error: {
    marginTop: '12px',
    fontSize: '14px',
    color: auth.danger,
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px',
  },
  action: {
    flexGrow: 1,
    height: '48px',
  },
  dangerAction: {
    backgroundColor: auth.danger,
  },
});
