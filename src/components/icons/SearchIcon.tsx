import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type SearchIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it
export default function SearchIcon({ size = 20, xstyle }: SearchIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...stylex.props(xstyle)}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
