import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type ChevronDownIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it
export default function ChevronDownIcon({ size = 12, xstyle }: ChevronDownIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" {...stylex.props(xstyle)}>
      <path
        d="m3 4.5 3 3 3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
