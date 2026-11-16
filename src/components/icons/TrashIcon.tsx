import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type TrashIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// a trash can. decorative, so screen readers skip it
export default function TrashIcon({ size = 20, xstyle }: TrashIconProps) {
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
      <path d="M4 7h16" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 12.5h9l1-12.5" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}
