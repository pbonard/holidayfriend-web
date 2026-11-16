'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';

// a video not sent yet, with its controls, as a sent video plays, to see what's being sent. dimmed as the rest of
// the bubble, but not while it plays or fills the screen
export default function PendingVideo({ url, label }: { url: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onFullscreen = () =>
      setFullscreen(document.fullscreenElement === video);
    // safari on a phone fills the screen with its own player, with events of its own
    const onBegin = () => setFullscreen(true);
    const onEnd = () => setFullscreen(false);
    document.addEventListener('fullscreenchange', onFullscreen);
    video.addEventListener('webkitbeginfullscreen', onBegin);
    video.addEventListener('webkitendfullscreen', onEnd);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen);
      video.removeEventListener('webkitbeginfullscreen', onBegin);
      video.removeEventListener('webkitendfullscreen', onEnd);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
      {...stylex.props(styles.box, (playing || fullscreen) && styles.undimmed)}
    />
  );
}

const styles = stylex.create({
  // the size VideoMessage shows it at, so nothing moves when the message takes its place. dimmed until it's sent, as
  // the rest of PendingMediaItem's bubble
  box: {
    display: 'block',
    width: '280px',
    maxWidth: '100%',
    height: '200px',
    borderRadius: '12px',
    backgroundColor: '#000',
    opacity: 0.6,
  },
  // playing, or filling the screen: seen as it is
  undimmed: {
    opacity: 1,
  },
});
