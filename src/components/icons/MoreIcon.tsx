import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type MoreIconProps = {
  size?: number;
  // three dots in a row, or one above the other for a card's corner
  vertical?: boolean;
  // placement and color from the caller, the dots follow `color` through currentColor
  xstyle?: StyleXStyles;
};

// decorative, so screen readers skip it: the button it's on says what it is
export default function MoreIcon({ size = 20, vertical = false, xstyle }: MoreIconProps) {
  const dots = [6, 12, 18];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...stylex.props(xstyle)}
    >
      {dots.map((at) => (
        <circle key={at} cx={vertical ? 12 : at} cy={vertical ? at : 12} r="1.7" />
      ))}
    </svg>
  );
}
