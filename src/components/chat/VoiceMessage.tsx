'use client';

import * as stylex from '@stylexjs/stylex';
import { useMediaURL } from '@/hooks/useChat';
import { auth } from '@/styles/tokens.stylex';
import VoicePlayer from '@/components/chat/VoicePlayer';

// a voice message's recording, from this browser (db/media), downloaded as its message arrived, as on mobile
export default function VoiceMessage({ filename }: { filename: string }) {
  const media = useMediaURL('audio', filename);

  if (!media.url) {
    return (
      <span {...stylex.props(styles.placeholder)}>
        {media.isError ? 'Voice message unavailable' : 'Voice message'}
      </span>
    );
  }
  return <VoicePlayer url={media.url} label="voice message" />;
}

const styles = stylex.create({
  // as tall and wide as the player, until it's there
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    width: '240px',
    maxWidth: '100%',
    height: '58px',
    paddingInline: '14px',
    borderRadius: '14px',
    backgroundColor: auth.card,
    color: auth.muted,
    fontSize: '13px',
  },
});
