import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

type PhoneIconProps = {
  size?: number;
  // placement and color from the caller, the stroke follows `color` through currentColor
  xstyle?: StyleXStyles;
};

// a phone's handset. decorative, so screen readers skip it
export default function PhoneIcon({ size = 20, xstyle }: PhoneIconProps) {
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
      <path d="M7.2 3.5H5a2 2 0 0 0-2 2.2A16.8 16.8 0 0 0 18.3 21a2 2 0 0 0 2.2-2v-2.2a1.5 1.5 0 0 0-1.2-1.5l-3-.6a1.5 1.5 0 0 0-1.4.4l-1.2 1.2a13 13 0 0 1-6-6l1.2-1.2a1.5 1.5 0 0 0 .4-1.4l-.6-3a1.5 1.5 0 0 0-1.5-1.2Z" />
    </svg>
  );
}
