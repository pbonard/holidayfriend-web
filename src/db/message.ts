import type { ChatMessage, RoomSummary, StoredMessage } from '@/types/chat';

// the chats of this browser, in IndexedDB, as the mobile app keeps them in sqlite: my-server's chat hands each message
// out once (GET /chat/messaging/recent from a cursor, or the socket), so what was received is only here. per person
// logged in, every key starts with their id, so another account on the same browser starts with none of theirs.
//   messages  [user, id]        a message as chat sent it, with its room. index room [user, roomId, id]: a chat's,
//                                 oldest to newest
//   rooms     [user, roomId]    a chat's summary: its newest message, the other person's newest, and what was read
//   meta      [user, name]      the cursor, the newest message id received, where the next catching up starts
// in memory, for the screens (useSyncExternalStore in hooks/useChat): every chat's summary, for the list and the
// badge, and the open chats' latest messages, a page at a time. replaced, never changed in place, so react sees a
// change. other tabs write it too: a BroadcastChannel tells them which chats changed, and they read those again

export type Rooms = Readonly<Record<string, RoomSummary>>;
// a chat's latest messages in memory, oldest first, and whether older ones are kept too
export type RoomWindow = { messages: StoredMessage[]; hasEarlier: boolean };
export type Windows = Readonly<Record<string, RoomWindow>>;

type MessageRecord = StoredMessage & { user: string; roomId: string };
type RoomRecord = RoomSummary & { user: string; roomId: string };
type MetaRecord = { user: string; name: string; value: string };

const DB_NAME = 'holidayfriend-chat';
// 2: messages keyed by their id alone, an accepted invite's no longer kept under the invite's id. the stores start
// over: the cursor goes with them, so the next catching up brings the whole history again from chat
const DB_VERSION = 2;
// how many of a chat's latest messages are read at first, and how many more each "Show earlier messages" adds
const PAGE = 100;
// the cursor before anything was received: the smallest v7 id
const FIRST_CURSOR = '00000000-0000-7000-8000-000000000000';
// past any uuid in a key range
const HIGHEST = '￿';
const NO_WINDOWS: Windows = {};

let userId: string | null = null;
// null until the person's chats are read
let rooms: Rooms | null = null;
let loading: Promise<void> | null = null;
let windows: Windows = NO_WINDOWS;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

// --- IndexedDB, with promises ---

