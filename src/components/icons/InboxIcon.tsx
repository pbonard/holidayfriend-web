import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type InboxIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// a tray, for the invites. decorative, so screen readers skip it
export default function InboxIcon({ size = 20, xstyle }: InboxIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...stylex.props(xstyle)}
    >
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5L5.5 5z" />
    </svg>
  );
}
