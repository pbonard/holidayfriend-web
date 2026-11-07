import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type MapPinIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it
export default function MapPinIcon({ size = 20, xstyle }: MapPinIconProps) {
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
      <path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
