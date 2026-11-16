import { sendMessage } from '@/api/chat';
import { done, openDB, promised, saveSentMessage } from '@/db/message';
import type { MessagingResponse } from '@/types/chat';

// one's own text messages until chat answers. shown at once at the end of their chat, dimmed. chat's answer with the
// message's id is success: it's kept as a message then (saveSentMessage) and goes from here. no answer: not sent,
// with Retry and Delete. kept in IndexedDB's pending store, [user, key], so a reload or a closed tab doesn't lose
// them. sending, or not sent (it failed, or the page went away while it went). one tab sends an item at a time (Web
// Locks): another tab doesn't offer to retry what's still on its way elsewhere

export type PendingMessage = {
  key: string;
  roomId: string;
  contentType: 'text';
  text: string;
  status: 'sending' | 'failed';
};

type PendingRecord = {
  user: string;
  key: string;
  roomId: string;
  contentType: 'text';
  text: string;
};

type Pending = Readonly<Record<string, readonly PendingMessage[]>>;

const NONE: readonly PendingMessage[] = [];

let userId: string | null = null;
let pending: Pending = {};
const listeners = new Set<() => void>();

// --- in memory, for the screens ---

function notify() {
  listeners.forEach((listener) => listener());
}

function setRoom(roomId: string, items: readonly PendingMessage[]) {
  pending = { ...pending, [roomId]: items };
  notify();
}

function update(roomId: string, key: string, change: Partial<PendingMessage>) {
  setRoom(
    roomId,
    (pending[roomId] ?? NONE).map((item) =>
      item.key === key ? { ...item, ...change } : item,
    ),
  );
}

// out of the chat
function drop(roomId: string, key: string) {
  setRoom(
    roomId,
    (pending[roomId] ?? NONE).filter((each) => each.key !== key),
  );
}

function toPending(record: PendingRecord): PendingMessage {
  return {
    key: record.key,
    roomId: record.roomId,
    contentType: record.contentType,
    text: record.text,
    status: 'failed',
  };
}

export function subscribePending(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPending(roomId: string) {
  return pending[roomId] ?? NONE;
}

export function getServerPending() {
  return NONE;
}

// --- IndexedDB ---

async function putRecord(record: PendingRecord) {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  tx.objectStore('pending').put(record);
  await done(tx);
}

async function getRecord(user: string, key: string) {
  const db = await openDB();
  return (await promised(
    db.transaction('pending').objectStore('pending').get([user, key]),
  )) as PendingRecord | undefined;
}

async function deleteRecord(user: string, key: string) {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  tx.objectStore('pending').delete([user, key]);
  await done(tx);
}

async function getRecords(user: string) {
  const db = await openDB();
  const range = IDBKeyRange.bound([user, ''], [user, '￿']);
  return (await promised(
    db.transaction('pending').objectStore('pending').getAll(range),
  )) as PendingRecord[];
}

// --- sending ---

// one item at a time across tabs: held while it's on its way. without Web Locks, just this tab's
function lockName(key: string) {
  return `chat-pending:${key}`;
}

async function withLock(key: string, work: () => Promise<void>) {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    await work();
    return;
  }
  await navigator.locks.request(
    lockName(key),
    { ifAvailable: true },
    async (lock) => {
      // held by another tab: it's on its way there
      if (lock) await work();
    },
  );
}

// the message to chat: the id chat gives it
async function deliver(record: PendingRecord, contents: string[]) {
  const { id } = await sendMessage({
    toIdType: 'personal',
    toId: record.roomId,
    contentType: record.contentType,
    contents,
    noPush: true,
  });
  return id;
}

// to chat. the message as chat took it
async function sendRecord(
  user: string,
  record: PendingRecord,
): Promise<MessagingResponse> {
  const contents = [record.text];
  return {
    id: await deliver(record, contents),
    roomId: record.roomId,
    fromId: user,
    contentType: record.contentType,
    contents,
  };
}

// the item to chat. answered, it's sent: kept as a message with chat's id, then out of here, so it shows as a message
// before its pending one goes. the relay that comes later is kept once. failed, it stays as not sent, to retry
async function run(user: string, key: string) {
  await withLock(key, async () => {
    const record = await getRecord(user, key);
    if (!record) return;
    update(record.roomId, key, { status: 'sending' });
    let sent: MessagingResponse;
    try {
      sent = await sendRecord(user, record);
    } catch {
      update(record.roomId, key, { status: 'failed' });
      return;
    }
    try {
      await saveSentMessage(user, sent);
    } finally {
      // sent either way: if it couldn't be kept here, the relay keeps it
      await deleteRecord(user, key);
      drop(record.roomId, key);
    }
  });
}

// kept first, so it outlives the page, then on its way
async function start(
  user: string,
  item: PendingMessage,
  record: PendingRecord,
) {
  setRoom(item.roomId, [...getPending(item.roomId), item]);
  try {
    await putRecord(record);
  } catch {
    // not kept (IndexedDB unavailable): it can't be sent and come back, it's dropped
    drop(item.roomId, item.key);
    return;
  }
  await run(user, item.key);
}

// a text message
export async function sendText(user: string, roomId: string, text: string) {
  const key = crypto.randomUUID();
  await start(
    user,
    { key, roomId, contentType: 'text', text, status: 'sending' },
    { user, key, roomId, contentType: 'text', text },
  );
}

export function retryPending(user: string, key: string) {
  void run(user, key);
}

// not sent, and not to be: out of the pending ones and the chat
export async function deletePending(user: string, roomId: string, key: string) {
  await deleteRecord(user, key);
  drop(roomId, key);
}

// after a reload: what's kept and not on its way in another tab, as not sent, to retry or delete. nothing here was
// answered: an answered one is a message already. a text has nothing of chat's to know it by: it stays not sent until
// it's retried or deleted, even the rare one chat took though its answer was lost (it shows twice then)
export async function restorePending(user: string) {
  if (userId === user) return;
  userId = user;
  pending = {};
  notify();
  let records: PendingRecord[];
  try {
    records = await getRecords(user);
  } catch {
    return;
  }
  const held = new Set(
    typeof navigator !== 'undefined' && navigator.locks
      ? ((await navigator.locks.query()).held ?? []).map(({ name }) => name)
      : [],
  );
  const shown = records.filter((record) => !held.has(lockName(record.key)));
  if (userId !== user) return;
  const next: Record<string, PendingMessage[]> = {};
  for (const record of shown) {
    (next[record.roomId] ??= []).push(toPending(record));
  }
  pending = next;
  notify();
}
