import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type PlayIconProps = {
  size?: number;
  // placement and color from the caller, the fill follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// a play triangle. decorative, so screen readers skip it
export default function PlayIcon({ size = 20, xstyle }: PlayIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...stylex.props(xstyle)}
    >
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}
