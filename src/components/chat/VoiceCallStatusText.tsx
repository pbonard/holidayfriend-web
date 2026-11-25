'use client';

import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import VoiceCallElapsedTime from '@/components/chat/VoiceCallElapsedTime';
import type { VoiceCallState } from '@/utils/voiceCall';

type VoiceCallStatusProps = {
  // the other person's
  name: string;
  // null while there's none
  call: VoiceCallState | null;
  // why the last one ended, when not by hanging up
  error: string | null;
};

// how the call goes, beside its buttons in the chat's header, or why the last one ended. short, there's little room on
// a phone
export default function VoiceCallStatusText({
  name,
  call,
  error,
}: VoiceCallStatusProps) {
  if (!call) {
    return (
      error && (
        <span role="alert" {...stylex.props(styles.line, styles.error)}>
          {error}
        </span>
      )
    );
  }

  const other = <span {...stylex.props(styles.name)}>{name || 'Someone'}</span>;

  const statusText = () => {
    switch (call.status) {
      case 'starting':
        return 'Starting call…';
      case 'waiting':
        return <>Waiting for {other}</>;
      case 'connecting':
        return 'Connecting…';
      case 'connected':
        return call.otherMuted ? <>{other} is muted</> : 'In call';
      case 'reconnecting':
        return 'Reconnecting…';
      case 'left':
        return <>{other} left</>;
      case 'lost':
        return 'Connection lost';
    }
  };

  return (
    <span {...stylex.props(styles.line)}>
      <span role="status">{statusText()}</span>
      {call.connectedAt !== null && (
        <>
          {' · '}
          <VoiceCallElapsedTime since={call.connectedAt} />
        </>
      )}
    </span>
  );
}

const styles = stylex.create({
  line: {
    // on two lines on a phone, so the name in the header keeps some room
    maxWidth: { default: '84px', [breakpoints.desktop]: 'none' },
    paddingInlineEnd: '4px',
    fontSize: { default: '12px', [breakpoints.desktop]: '14px' },
    lineHeight: 1.3,
    textAlign: 'right',
    color: auth.muted,
  },
  error: {
    color: auth.danger,
  },
  // a long one is cut off
  name: {
    display: 'inline-block',
    maxWidth: { default: '80px', [breakpoints.desktop]: '160px' },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'bottom',
  },
});
