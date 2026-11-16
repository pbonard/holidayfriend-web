'use client';

import { useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import PauseIcon from '@/components/icons/PauseIcon';
import PlayIcon from '@/components/icons/PlayIcon';
import { formatDuration } from '@/utils/time';

// how far an arrow key moves through it
const STEP_SECONDS = 5;

type VoicePlayerProps = {
  // the recording, as an address an <audio> plays: a kept file's object url, or the one just recorded
  url: string;
  label: string;
  // its width from the caller: VoiceInput's fills the input's place. a message's is 240 wide
  xstyle?: StyleXStyles;
};

// a voice message as mobile's VoiceMessage shows it: play and pause, a line of how far it's played that a press drags
// along (or the arrow keys), and the time played of the length. one recorded in a browser as webm doesn't
// say its length until it's read to the end: it's read there once, quietly, then back to the start
export default function VoicePlayer({ url, label, xstyle }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // reading a webm's length: the time it reports meanwhile isn't where it plays
  const findingLengthRef = useRef(false);
  // dragging along the line: where it's dragged shows, not where it plays meanwhile
  const draggingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    void audio.play();
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;
    audio.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrent(audio.currentTime);
  };

  // to where the pointer is along the line
  const seekToPointer = (event: React.PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0) return;
    seekTo(((event.clientX - box.left) / box.width) * duration);
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div {...stylex.props(styles.player, xstyle)}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          if (Number.isFinite(audio.duration)) {
            setDuration(audio.duration);
          } else {
            findingLengthRef.current = true;
            audio.currentTime = Number.MAX_SAFE_INTEGER;
          }
        }}
        onDurationChange={(event) => {
          const audio = event.currentTarget;
          if (!Number.isFinite(audio.duration)) return;
          setDuration(audio.duration);
          if (findingLengthRef.current) {
            findingLengthRef.current = false;
            audio.currentTime = 0;
          }
        }}
        onTimeUpdate={(event) => {
          if (!findingLengthRef.current && !draggingRef.current) {
            setCurrent(event.currentTarget.currentTime);
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        onClick={toggle}
        {...stylex.props(styles.toggle)}
      >
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </button>
      <div {...stylex.props(styles.content)}>
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${label}, position`}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatDuration(current)} of ${formatDuration(duration)}`}
          // pressed anywhere on it, it goes there and follows the pointer until it's let go, outside it too
          onPointerDown={(event) => {
            if (duration === 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            draggingRef.current = true;
            seekToPointer(event);
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) seekToPointer(event);
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') seekTo(current + STEP_SECONDS);
            else if (event.key === 'ArrowLeft') seekTo(current - STEP_SECONDS);
            else return;
            event.preventDefault();
          }}
          {...stylex.props(styles.slider)}
        >
          <div {...stylex.props(styles.line)}>
            <div {...stylex.props(styles.fill(progress))} />
          </div>
        </div>
        <span {...stylex.props(styles.time)}>
          {formatDuration(current)} / {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}

const styles = stylex.create({
  // as mobile's: a box at least 220 wide
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '240px',
    maxWidth: '100%',
    paddingBlock: '10px',
    paddingInline: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '14px',
    backgroundColor: auth.card,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '36px',
    height: '36px',
    padding: 0,
    borderWidth: 0,
    borderRadius: '50%',
    backgroundColor: { default: auth.control, ':hover': auth.border },
    color: auth.text,
    cursor: 'pointer',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexGrow: 1,
    minWidth: 0,
  },
  // taller than the line it shows, so it's easy to grab. a touch on it drags, it doesn't scroll the chat
  slider: {
    paddingBlock: '6px',
    marginBlock: '-6px',
    cursor: 'pointer',
    touchAction: 'none',
    borderRadius: '6px',
    outline: { default: 'none', ':focus-visible': `2px solid ${auth.link}` },
    outlineOffset: '2px',
  },
  line: {
    position: 'relative',
    height: '6px',
    borderRadius: '999px',
    backgroundColor: auth.control,
  },
  fill: (progress: number) => ({
    width: `${progress * 100}%`,
    height: '100%',
    borderRadius: '999px',
    backgroundColor: auth.link,
  }),
  time: {
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
    color: auth.muted,
  },
});
