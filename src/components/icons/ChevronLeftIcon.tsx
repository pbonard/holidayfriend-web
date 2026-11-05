import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type ChevronLeftIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it
export default function ChevronLeftIcon({ size = 14, xstyle }: ChevronLeftIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" {...stylex.props(xstyle)}>
      <path
        d="M8.5 3 4.5 7l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
