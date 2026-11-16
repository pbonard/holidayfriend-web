// a voice message's waveform: how loud it was along the way, measured while it was recorded (VoiceInput) and sent
// with it as contents[1], after its file. WAVEFORM_BARS digits, 0 for silence to 9 for loudest: "0137986420…".
// chat stores it as it is. the mobile app keeps only the file for now

export const WAVEFORM_BARS = 48;

// quieter than this is silence. the loudness between it and 0 dB is spread over 0 to 1
const SILENCE_DB = -50;

// how loud the microphone is right now, 0 to 1: the analyser's latest samples, their average power in decibels
export function levelOf(
  analyser: AnalyserNode,
  samples: Float32Array<ArrayBuffer>,
) {
  analyser.getFloatTimeDomainData(samples);
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  const rms = Math.sqrt(sum / samples.length);
  const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  return Math.min(1, Math.max(0, (db - SILENCE_DB) / -SILENCE_DB));
}

// the levels measured, as many as there were, into WAVEFORM_BARS digits: each bar the loudest of its stretch
export function encodeWaveform(levels: number[]) {
  if (levels.length === 0) return '';
  return Array.from({ length: WAVEFORM_BARS }, (_, bar) => {
    const start = Math.floor((bar * levels.length) / WAVEFORM_BARS);
    const end = Math.max(
      start + 1,
      Math.floor(((bar + 1) * levels.length) / WAVEFORM_BARS),
    );
    const loudest = Math.max(...levels.slice(start, end));
    return String(Math.round(loudest * 9));
  }).join('');
}

// the bars, 0 to 1, from contents[1]. null when there's none or it isn't one (mobile's voice messages have none)
export function decodeWaveform(text: string | undefined) {
  if (!text || !/^[0-9]+$/.test(text)) return null;
  return Array.from(text, (digit) => Number(digit) / 9);
}
