import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type StopIconProps = {
  size?: number;
  // placement and color from the caller, the fill follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// a stop square. decorative, so screen readers skip it
export default function StopIcon({ size = 20, xstyle }: StopIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...stylex.props(xstyle)}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
