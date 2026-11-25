'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { formatDuration } from '@/utils/time';

// how long the two of a call have been connected, since being Date.now() then. not in the call's role="status", a
// screen reader would read every second of it
export default function VoiceCallElapsedTime({ since }: { since: number }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => setSeconds((Date.now() - since) / 1000);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [since]);

  return (
    <span {...stylex.props(styles.elapsed)}>{formatDuration(seconds)}</span>
  );
}

const styles = stylex.create({
  elapsed: {
    fontVariantNumeric: 'tabular-nums',
  },
});
