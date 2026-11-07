import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type LightbulbIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it
export default function LightbulbIcon({ size = 20, xstyle }: LightbulbIconProps) {
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
      <path d="M9.5 21h5" />
      <path d="M9.5 17.5h5" />
      <path d="M15 14.5c1.3-1 2-2.5 2-4.5a5 5 0 0 0-10 0c0 2 .7 3.5 2 4.5.4.3.5.7.5 1.5v1.5h5V16c0-.8.1-1.2.5-1.5z" />
    </svg>
  );
}
