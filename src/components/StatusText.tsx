import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

type StatusTextProps = {
  children: React.ReactNode;
  // placement from the caller (margins and such), applied last
  xstyle?: StyleXStyles;
};

// a quiet line in place of content that isn't there: loading, or nothing to show. a screen reader reads it
// out when it changes
export default function StatusText({ children, xstyle }: StatusTextProps) {
  return (
    <p role="status" {...stylex.props(styles.status, xstyle)}>
      {children}
    </p>
  );
}

const styles = stylex.create({
  status: {
    paddingBlock: '32px',
    fontSize: '16px',
    color: auth.muted,
  },
});
