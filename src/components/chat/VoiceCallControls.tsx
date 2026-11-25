import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import VoiceCallStatusText from '@/components/chat/VoiceCallStatusText';
import MicIcon from '@/components/icons/MicIcon';
import MicOffIcon from '@/components/icons/MicOffIcon';
import PhoneIcon from '@/components/icons/PhoneIcon';
import type { VoiceCallState } from '@/utils/voiceCall';

type VoiceCallControlsProps = {
  // the other person's
  name: string;
  // null while there's none
  call: VoiceCallState | null;
  // why the last one ended, when not by hanging up
  error: string | null;
  // false until a call can start
  ready: boolean;
  onStart: () => void;
  onToggleMute: () => void;
  onHangUp: () => void;
};

// in the chat's header, left of the three dots: the call button, and in a call how it goes, the microphone and
// hanging up in its place. in the header and not a bar of their own, so a call neither moves the messages nor covers them
export default function VoiceCallControls({
  name,
  call,
  error,
  ready,
  onStart,
  onToggleMute,
  onHangUp,
}: VoiceCallControlsProps) {
  return (
    <div {...stylex.props(styles.controls)}>
      <VoiceCallStatusText name={name} call={call} error={error} />
      {call ? (
        <>
          <button
            type="button"
            aria-label={call.muted ? 'Turn on your mic' : 'Turn off your mic'}
            onClick={onToggleMute}
            {...stylex.props(styles.button, call.muted && styles.muted)}
          >
            {call.muted ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
          </button>
          <button
            type="button"
            aria-label="Leave call"
            onClick={onHangUp}
            {...stylex.props(styles.button, styles.hangUp)}
          >
            <PhoneIcon size={20} xstyle={styles.hungUp} />
          </button>
        </>
      ) : (
        <button
          type="button"
          aria-label={`Call ${name || 'them'}`}
          disabled={!ready}
          onClick={onStart}
          {...stylex.props(styles.button)}
        >
          <PhoneIcon size={20} />
        </button>
      )}
    </div>
  );
}

const styles = stylex.create({
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  // as the three dots beside it
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '40px',
    height: '40px',
    padding: 0,
    borderWidth: 0,
    borderRadius: '10px',
    color: auth.text,
    backgroundColor: {
      default: 'transparent',
      ':hover:not(:disabled)': auth.control,
    },
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    opacity: { default: 1, ':disabled': 0.5 },
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
  },
  muted: {
    color: auth.danger,
  },
  hangUp: {
    // dark on the red: the light text is too faint on it
    color: auth.hero,
    backgroundColor: auth.danger,
  },
  // the handset put down
  hungUp: {
    transform: 'rotate(135deg)',
  },
});
