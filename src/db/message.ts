import type { MessagingResponse, RoomSummary } from '@/types/chat';

// the chats of this browser, in IndexedDB, as the mobile app keeps them in sqlite: my-server's chat hands each message
// out once (GET /chat/messaging/recent from a cursor, or the socket), so what was received is only here. per person
// logged in, every key starts with their id, so another account on the same browser starts with none of theirs.
//   messages  [user, id]        a message as chat sent it, with its room. index room [user, roomId, id]: a chat's,
//                                 oldest to newest
//   rooms     [user, roomId]    a chat's summary: its newest message, the other person's newest, and what was read
//   meta      [user, name]      the cursor, the newest message id received, where the next catching up starts
//   pending   [user, key]       one's own messages not sent yet (db/pending)
// in memory, for the screens (useSyncExternalStore in hooks/useChat): every chat's summary, for the list and the
// badge, and the open chats' latest messages, a page at a time. replaced, never changed in place, so react sees a
// change. other tabs write it too: a BroadcastChannel tells them which chats changed, and they read those again

export type Rooms = Readonly<Record<string, RoomSummary>>;
// a chat's latest messages in memory, oldest first, and whether older ones are kept too
export type ChatRoomMessages = {
  messages: MessagingResponse[];
  hasEarlier: boolean;
};
export type ChatRoomMessagesMap = Readonly<Record<string, ChatRoomMessages>>;

type MessageEntity = MessagingResponse & { user: string };
type RoomRecord = RoomSummary & { user: string; roomId: string };
type MetaRecord = { user: string; name: string; value: string };

const DB_NAME = 'holidayfriend-chat';
const DB_VERSION = 1;
// how many of a chat's latest messages are read at first, and how many more each "Show earlier messages" adds
const PAGE = 100;
// the cursor before anything was received: the smallest v7 id
const FIRST_CURSOR = '00000000-0000-7000-8000-000000000000';
// past any uuid in a key range
const HIGHEST = '￿';
const NO_CHAT_ROOM_MESSAGES: ChatRoomMessagesMap = {};

let userId: string | null = null;
// null until the person's chats are read
let rooms: Rooms | null = null;
let loading: Promise<void> | null = null;
let chatRoomMessagesMap: ChatRoomMessagesMap = NO_CHAT_ROOM_MESSAGES;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

// --- IndexedDB, with promises ---

// the chats' database, db/pending's store too
export function openDB() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const messages = db.createObjectStore('messages', {
        keyPath: ['user', 'id'],
      });
      messages.createIndex('room', ['user', 'roomId', 'id']);
      db.createObjectStore('rooms', { keyPath: ['user', 'roomId'] });
      db.createObjectStore('meta', { keyPath: ['user', 'name'] });
      db.createObjectStore('pending', { keyPath: ['user', 'key'] });
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

