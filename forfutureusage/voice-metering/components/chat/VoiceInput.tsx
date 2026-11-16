'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import VoicePlayer from '@/components/chat/VoicePlayer';
import WaveformBars from '@/components/chat/WaveformBars';
import SendIcon from '@/components/icons/SendIcon';
import StopIcon from '@/components/icons/StopIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import { formatDuration } from '@/utils/time';
import { encodeWaveform, levelOf } from '@/utils/waveform';

// a recording that long stops by itself
const MAX_SECONDS = 5 * 60;
// how often the microphone's loudness is measured: the live meter moves, and the waveform sent is made of them
const METER_MS = 100;
// how many of the latest the live meter shows, the newest on the right
const METER_BARS = 40;
// what to record in, the first the browser can: AAC in mp4 as the mobile app records (an m4a), which every phone
// plays. Firefox records only webm or ogg (opus): the web and Android play it, an iPhone may not
const RECORDING_TYPES = [
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
];

// whether this browser can record at all: the microphone button shows only then
export function canRecordVoice() {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function pickRecordingType() {
  return RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

// the recording as a file to upload: its type without codecs, starting with "audio/" as garage's form wants
function toFile(chunks: Blob[], recorderType: string) {
  const subtype = (recorderType.split(';')[0] || 'audio/webm').split('/')[1];
  const type = `audio/${subtype}`;
  const extension = subtype === 'mp4' ? 'm4a' : subtype;
  return new File(chunks, `voice.${extension}`, { type });
}

type Recording =
  | { step: 'starting' }
  | { step: 'recording' }
  | { step: 'recorded'; file: File; url: string; waveform: string }
  | { step: 'failed'; message: string };

type VoiceInputProps = {
  // done without sending: the recording thrown away
  onCancel: () => void;
  // the recording, the object url its player showed, which goes with it, and its waveform (utils/waveform)
  onSend: (file: File, url: string, waveform: string) => void;
};

// in the input's place, as mobile's VoiceInput: recording at once, with how long so far and a live meter of how loud,
// Stop, and the trash to throw it away. the loudness measured along the way becomes its waveform. stopped, it plays
// back before it's sent. the microphone is let go as soon as it stops
export default function VoiceInput({ onCancel, onSend }: VoiceInputProps) {
  const [recording, setRecording] = useState<Recording>({ step: 'starting' });
  const [seconds, setSeconds] = useState(0);
  // the latest loudness measured, for the live meter
  const [meter, setMeter] = useState<number[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  // the player's object url, let go when this goes, unless it went with the message
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let audioContext: AudioContext | null = null;
    const release = () => {
      clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close().catch(() => undefined);
      audioContext = null;
    };

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelled) {
          setRecording({
            step: 'failed',
            message:
              "Couldn't use the microphone. Check that this site may use it.",
          });
        }
        return;
      }
      if (cancelled) {
        release();
        return;
      }
      const type = pickRecordingType();
      const recorder = new MediaRecorder(
        stream,
        type ? { mimeType: type } : undefined,
      );
      // the microphone's loudness, from the same stream, nothing played out
      audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      const levels: number[] = [];
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        release();
        if (cancelled) return;
        const file = toFile(chunks, recorder.mimeType || type || '');
        const url = URL.createObjectURL(file);
        urlRef.current = url;
        setRecording({
          step: 'recorded',
          file,
          url,
          waveform: encodeWaveform(levels),
        });
      };
      recorderRef.current = recorder;
      recorder.start();
      const startedAt = Date.now();
      setRecording({ step: 'recording' });
      timer = setInterval(() => {
        levels.push(levelOf(analyser, samples));
        setMeter(levels.slice(-METER_BARS));
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS && recorder.state === 'recording') {
          recorder.stop();
        }
      }, METER_MS);
    })();

    return () => {
      cancelled = true;
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      release();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const send = () => {
    if (recording.step !== 'recorded') return;
    // it goes with the message now, its bubble lets it go
    urlRef.current = null;
    onSend(recording.file, recording.url, recording.waveform);
  };

  return (
    <div {...stylex.props(styles.row)}>
      <Button
        variant="secondary"
        aria-label="Delete recording"
        onClick={onCancel}
        xstyle={styles.square}
      >
        <TrashIcon size={20} />
      </Button>
      <div {...stylex.props(styles.middle)}>
        {recording.step === 'recorded' ? (
          <VoicePlayer
            url={recording.url}
            label="recording"
            xstyle={styles.player}
            waveform={recording.waveform}
          />
        ) : recording.step === 'failed' ? (
          <p role="alert" {...stylex.props(styles.error)}>
            {recording.message}
          </p>
        ) : (
          <>
            <p role="status" {...stylex.props(styles.status)}>
              <span aria-hidden="true" {...stylex.props(styles.dot)} />
              {recording.step === 'starting'
                ? 'Starting…'
                : `Recording ${formatDuration(seconds)}`}
            </p>
            {/* the newest on the right, silence before the first */}
            <div {...stylex.props(styles.meter)}>
              <WaveformBars
                levels={[
                  ...Array<number>(METER_BARS - meter.length).fill(0),
                  ...meter,
                ]}
              />
            </div>
          </>
        )}
      </div>
      {recording.step === 'recorded' ? (
        <Button
          aria-label="Send voice message"
          onClick={send}
          xstyle={styles.square}
        >
          <SendIcon size={20} />
        </Button>
      ) : (
        <Button
          aria-label="Stop recording"
          disabled={recording.step !== 'recording'}
          onClick={stop}
          xstyle={styles.square}
        >
          <StopIcon size={18} />
        </Button>
      )}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  // as MessageInput's: an icon in a square as tall as the input
  square: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '48px',
    height: '48px',
    padding: 0,
    borderRadius: '12px',
  },
  // where the text input was
  middle: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 0,
    minHeight: '48px',
  },
  // as wide as the input's place
  player: {
    width: '100%',
  },
  // the rest of the input's place, as tall as the bars
  meter: {
    flexGrow: 1,
    minWidth: 0,
    height: '28px',
    marginInlineStart: '16px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
    fontVariantNumeric: 'tabular-nums',
    color: auth.text,
  },
  // red, as a recording light
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: auth.danger,
  },
  error: {
    fontSize: '14px',
    color: auth.danger,
  },
});
