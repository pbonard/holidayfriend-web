'use client';

import * as stylex from '@stylexjs/stylex';
import { useMediaURL } from '@/hooks/useChat';
import { auth } from '@/styles/tokens.stylex';

// a video of a message, as on mobile: from this browser (db/media), downloaded whole as its message arrived, so it
// plays with nothing to buffer
export default function VideoMessage({ filename }: { filename: string }) {
  const media = useMediaURL('video', filename);

  if (!media.url) {
    return (
      <span {...stylex.props(styles.box, styles.placeholder)}>
        {media.isError ? 'Video unavailable' : null}
      </span>
    );
  }
  return (
    <video
      src={media.url}
      controls
      playsInline
      preload="metadata"
      aria-label="Video"
      {...stylex.props(styles.box, styles.video)}
    />
  );
}

const styles = stylex.create({
  box: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '280px',
    maxWidth: '100%',
    height: '200px',
    borderRadius: '12px',
  },
  placeholder: {
    backgroundColor: auth.card,
    color: auth.muted,
    fontSize: '13px',
  },
  video: {
    backgroundColor: '#000',
  },
});
