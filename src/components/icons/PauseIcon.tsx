import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type PauseIconProps = {
  size?: number;
  // placement and color from the caller, the fill follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// two pause bars. decorative, so screen readers skip it
export default function PauseIcon({ size = 20, xstyle }: PauseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...stylex.props(xstyle)}
    >
      <rect x="6.5" y="5" width="4" height="14" rx="1" />
      <rect x="13.5" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
