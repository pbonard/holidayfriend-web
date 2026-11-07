import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type SuitcaseIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it
export default function SuitcaseIcon({ size = 20, xstyle }: SuitcaseIconProps) {
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
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V4.5h6V7" />
      <path d="M9 12v4" />
      <path d="M15 12v4" />
    </svg>
  );
}