// the chats' database. each version's change, from the one the browser has on
export function openDB() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (event.oldVersion < 2) {
        for (const name of Array.from(db.objectStoreNames)) db.deleteObjectStore(name);
        const messages = db.createObjectStore('messages', { keyPath: ['user', 'id'] });
        messages.createIndex('room', ['user', 'roomId', 'id']);
        db.createObjectStore('rooms', { keyPath: ['user', 'roomId'] });
        db.createObjectStore('meta', { keyPath: ['user', 'name'] });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export function promised<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function stored({ id, fromId, contentType, contents }: MessageRecord): StoredMessage {
  return { id, fromId, contentType, contents };
}

// a chat's messages up to limit, newest first, older than before when it's given
function newest(
  index: IDBIndex,
  user: string,
  roomId: string,
  limit: number,
  before?: string,
) {
  const range = IDBKeyRange.bound(
    [user, roomId, ''],
    [user, roomId, before ?? HIGHEST],
    false,
    before !== undefined,
  );
  return new Promise<MessageRecord[]>((resolve, reject) => {
    const found: MessageRecord[] = [];
    const request = index.openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || found.length >= limit) {
        resolve(found);
        return;
      }
      found.push(cursor.value as MessageRecord);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

// a chat's messages from fromId on, oldest first
function since(index: IDBIndex, user: string, roomId: string, fromId: string) {
  const range = IDBKeyRange.bound([user, roomId, fromId], [user, roomId, HIGHEST]);
  return promised(index.getAll(range)) as Promise<MessageRecord[]>;
}

// a chat's summary from its messages, after some were removed. null when none are left
async function summarize(
  index: IDBIndex,
  user: string,
  roomId: string,
  readId: string,
): Promise<RoomRecord | null> {
  const [last] = await newest(index, user, roomId, 1);
  if (!last) return null;
  let lastFromOtherId = '';
  if (last.fromId !== user) {
    lastFromOtherId = last.id;
  } else {
    // the other person's newest: back from the newest, past one's own
    const range = IDBKeyRange.bound([user, roomId, ''], [user, roomId, HIGHEST]);
    lastFromOtherId = await new Promise<string>((resolve, reject) => {
      const request = index.openCursor(range, 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return resolve('');
        const record = cursor.value as MessageRecord;
        if (record.fromId !== user) return resolve(record.id);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  }
  return { user, roomId, last: stored(last), lastFromOtherId, readId };
}

// --- what's kept ---

// a message as it's kept: as chat sent it, without its room (the record has it)
function toStored({ id, fromId, contentType, contents }: ChatMessage): StoredMessage {
  return { id, fromId, contentType, contents };
}

// what a kept message says: a text's, or an accepted invite's ("accept", holidayfriend-server's, its own look)
export function textOf(message: StoredMessage) {
  return message.contents[0] ?? '';
}

// a kept message in a line, for the chat list
export function previewOf(message: StoredMessage) {
  return textOf(message);
}

const SHOWN = new Set(['text', 'accept']);

// keeps the messages received, each in its room, in one transaction. fromServer: from the socket or catching up, so
// the cursor moves past them. not for one's own just sent, which is put in at once from its answer: a message the
// other person sent a moment before it may not have arrived yet, and moving past it would skip it when catching up
export async function saveMessages(
  user: string,
  messages: ChatMessage[],
  { fromServer }: { fromServer: boolean },
) {
  if (messages.length === 0) return;
  const db = await openDB();
  const tx = db.transaction(['messages', 'rooms', 'meta'], 'readwrite');
  const messageStore = tx.objectStore('messages');
  const roomStore = tx.objectStore('rooms');
  const index = messageStore.index('room');
  const changed = new Set<string>();

  // oldest first, so a quit or delete meets what it removes
  for (const message of [...messages].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const { roomId } = message;
    const room = (await promised(roomStore.get([user, roomId]))) as RoomRecord | undefined;

    if (SHOWN.has(message.contentType)) {
      // once, whether it came on the socket, from catching up, or both
      if (await promised(messageStore.getKey([user, message.id]))) continue;
      const kept = toStored(message);
      messageStore.put({ ...kept, user, roomId } satisfies MessageRecord);
      // one's own message, from this tab or another, is read
      const readId =
        message.fromId === user && kept.id > (room?.readId ?? '')
          ? kept.id
          : (room?.readId ?? '');
      roomStore.put({
        user,
        roomId,
        last: !room || kept.id > room.last.id ? kept : room.last,
        lastFromOtherId:
          message.fromId !== user && kept.id > (room?.lastFromOtherId ?? '')
            ? kept.id
            : (room?.lastFromOtherId ?? ''),
        readId,
      } satisfies RoomRecord);
      changed.add(roomId);
      continue;
    }

    if (!room) continue;
    if (message.contentType === 'quit') {
      // left from another tab or device: what came before it goes, as on mobile. what's after is a new start
      const range = IDBKeyRange.bound([user, roomId, ''], [user, roomId, HIGHEST]);
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return resolve();
          if ((cursor.value as MessageRecord).id <= message.id) cursor.delete();
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    } else if (message.contentType === 'delete') {
      const key = [user, message.contents[0]];
      const deleted = (await promised(messageStore.get(key))) as MessageRecord | undefined;
      if (!deleted || deleted.roomId !== roomId) continue;
      messageStore.delete(key);
    } else {
      // block, unblock and files: the web app neither sends nor shows them
      continue;
    }
    const summary = await summarize(index, user, roomId, room.readId);
    if (summary) {
      roomStore.put(summary);
    } else {
      roomStore.delete([user, roomId]);
    }
    changed.add(roomId);
  }

  if (fromServer) {
    const metaStore = tx.objectStore('meta');
    const kept = (await promised(metaStore.get([user, 'cursor']))) as MetaRecord | undefined;
    const newestId = messages.reduce(
      (max, { id }) => (id > max ? id : max),
      kept?.value ?? FIRST_CURSOR,
    );
    metaStore.put({ user, name: 'cursor', value: newestId } satisfies MetaRecord);
  }
  await done(tx);
  await refresh(user, [...changed], true);
}

export async function getCursor(user: string) {
  const db = await openDB();
  const kept = (await promised(
    db.transaction('meta').objectStore('meta').get([user, 'cursor']),
  )) as MetaRecord | undefined;
  return kept?.value ?? FIRST_CURSOR;
}

// everything in the chat read, up to its newest message. shown at once, kept a moment later
export async function markRoomRead(user: string, roomId: string) {
  const summary = rooms?.[roomId];
  if (user !== userId || !summary || summary.readId >= summary.last.id) return;
  rooms = { ...rooms, [roomId]: { ...summary, readId: summary.last.id } };
  notify();

  const db = await openDB();
  const tx = db.transaction('rooms', 'readwrite');
  const roomStore = tx.objectStore('rooms');
  const room = (await promised(roomStore.get([user, roomId]))) as RoomRecord | undefined;
  if (room && room.readId < room.last.id) {
    roomStore.put({ ...room, readId: room.last.id });
  }
  await done(tx);
  broadcast(user, [roomId]);
}

// left: none of it kept
export async function removeRoom(user: string, roomId: string) {
  const db = await openDB();
  const tx = db.transaction(['messages', 'rooms'], 'readwrite');
  const range = IDBKeyRange.bound([user, roomId, ''], [user, roomId, HIGHEST]);
  await new Promise<void>((resolve, reject) => {
    const request = tx.objectStore('messages').index('room').openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve();
      cursor.delete();
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
  tx.objectStore('rooms').delete([user, roomId]);
  await done(tx);
  await refresh(user, [roomId], true);
}

// --- in memory, for the screens ---

function notify() {
  listeners.forEach((listener) => listener());
}

function broadcast(user: string, roomIds: string[]) {
  channel?.postMessage({ user, roomIds });
}

// the chats' summaries and open windows read again after they changed, here or in another tab
async function refresh(user: string, roomIds: string[], tellOthers: boolean) {
  if (roomIds.length === 0) return;
  if (tellOthers) broadcast(user, roomIds);
  if (user !== userId) return;
  await loading;
  const db = await openDB();
  const tx = db.transaction(['messages', 'rooms']);
  const roomStore = tx.objectStore('rooms');
  const index = tx.objectStore('messages').index('room');
  const nextRooms = { ...rooms };
  const nextWindows = { ...windows };
  await Promise.all(
    roomIds.map(async (roomId) => {
      const room = (await promised(roomStore.get([user, roomId]))) as RoomRecord | undefined;
      if (room) {
        nextRooms[roomId] = {
          last: room.last,
          lastFromOtherId: room.lastFromOtherId,
          readId: room.readId,
        };
      } else {
        delete nextRooms[roomId];
      }
      const window = windows[roomId];
      const first = window?.messages[0]?.id;
      if (first) {
        // everything from the earliest shown on: what was shown stays, new ones come after it
        const [found, older] = await Promise.all([
          since(index, user, roomId, first),
          newest(index, user, roomId, 1, first),
        ]);
        nextWindows[roomId] = { messages: found.map(stored), hasEarlier: older.length > 0 };
      } else if (window) {
        // none shown yet (a chat that was empty): its latest page
        const found = await newest(index, user, roomId, PAGE + 1);
        nextWindows[roomId] = {
          messages: found.slice(0, PAGE).reverse().map(stored),
          hasEarlier: found.length > PAGE,
        };
      }
    }),
  );
  if (user !== userId) return;
  rooms = nextRooms;
  windows = nextWindows;
  notify();
}

// chats kept in localStorage before IndexedDB: into it, once, then out of localStorage
type OldMessage = StoredMessage | { id: string; fromId: string; text: string };
async function moveFromLocalStorage(user: string) {
  const prefix = `chat:${user}:`;
  let keys: string[];
  try {
    keys = Object.keys(localStorage).filter((key) => key.startsWith(prefix));
  } catch {
    return;
  }
  if (keys.length === 0) return;
  const db = await openDB();
  const tx = db.transaction(['messages', 'rooms', 'meta'], 'readwrite');
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    if (key === `${prefix}cursor`) {
      tx.objectStore('meta').put({ user, name: 'cursor', value: raw } satisfies MetaRecord);
      continue;
    }
    if (!key.startsWith(`${prefix}room:`)) continue;
    const roomId = key.slice(`${prefix}room:`.length);
    let room: { messages: OldMessage[]; readId: string };
    try {
      room = JSON.parse(raw);
    } catch {
      continue;
    }
    // kept before messages had their content type: a text message
    const messages: StoredMessage[] = room.messages.map((message) =>
      'contentType' in message
        ? message
        : { id: message.id, fromId: message.fromId, contentType: 'text', contents: [message.text] },
    );
    const last = messages.at(-1);
    if (!last) continue;
    messages.forEach((message) =>
      tx.objectStore('messages').put({ ...message, user, roomId } satisfies MessageRecord),
    );
    tx.objectStore('rooms').put({
      user,
      roomId,
      last,
      lastFromOtherId: messages.findLast(({ fromId }) => fromId !== user)?.id ?? '',
      readId: room.readId,
    } satisfies RoomRecord);
  }
  await done(tx);
  keys.forEach((key) => localStorage.removeItem(key));
}

// the person's chats' summaries, read once per person
function load(user: string) {
  if (userId === user) return;
  userId = user;
  rooms = null;
  windows = NO_WINDOWS;
  loading = (async () => {
    try {
      await moveFromLocalStorage(user);
      const db = await openDB();
      const range = IDBKeyRange.bound([user, ''], [user, HIGHEST]);
      const records = (await promised(
        db.transaction('rooms').objectStore('rooms').getAll(range),
      )) as RoomRecord[];
      if (userId !== user) return;
      rooms = Object.fromEntries(
        records.map(({ roomId, last, lastFromOtherId, readId }) => [
          roomId,
          { last, lastFromOtherId, readId },
        ]),
      );
    } catch {
      // IndexedDB unavailable: no chats kept, as if there were none
      if (userId === user) rooms = {};
    }
    notify();
  })();
}

function onBroadcast(event: MessageEvent<{ user: string; roomIds: string[] }>) {
  void refresh(event.data.user, event.data.roomIds, false);
}

export function subscribeChats(listener: () => void) {
  if (listeners.size === 0 && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(DB_NAME);
    channel.onmessage = onBroadcast;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      channel?.close();
      channel = null;
    }
  };
}

// every chat's summary, null until they're read
export function getRooms(user: string): Rooms | null {
  load(user);
  return rooms;
}

// none while prerendering: IndexedDB is the browser's
export function getServerRooms(): Rooms | null {
  return null;
}

export function getWindows(): Windows {
  return windows;
}

export function getServerWindows(): Windows {
  return NO_WINDOWS;
}

// a chat opened: its latest PAGE messages into memory, once
export async function openRoom(user: string, roomId: string) {
  load(user);
  if (windows[roomId]) return;
  const db = await openDB();
  const index = db.transaction('messages').objectStore('messages').index('room');
  const found = await newest(index, user, roomId, PAGE + 1);
  if (user !== userId || windows[roomId]) return;
  windows = {
    ...windows,
    [roomId]: { messages: found.slice(0, PAGE).reverse().map(stored), hasEarlier: found.length > PAGE },
  };
  notify();
}

// the PAGE before the earliest shown, added in front
export async function loadEarlier(user: string, roomId: string) {
  const window = windows[roomId];
  const earliest = window?.messages[0];
  if (!window || !earliest || !window.hasEarlier) return;
  const db = await openDB();
  const index = db.transaction('messages').objectStore('messages').index('room');
  const found = await newest(index, user, roomId, PAGE + 1, earliest.id);
  const current = windows[roomId];
  if (user !== userId || !current || current.messages[0]?.id !== earliest.id) return;
  windows = {
    ...windows,
    [roomId]: {
      messages: [...found.slice(0, PAGE).reverse().map(stored), ...current.messages],
      hasEarlier: found.length > PAGE,
    },
  };
  notify();
}

// this tab's id for my-server's chat, which keeps one socket per person and device: a tab of its own, so two tabs
// don't take each other's place. sessionStorage is the tab's, and stays through a reload
export function getDeviceId() {
  const KEY = 'chatDeviceId';
  try {
    const kept = sessionStorage.getItem(KEY);
    if (kept) return kept;
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
