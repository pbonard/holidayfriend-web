import { generatePresignedURL, sendMessage, uploadToStorage } from '@/api/chat';
import { keepMedia } from '@/db/media';
import { saveSentMessage } from '@/db/message';
import { query, transaction } from '@/db/sqlite';
import type { MediaType, MessagingResponse } from '@/types/chat';
import { compressImage } from '@/utils/compressImage';

export type PendingContentType = 'text' | MediaType;

export type PendingMessage = {
  key: string;
  roomId: string;
  contentType: PendingContentType;
  // a text's, '' for photos and videos
  text: string;
  // photos' and videos' object urls, for the bubble. none for a text
  urls: string[];
  status: 'sending' | 'failed';
  // photos' and videos' bytes sent and in all while sending. total 0 while photos are still made smaller
  sent: number;
  total: number;
  // photos' and videos' names, once uploaded, as in its record: what finds them relayed (isRelayOf)
  uploaded?: string[];
};

type PendingRecord = {
  user: string;
  key: string;
  roomId: string;
  contentType: PendingContentType;
  // a text's
  text?: string;
  // photos' or videos', as picked, the originals: made smaller again on each try
  files?: File[];
  // the names garage keeps them under, once uploaded: a retry only sends the message
  uploaded?: string[];
};

type Pending = Readonly<Record<string, readonly PendingMessage[]>>;

const NONE: readonly PendingMessage[] = [];
// what my-server's chat answers to a message naming files it doesn't know as uploaded (gone, or sent already)
const BAD_REQUEST = 'bad request';

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

// out of the chat, its object urls let go a moment later, once the bubble that showed them is gone
function drop(roomId: string, key: string) {
  const item = (pending[roomId] ?? NONE).find((each) => each.key === key);
  if (!item) return;
  setRoom(
    roomId,
    (pending[roomId] ?? NONE).filter((each) => each.key !== key),
  );
  setTimeout(() => item.urls.forEach((url) => URL.revokeObjectURL(url)), 1000);
}

