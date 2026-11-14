// as tall as its text, never shorter than its rows. not field-sizing: content, safari and firefox don't all have it yet
export function fitToContent(textarea: HTMLTextAreaElement) {
  // back to the rows' height first, so it can shrink when text is deleted
  textarea.style.height = 'auto';
  // scrollHeight leaves out the border, and the box sizes with it
  const border = textarea.offsetHeight - textarea.clientHeight;
  textarea.style.height = `${textarea.scrollHeight + border}px`;
}

// a person's profile page, /profile/{id}
export function profilePath(userId: string) {
  return `/profile/${userId}`;
}

// when a uuid v7 was made: its first 48 bits are the unix time in milliseconds
export function timeOfId(id: string) {
  return new Date(parseInt(id.replace(/-/g, '').slice(0, 12), 16));
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

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
