import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';

type ErrorTextProps = {
  // what failed, in the reader's words
  message: string;
  // the button waits while the retry is on its way
  isRetrying: boolean;
  onRetry: () => void;
  // placement from the caller (centered on a screen of its own, padding and such), applied last
  xstyle?: StyleXStyles;
};

// a load that failed, and a button to ask again
export default function ErrorText({
  message,
  isRetrying,
  onRetry,
  xstyle,
}: ErrorTextProps) {
  return (
    <div {...stylex.props(styles.retry, xstyle)}>
      <p role="alert" {...stylex.props(styles.message)}>
        {message}
      </p>
      <Button
        variant="secondary"
        disabled={isRetrying}
        onClick={onRetry}
        xstyle={styles.button}
      >
        Try again
      </Button>
    </div>
  );
}

const styles = stylex.create({
  retry: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    paddingBlock: '32px',
  },
  message: {
    fontSize: '16px',
    color: auth.danger,
  },
  button: {
    width: '140px',
    height: '44px',
    fontSize: '15px',
  },
});