// a chat's messages up to limit, newest first, older than before when it's given
function getRecentMessagePage(
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
  return new Promise<MessageEntity[]>((resolve, reject) => {
    const found: MessageEntity[] = [];
    const request = index.openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || found.length >= limit) {
        resolve(found);
        return;
      }
      found.push(cursor.value as MessageEntity);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

// a chat's summary from its messages, after some were removed. null when none are left
async function sumarizeMessage(
  index: IDBIndex,
  user: string,
  roomId: string,
  readId: string,
): Promise<RoomRecord | null> {
  const [lastMessage] = await getRecentMessagePage(index, user, roomId, 1);
  if (!lastMessage) return null;
  let lastFromOtherId = '';
  if (lastMessage.fromId !== user) {
    lastFromOtherId = lastMessage.id;
  } else {
    // the other person's newest: back from the newest, past one's own
    const range = IDBKeyRange.bound(
      [user, roomId, ''],
      [user, roomId, HIGHEST],
    );
    lastFromOtherId = await new Promise<string>((resolve, reject) => {
      const request = index.openCursor(range, 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return resolve('');
        const record = cursor.value as MessageEntity;
        if (record.fromId !== user) return resolve(record.id);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  }
  return {
    user,
    roomId,
    last: lastMessage,
    lastFromOtherId,
    readId,
  };
}

// --- what's kept ---

// one's own blocking or unblocking: a pill in the chat, not a message to select or delete, as on mobile
export function isBlockEvent(message: MessagingResponse) {
  return message.contentType === 'block' || message.contentType === 'unblock';
}

// a kept message in a line, for the chat list: its text (a text's, or an accepted invite's), or what files it has
export function previewOf(message: MessagingResponse) {
  // one kept before saving made it a list may have none
  const contents = message.contents ?? [];
  const count = contents.length;
  switch (message.contentType) {
    case 'image':
      return count > 1 ? `${count} photos` : 'Photo';
    case 'video':
      return count > 1 ? `${count} videos` : 'Video';
    case 'audio':
      return 'Voice message';
    case 'block':
      return 'Blocked';
    case 'unblock':
      return 'Unblocked';
    default:
      return contents[0] ?? '';
  }
}

// shown in the chat: messages, and one's own blocking and unblocking as a pill (chat hands those to their sender alone)
const SHOWN = new Set([
  'text',
  'accept',
  'image',
  'video',
  'audio',
  'block',
  'unblock',
]);

// one's own message, kept as soon as chat answers with its id (db/pending), before it's relayed back. the cursor
// stays: a message the other person sent a moment before it may not have arrived yet, and moving past it would skip
// it when catching up. the relay comes later, and it's kept once
export async function saveSentMessage(
  user: string,
  message: MessagingResponse,
) {
  await putMessages(user, [message], { moveCursor: false });
}

// messages kept, each in its room, in one transaction. moveCursor: chat relayed them (on the socket, or catching
// up), so the cursor moves past them: they come in chat's order, nothing before them is still to come. not for
// one's own just answered (saveSentMessage)
export async function putMessages(
  user: string,
  messages: MessagingResponse[],
  { moveCursor }: { moveCursor: boolean },
) {
  if (messages.length === 0) return;
  const db = await openDB();
  const tx = db.transaction(['messages', 'rooms', 'meta'], 'readwrite');
  const messageStore = tx.objectStore('messages');
  const roomStore = tx.objectStore('rooms');
  const index = messageStore.index('room');
  const changed = new Set<string>();

  // oldest first, so a quit or delete meets what it removes
  for (const received of [...messages].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    // chat sends none as null (an empty list in its storage comes back as nothing), a block's or a quit's
    const message = { ...received, contents: received.contents ?? [] };
    const { roomId } = message;
    const room = (await promised(roomStore.get([user, roomId]))) as
      | RoomRecord
      | undefined;

    if (SHOWN.has(message.contentType)) {
      // once, whether it came on the socket, from catching up, or both
      if (await promised(messageStore.getKey([user, message.id]))) continue;
      messageStore.put({ ...message, user } satisfies MessageEntity);
      // one's own message, from this tab or another, is read
      const readId =
        message.fromId === user && message.id > (room?.readId ?? '')
          ? message.id
          : (room?.readId ?? '');
      roomStore.put({
        user,
        roomId,
        last: !room || message.id > room.last.id ? message : room.last,
        lastFromOtherId:
          message.fromId !== user && message.id > (room?.lastFromOtherId ?? '')
            ? message.id
            : (room?.lastFromOtherId ?? ''),
        readId,
      } satisfies RoomRecord);
      changed.add(roomId);
      continue;
    }

    if (!room) continue;
    if (message.contentType === 'quit') {
      // left from another tab or device: what came before it goes, as on mobile. what's after is a new start
      const range = IDBKeyRange.bound(
        [user, roomId, ''],
        [user, roomId, HIGHEST],
      );
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return resolve();
          if ((cursor.value as MessageEntity).id <= message.id) cursor.delete();
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    } else if (message.contentType === 'delete') {
      const key = [user, message.contents[0]];
      const deleted = (await promised(messageStore.get(key))) as
        | MessageEntity
        | undefined;
      if (!deleted || deleted.roomId !== roomId) continue;
      messageStore.delete(key);
    } else {
      // the rest (a group's create and participate): the web app has no groups
      continue;
    }
    const summary = await sumarizeMessage(index, user, roomId, room.readId);
    if (summary) {
      roomStore.put(summary);
    } else {
      roomStore.delete([user, roomId]);
    }
    changed.add(roomId);
  }

  if (moveCursor) {
    const metaStore = tx.objectStore('meta');
    const kept = (await promised(metaStore.get([user, 'cursor']))) as
      | MetaRecord
      | undefined;
    const newestId = messages.reduce(
      (max, { id }) => (id > max ? id : max),
      kept?.value ?? FIRST_CURSOR,
    );
    metaStore.put({
      user,
      name: 'cursor',
      value: newestId,
    } satisfies MetaRecord);
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
  const room = (await promised(roomStore.get([user, roomId]))) as
    | RoomRecord
    | undefined;
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

// the chats' summaries and open chats' messages read again after they changed, here or in another tab
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
  const nextChatRoomMessagesMap = { ...chatRoomMessagesMap };
  await Promise.all(
    roomIds.map(async (roomId) => {
      const room = (await promised(roomStore.get([user, roomId]))) as
        | RoomRecord
        | undefined;
      if (room) {
        nextRooms[roomId] = {
          last: room.last,
          lastFromOtherId: room.lastFromOtherId,
          readId: room.readId,
        };
      } else {
        delete nextRooms[roomId];
      }
      const chatRoomMessages = chatRoomMessagesMap[roomId];
      const firstMessageId = chatRoomMessages?.messages[0]?.id;
      if (firstMessageId) {
        // everything from the earliest shown on: what was shown stays, new ones come after it
        const [found, older] = await Promise.all([
          promised(
            index.getAll(
              IDBKeyRange.bound(
                [user, roomId, firstMessageId],
                [user, roomId, HIGHEST],
              ),
            ),
          ) as Promise<MessageEntity[]>,
          getRecentMessagePage(index, user, roomId, 1, firstMessageId),
        ]);
        nextChatRoomMessagesMap[roomId] = {
          messages: found,
          hasEarlier: older.length > 0,
        };
      } else if (chatRoomMessages) {
        // none shown yet (a chat that was empty): its latest page
        const found = await getRecentMessagePage(index, user, roomId, PAGE + 1);
        nextChatRoomMessagesMap[roomId] = {
          messages: found.slice(0, PAGE).reverse(),
          hasEarlier: found.length > PAGE,
        };
      }
    }),
  );
  if (user !== userId) return;
  rooms = nextRooms;
  chatRoomMessagesMap = nextChatRoomMessagesMap;
  notify();
}

export function subscribeChats(listener: () => void) {
  if (listeners.size === 0 && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(DB_NAME);
    // another tab changed these chats: read again here, not told back
    channel.onmessage = (
      event: MessageEvent<{ user: string; roomIds: string[] }>,
    ) => {
      void refresh(event.data.user, event.data.roomIds, false);
    };
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

// every chat's summary, null until they're read: read once per person, the first time they're asked for
export function getRooms(user: string): Rooms | null {
  if (userId === user) return rooms;
  userId = user;
  rooms = null;
  chatRoomMessagesMap = NO_CHAT_ROOM_MESSAGES;
  loading = (async () => {
    try {
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
  return rooms;
}

export function getChatRoomMessagesMap(): ChatRoomMessagesMap {
  return chatRoomMessagesMap;
}

export function getServerChatRoomMessagesMap(): ChatRoomMessagesMap {
  return NO_CHAT_ROOM_MESSAGES;
}

// a chat opened: its latest PAGE messages into memory, once
export async function openRoom(user: string, roomId: string) {
  // the person's chats read, if they aren't yet
  getRooms(user);
  if (chatRoomMessagesMap[roomId]) return;
  const db = await openDB();
  const index = db
    .transaction('messages')
    .objectStore('messages')
    .index('room');
  const found = await getRecentMessagePage(index, user, roomId, PAGE + 1);
  if (user !== userId || chatRoomMessagesMap[roomId]) return;
  chatRoomMessagesMap = {
    ...chatRoomMessagesMap,
    [roomId]: {
      messages: found.slice(0, PAGE).reverse(),
      hasEarlier: found.length > PAGE,
    },
  };
  notify();
}

// the PAGE before the earliest shown, added in front
export async function loadEarlier(user: string, roomId: string) {
  const chatRoomMessages = chatRoomMessagesMap[roomId];
  const earliest = chatRoomMessages?.messages[0];
  if (!chatRoomMessages || !earliest || !chatRoomMessages.hasEarlier) return;
  const db = await openDB();
  const index = db
    .transaction('messages')
    .objectStore('messages')
    .index('room');
  const found = await getRecentMessagePage(
    index,
    user,
    roomId,
    PAGE + 1,
    earliest.id,
  );
  const current = chatRoomMessagesMap[roomId];
  if (user !== userId || !current || current.messages[0]?.id !== earliest.id)
    return;
  chatRoomMessagesMap = {
    ...chatRoomMessagesMap,
    [roomId]: {
      messages: [...found.slice(0, PAGE).reverse(), ...current.messages],
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
