// the message being written in each chat, kept through a reload: per person logged in and chat, in localStorage
// under chatDraft:<user>:<roomId>. read through useSyncExternalStore (MessageInput): none while prerendering, so the
// page matches the server's, then the kept one. kept in memory too, so typing works when storage is blocked; it's
// only not kept through a reload then

const PREFIX = 'chatDraft';

const drafts = new Map<string, string>();
const listeners = new Set<() => void>();

function keyOf(user: string, roomId: string) {
  return `${PREFIX}:${user}:${roomId}`;
}

export function subscribeDraft(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readDraft(user: string, roomId: string) {
  const key = keyOf(user, roomId);
  const inMemory = drafts.get(key);
  if (inMemory !== undefined) return inMemory;
  let kept = '';
  try {
    kept = localStorage.getItem(key) ?? '';
  } catch {
    // unreadable is the same as none kept
  }
  drafts.set(key, kept);
  return kept;
}

// an empty one isn't kept
export function saveDraft(user: string, roomId: string, text: string) {
  const key = keyOf(user, roomId);
  drafts.set(key, text);
  try {
    if (text) {
      localStorage.setItem(key, text);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // not kept through a reload, it still shows
  }
  listeners.forEach((listener) => listener());
}

// logged out or the account deleted: every chat's draft goes, everyone's
export function clearDrafts() {
  drafts.clear();
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIX}:`))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // unreadable: nothing to remove
  }
  listeners.forEach((listener) => listener());
}
