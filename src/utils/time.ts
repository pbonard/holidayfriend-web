const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// when a uuid v7 was made: its first 48 bits are the unix time in milliseconds
export function timeOfId(id: string) {
  return new Date(parseInt(id.replace(/-/g, '').slice(0, 12), 16));
}

// a clock, a minute at a time, for useSyncExternalStore: useSyncExternalStore(subscribeMinute, getMinute, () => null).
// none while prerendering, which mustn't read the time: it would be the build's. it's read anew as something starts
// watching it, so one shown later doesn't show an old time
let minute: Date | null = null;

export function subscribeMinute(listener: () => void) {
  minute = new Date();
  listener();
  const timer = setInterval(() => {
    minute = new Date();
    listener();
  }, MINUTE);
  return () => clearInterval(timer);
}

// read while rendering, which can come before the first subscribe
export function getMinute() {
  minute ??= new Date();
  return minute;
}

export function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

// "Today", "Yesterday", then the date: "Mon, Nov 10", with the year when it isn't this one
export function dayLabel(date: Date, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

// "just now", "2m ago", "1h ago", "3d ago", then the date: "Mar 4", with the year when it isn't this one
export function timeAgo(date: Date, now = new Date()) {
  const ago = now.getTime() - date.getTime();
  if (ago < MINUTE) return 'just now';
  if (ago < HOUR) return `${Math.floor(ago / MINUTE)}m ago`;
  if (ago < DAY) return `${Math.floor(ago / HOUR)}h ago`;
  if (ago < 7 * DAY) return `${Math.floor(ago / DAY)}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

// a length in seconds as "m:ss", for a voice message: "0:07", "2:30". 0 when it isn't known yet
export function formatDuration(seconds: number) {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

// how long a video runs, from its metadata. 0 when the browser can't read it, which lets it through
export function videoSeconds(file: File) {
  return new Promise<number>((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    video.preload = 'metadata';
    video.onloadedmetadata = () =>
      done(Number.isFinite(video.duration) ? video.duration : 0);
    video.onerror = () => done(0);
    video.src = url;
  });
}