function toPending(record: PendingRecord): PendingMessage {
  return {
    key: record.key,
    roomId: record.roomId,
    contentType: record.contentType,
    text: record.text ?? '',
    urls: (record.files ?? []).map((file) => URL.createObjectURL(file)),
    status: 'failed',
    sent: 0,
    total: 0,
    uploaded: record.uploaded,
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

type PendingRow = {
  key: string;
  room_id: string;
  content_type: PendingContentType;
  text: string | null;
  uploaded: string | null;
};
type FileRow = {
  key: string;
  name: string;
  type: string;
  last_modified: number;
  data: Uint8Array;
};

async function putRecord(record: PendingRecord) {
  const files = await Promise.all(
    (record.files ?? []).map(async (file) => ({
      file,
      data: new Uint8Array(await file.arrayBuffer()),
    })),
  );
  await transaction(async (sql) => {
    await sql(
      `INSERT OR REPLACE INTO pending (user, key, room_id, content_type, text, uploaded)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.user,
        record.key,
        record.roomId,
        record.contentType,
        record.text ?? null,
        record.uploaded ? JSON.stringify(record.uploaded) : null,
      ],
    );
    await sql(`DELETE FROM pending_file WHERE user = ? AND key = ?`, [
      record.user,
      record.key,
    ]);
    for (const [position, { file, data }] of files.entries()) {
      await sql(
        `INSERT INTO pending_file (user, key, position, name, type, last_modified, data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.user,
          record.key,
          position,
          file.name,
          file.type,
          file.lastModified,
          data,
        ],
      );
    }
  });
}

function toRecord(user: string, row: PendingRow, files: FileRow[]) {
  const picked = files
    .filter(({ key }) => key === row.key)
    .map(
      (file) =>
        new File([new Uint8Array(file.data)], file.name, {
          type: file.type,
          lastModified: file.last_modified,
        }),
    );
  return {
    user,
    key: row.key,
    roomId: row.room_id,
    contentType: row.content_type,
    text: row.text ?? undefined,
    files: picked.length > 0 ? picked : undefined,
    uploaded: row.uploaded ? (JSON.parse(row.uploaded) as string[]) : undefined,
  } satisfies PendingRecord;
}

async function getRecord(user: string, key: string) {
  const [row] = await query<PendingRow>(
    `SELECT key, room_id, content_type, text, uploaded FROM pending WHERE user = ? AND key = ?`,
    [user, key],
  );
  if (!row) return undefined;
  const files = await query<FileRow>(
    `SELECT key, name, type, last_modified, data FROM pending_file
     WHERE user = ? AND key = ? ORDER BY position`,
    [user, key],
  );
  return toRecord(user, row, files);
}

async function deleteRecord(user: string, key: string) {
  await transaction(async (sql) => {
    await sql(`DELETE FROM pending WHERE user = ? AND key = ?`, [user, key]);
    await sql(`DELETE FROM pending_file WHERE user = ? AND key = ?`, [
      user,
      key,
    ]);
  });
}

async function getRecords(user: string) {
  const rows = await query<PendingRow>(
    `SELECT key, room_id, content_type, text, uploaded FROM pending WHERE user = ?`,
    [user],
  );
  if (rows.length === 0) return [];
  const files = await query<FileRow>(
    `SELECT key, name, type, last_modified, data FROM pending_file
     WHERE user = ? ORDER BY key, position`,
    [user],
  );
  return rows.map((row) => toRecord(user, row, files));
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

// photos made smaller, as the mobile app's picker does, uploaded straight to garage with the bytes reported as they
// go, kept in Cache Storage as uploaded (they're never downloaded back), their names kept in the record
async function upload(record: PendingRecord) {
  const { key, roomId } = record;
  const contentType = record.contentType as MediaType;
  const files = record.files ?? [];
  const ready =
    contentType === 'image'
      ? await Promise.all(files.map(compressImage))
      : files;
  const uploads = await generatePresignedURL({ contentType, n: ready.length });
  const sent = ready.map(() => 0);
  const totals = ready.map((file) => file.size);
  const report = () =>
    update(roomId, key, {
      sent: sent.reduce((sum, bytes) => sum + bytes, 0),
      total: totals.reduce((sum, bytes) => sum + bytes, 0),
    });
  report();
  await Promise.all(
    uploads.map((presigned, index) =>
      uploadToStorage(presigned, ready[index], (fileSent, fileTotal) => {
        sent[index] = fileSent;
        totals[index] = fileTotal;
        report();
      }),
    ),
  );
  const filenames = uploads.map(({ filename }) => filename);
  await keepMedia(contentType, filenames, ready);
  const uploaded = { ...record, uploaded: filenames };
  await putRecord(uploaded);
  update(roomId, key, { uploaded: filenames });
  return uploaded;
}

// to chat: a text as it is, photos and videos uploaded unless they were. the message as chat took it
async function sendRecord(
  user: string,
  record: PendingRecord,
): Promise<MessagingResponse> {
  const message = (id: string, contents: string[]) => ({
    id,
    roomId: record.roomId,
    fromId: user,
    contentType: record.contentType,
    contents,
  });
  if (record.contentType === 'text') {
    const contents = [record.text ?? ''];
    return message(await deliver(record, contents), contents);
  }
  if (record.uploaded) {
    try {
      return message(await deliver(record, record.uploaded), record.uploaded);
    } catch (error) {
      // chat no longer knows them as uploaded: up again, under new names
      if (!(error instanceof Error && error.message === BAD_REQUEST))
        throw error;
    }
  }
  const uploaded =
    (await upload({ ...record, uploaded: undefined })).uploaded ?? [];
  return message(await deliver(record, uploaded), uploaded);
}

// the item to chat. answered, it's sent: kept as a message with chat's id, then out of here, so it shows as a message
// before its pending one goes. the relay that comes later is kept once. failed, it stays as not sent, to retry
async function run(user: string, key: string) {
  await withLock(key, async () => {
    const record = await getRecord(user, key);
    if (!record) return;
    update(record.roomId, key, { status: 'sending', sent: 0, total: 0 });
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
    {
      key,
      roomId,
      contentType: 'text',
      text,
      urls: [],
      status: 'sending',
      sent: 0,
      total: 0,
    },
    { user, key, roomId, contentType: 'text', text },
  );
}

// photos or videos picked, or a voice message recorded, sent as one message. urls: the object urls for them, the
// bubble shows them
export async function sendMedia(
  user: string,
  roomId: string,
  contentType: MediaType,
  files: File[],
  urls: string[],
) {
  const key = crypto.randomUUID();
  await start(
    user,
    {
      key,
      roomId,
      contentType,
      text: '',
      urls,
      status: 'sending',
      sent: 0,
      total: 0,
    },
    { user, key, roomId, contentType, files },
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
// answered: an answered one is a message already
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

// logged out or the account deleted: none shown, their object urls let go. their records go with db/message's clearChats
export function forgetPending() {
  Object.values(pending).forEach((items) =>
    items.forEach((item) =>
      item.urls.forEach((url) => URL.revokeObjectURL(url)),
    ),
  );
  userId = null;
  pending = {};
  notify();
}

// whether a message chat relayed is this pending one whose answer never came (the page went away meanwhile), only
// when that's certain: photos and videos by their uploaded files, names chat made for this one alone and takes once.
// a text has nothing of chat's to know it by: it stays not sent until it's retried or deleted, even the rare one chat
// took though its answer was lost (it shows twice then). words alone would take a later same text, from anywhere, for
// it, and hide a message never sent
type Relayable = Pick<PendingRecord, 'contentType' | 'uploaded'>;

function isRelayOf(record: Relayable, message: MessagingResponse) {
  if (
    record.contentType === 'text' ||
    message.contentType !== record.contentType
  ) {
    return false;
  }
  return (
    record.uploaded?.some((name) => message.contents.includes(name)) ?? false
  );
}

export async function settlePending(
  user: string,
  messages: MessagingResponse[],
) {
  const mine = messages.filter(({ fromId }) => fromId === user);
  if (mine.length === 0) return;
  const relayed = (item: Relayable) =>
    mine.some((message) => isRelayOf(item, message));
  Object.values(pending)
    .flat()
    .filter(relayed)
    .forEach((item) => drop(item.roomId, item.key));
  let records: PendingRecord[];
  try {
    records = await getRecords(user);
  } catch {
    return;
  }
  for (const record of records.filter(relayed)) {
    await deleteRecord(user, record.key);
  }
}
