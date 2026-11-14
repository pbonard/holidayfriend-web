import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { PostRole } from '@/types/post';

const TABS: { value: PostRole | undefined; label: string }[] = [
  { value: undefined, label: 'All posts' },
  { value: 'local', label: 'Locals' },
  { value: 'traveler', label: 'Travelers' },
];

// whose posts of the city are shown, everyone's when role is undefined
export default function RoleTabs({
  role,
  onChange,
}: {
  role: PostRole | undefined;
  onChange: (role: PostRole | undefined) => void;
}) {
  return (
    <div role="group" aria-label="Show posts of" {...stylex.props(styles.tabs)}>
      {TABS.map(({ value, label }) => {
        const selected = value === role;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(value)}
            {...stylex.props(styles.tab, selected && styles.selected)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const styles = stylex.create({
  // scrolls sideways on a narrow screen instead of wrapping
  tabs: {
    display: 'flex',
    gap: { default: '8px', [breakpoints.desktop]: '10px' },
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  tab: {
    flexShrink: 0,
    height: '44px',
    paddingInline: '18px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':hover': auth.muted },
    borderRadius: '22px',
    backgroundColor: 'transparent',
    color: auth.text,
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  selected: {
    borderColor: { default: auth.accent, ':hover': auth.accent },
    backgroundColor: auth.accent,
  },
});
