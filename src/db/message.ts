import { getRoomHistory } from "@/api/chat";
import { query, transaction, type Sql } from "@/db/sqlite";
import type { MessagingResponse, RoomSummary } from "@/types/chat";

export type Rooms = Readonly<Record<string, RoomSummary>>;
export type ChatRoomMessages = {
  messages: MessagingResponse[];
  hasEarlier: boolean;
};
export type ChatRoomMessagesMap = Readonly<Record<string, ChatRoomMessages>>;

type MessageRow = {
  id: string;
  room_id: string;
  from_id: string;
  content_type: string;
  contents: string;
};
type SummaryRow = MessageRow & { last_from_other_id: string; read_id: string };

const CHANNEL_NAME = "holidayfriend-chat";
const PAGE = 30;
const NO_CHAT_ROOM_MESSAGES: ChatRoomMessagesMap = {};

let userId: string | null = null;
// null until the person's chats are read
let rooms: Rooms | null = null;
let loading: Promise<void> | null = null;
let chatRoomMessagesMap: ChatRoomMessagesMap = NO_CHAT_ROOM_MESSAGES;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
const historyDone = new Set<string>();

function toMessage(row: MessageRow): MessagingResponse {
  return {
    id: row.id,
    roomId: row.room_id,
    fromId: row.from_id,
    contentType: row.content_type,
    contents: JSON.parse(row.contents) as string[],
  };
}

const MESSAGE_COLUMNS = "id, room_id, from_id, content_type, contents";

async function readMessagePage(
  user: string,
  roomId: string,
  limit: number,
  before?: string,
) {
  const rows = await query<MessageRow>(
    `SELECT ${MESSAGE_COLUMNS} FROM message
     WHERE user = ? AND room_id = ?${before === undefined ? "" : " AND id < ?"}
     ORDER BY id DESC LIMIT ?`,
    [user, roomId, ...(before === undefined ? [] : [before]), limit],
  );
  return rows.map(toMessage);
}

async function readSummaries(user: string, roomIds?: string[]) {
  const only =
    roomIds === undefined
      ? ""
      : ` AND room_id IN (${roomIds.map(() => "?").join(", ")})`;
  const rows = await query<SummaryRow>(
    `SELECT m.id, m.room_id, m.from_id, m.content_type, m.contents,
       COALESCE((SELECT MAX(o.id) FROM message o
                 WHERE o.user = m.user AND o.room_id = m.room_id AND o.from_id != m.user), '') AS last_from_other_id,
       COALESCE(r.read_id, '') AS read_id
     FROM message m
     JOIN (SELECT room_id, MAX(id) AS id FROM message WHERE user = ?${only} GROUP BY room_id) newest
       ON newest.room_id = m.room_id AND newest.id = m.id
     LEFT JOIN room r ON r.user = m.user AND r.room_id = m.room_id
     WHERE m.user = ?`,
    [user, ...(roomIds ?? []), user],
  );
  return Object.fromEntries(
    rows.map((row) => [
      row.room_id,
      {
        last: toMessage(row),
        lastFromOtherId: row.last_from_other_id,
        readId: row.read_id,
      } satisfies RoomSummary,
    ]),
  );
}

function markRead(sql: Sql, user: string, roomId: string, id: string) {
  return sql(
    `INSERT INTO room (user, room_id, read_id) VALUES (?, ?, ?)
     ON CONFLICT (user, room_id) DO UPDATE SET read_id = MAX(read_id, excluded.read_id)`,
    [user, roomId, id],
  );
}

// --- what's kept ---

// one's own blocking or unblocking: a pill in the chat, not a message to select or delete, as on mobile
export function isBlockEvent(message: MessagingResponse) {
  return message.contentType === "block" || message.contentType === "unblock";
}

// a kept message in a line, for the chat list: its text (a text's, or an accepted invite's), or what files it has
export function previewOf(message: MessagingResponse) {
  // one kept before saving made it a list may have none
  const contents = message.contents ?? [];
  const count = contents.length;
  switch (message.contentType) {
    case "image":
      return count > 1 ? `${count} photos` : "Photo";
    case "video":
      return count > 1 ? `${count} videos` : "Video";
    case "audio":
      return "Voice message";
    case "block":
      return "Blocked";
    case "unblock":
      return "Unblocked";
    default:
      return contents[0] ?? "";
  }
}

// shown in the chat: messages, and one's own blocking and unblocking as a pill (chat hands those to their sender alone)
const SHOWN = new Set([
  "text",
  "accept",
  "image",
  "video",
  "audio",
  "block",
  "unblock",
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

export async function putMessages(
  user: string,
  messages: MessagingResponse[],
  { moveCursor, read = false }: { moveCursor: boolean; read?: boolean },
) {
  if (messages.length === 0) return;
  const changed = new Set<string>();
  await transaction(async (sql) => {
    for (const { roomId } of messages.filter(
      ({ contentType }) => contentType === "reset",
    )) {
      await sql(`DELETE FROM message WHERE user = ? AND room_id = ?`, [
        user,
        roomId,
      ]);
      historyDone.delete(roomId);
      changed.add(roomId);
    }
    // oldest first, so a quit or delete meets what it removes
    for (const received of messages
      .filter(({ contentType }) => contentType !== "reset")
      .sort((a, b) => (a.id < b.id ? -1 : 1))) {
      // chat sends none as null (an empty list in its storage comes back as nothing), a block's or a quit's
      const message = { ...received, contents: received.contents ?? [] };
      const { roomId } = message;
      if (SHOWN.has(message.contentType)) {
        // once, whether it came on the socket, from catching up, or both
        await sql(
          `INSERT OR IGNORE INTO message (user, id, room_id, from_id, content_type, contents)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user,
            message.id,
            roomId,
            message.fromId,
            message.contentType,
            JSON.stringify(message.contents),
          ],
        );
        // one's own message, from this tab or another, is read
        if (message.fromId === user || read) {
          await markRead(sql, user, roomId, message.id);
        }
        changed.add(roomId);
      } else if (message.contentType === "quit") {
        // left from another tab or device: what came before it goes, as on mobile. what's after is a new start
        await sql(
          `DELETE FROM message WHERE user = ? AND room_id = ? AND id <= ?`,
          [user, roomId, message.id],
        );
        changed.add(roomId);
      } else if (message.contentType === "delete") {
        await sql(
          `DELETE FROM message WHERE user = ? AND room_id = ? AND id = ?`,
          [user, roomId, message.contents[0] ?? ""],
        );
        changed.add(roomId);
      }
      // the rest (a group's create and participate): the web app has no groups
    }
    if (moveCursor) {
      const newestId = messages.reduce(
        (max, { id }) => (id > max ? id : max),
        "",
      );
      if (newestId)
        await sql(
          `INSERT INTO meta (user, name, value) VALUES (?, 'cursor', ?)
         ON CONFLICT (user, name) DO UPDATE SET value = MAX(value, excluded.value)`,
          [user, newestId],
        );
    }
  });
  await refresh(user, [...changed], true);
}

export async function getCursor(user: string): Promise<string | null> {
  const [kept] = await query<{ value: string }>(
    `SELECT value FROM meta WHERE user = ? AND name = 'cursor'`,
    [user],
  );
  return kept?.value ?? null;
}

// everything in the chat read, up to its newest message. shown at once, kept a moment later
export async function markRoomRead(user: string, roomId: string) {
  const summary = rooms?.[roomId];
  if (user !== userId || !summary || summary.readId >= summary.last.id) return;
  const lastId = summary.last.id;
  rooms = { ...rooms, [roomId]: { ...summary, readId: lastId } };
  notify();
  await transaction((sql) => markRead(sql, user, roomId, lastId));
  broadcast(user, [roomId]);
}

// left: none of it kept
export async function removeRoom(user: string, roomId: string) {
  await transaction(async (sql) => {
    await sql(`DELETE FROM message WHERE user = ? AND room_id = ?`, [
      user,
      roomId,
    ]);
    await sql(`DELETE FROM room WHERE user = ? AND room_id = ?`, [
      user,
      roomId,
    ]);
  });
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
  const summaries = await readSummaries(user, roomIds);
  const nextChatRoomMessagesMap = { ...chatRoomMessagesMap };
  await Promise.all(
    roomIds.map(async (roomId) => {
      const chatRoomMessages = chatRoomMessagesMap[roomId];
      const firstMessageId = chatRoomMessages?.messages[0]?.id;
      if (firstMessageId) {
        // everything from the earliest shown on: what was shown stays, new ones come after it
        const [found, older] = await Promise.all([
          query<MessageRow>(
            `SELECT ${MESSAGE_COLUMNS} FROM message
             WHERE user = ? AND room_id = ? AND id >= ? ORDER BY id ASC`,
            [user, roomId, firstMessageId],
          ),
          readMessagePage(user, roomId, 1, firstMessageId),
        ]);
        nextChatRoomMessagesMap[roomId] = {
          messages: found.map(toMessage),
          hasEarlier: older.length > 0 || !historyDone.has(roomId),
        };
      } else if (chatRoomMessages) {
        // none shown yet (a chat that was empty): its latest page
        const found = await readMessagePage(user, roomId, PAGE + 1);
        nextChatRoomMessagesMap[roomId] = {
          messages: found.slice(0, PAGE).reverse(),
          hasEarlier: found.length > PAGE || !historyDone.has(roomId),
        };
      }
    }),
  );
  if (user !== userId) return;
  const nextRooms: Record<string, RoomSummary> = { ...rooms };
  for (const roomId of roomIds) {
    const summary = summaries[roomId];
    if (summary) nextRooms[roomId] = summary;
    else delete nextRooms[roomId];
  }
  rooms = nextRooms;
  chatRoomMessagesMap = nextChatRoomMessagesMap;
  notify();
}

export function subscribeChats(listener: () => void) {
  if (listeners.size === 0 && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
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

let oldDeleted = false;
function deleteOldDatabase() {
  if (oldDeleted || typeof indexedDB === "undefined") return;
  oldDeleted = true;
  try {
    indexedDB.deleteDatabase(CHANNEL_NAME);
  } catch {}
}

// every chat's summary, null until they're read: read once per person, the first time they're asked for
export function getRooms(user: string): Rooms | null {
  if (userId === user) return rooms;
  userId = user;
  rooms = null;
  chatRoomMessagesMap = NO_CHAT_ROOM_MESSAGES;
  historyDone.clear();
  deleteOldDatabase();
  loading = (async () => {
    try {
      const summaries = await readSummaries(user);
      if (userId !== user) return;
      rooms = summaries;
    } catch {
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

async function readPage(
  user: string,
  roomId: string,
  before?: string,
): Promise<ChatRoomMessages> {
  const read = () => readMessagePage(user, roomId, PAGE + 1, before);
  let found = await read();
  if (
    found.length <= PAGE &&
    !historyDone.has(roomId) &&
    (before !== undefined || found.length === 0)
  ) {
    let fetched: MessagingResponse[] | null = null;
    try {
      fetched = await getRoomHistory({
        roomId,
        cursor: found.at(-1)?.id ?? before,
      });
    } catch (error) {
      if (found.length === 0) throw error;
    }
    if (user !== userId) return { messages: [], hasEarlier: false };
    if (fetched && fetched.length > 0) {
      await putMessages(user, fetched, { moveCursor: false });
      found = await read();
    } else if (fetched) {
      historyDone.add(roomId);
    }
  }
  return {
    messages: found.slice(0, PAGE).reverse(),
    hasEarlier: found.length > PAGE || !historyDone.has(roomId),
  };
}

export async function openRoom(user: string, roomId: string) {
  // the person's chats read, if they aren't yet
  getRooms(user);
  if (chatRoomMessagesMap[roomId]) return;
  let page: ChatRoomMessages;
  try {
    page = await readPage(user, roomId);
  } catch {
    page = { messages: [], hasEarlier: true };
  }
  if (user !== userId || chatRoomMessagesMap[roomId]) return;
  chatRoomMessagesMap = { ...chatRoomMessagesMap, [roomId]: page };
  notify();
}

// the PAGE before the earliest shown, added in front
export async function loadEarlier(user: string, roomId: string) {
  const chatRoomMessages = chatRoomMessagesMap[roomId];
  const earliest = chatRoomMessages?.messages[0];
  if (!chatRoomMessages || !earliest || !chatRoomMessages.hasEarlier) return;
  const page = await readPage(user, roomId, earliest.id);
  const current = chatRoomMessagesMap[roomId];
  if (user !== userId || !current || current.messages[0]?.id !== earliest.id)
    return;
  chatRoomMessagesMap = {
    ...chatRoomMessagesMap,
    [roomId]: {
      messages: [...page.messages, ...current.messages],
      hasEarlier: page.hasEarlier,
    },
  };
  notify();
}

export async function clearChats() {
  userId = null;
  rooms = null;
  loading = null;
  chatRoomMessagesMap = NO_CHAT_ROOM_MESSAGES;
  historyDone.clear();
  notify();
  try {
    await transaction(async (sql) => {
      for (const table of [
        "message",
        "room",
        "meta",
        "pending",
        "pending_file",
      ]) {
        await sql(`DELETE FROM ${table}`);
      }
    });
  } catch {}
}

// this tab's id for my-server's chat, which keeps one socket per person and device: a tab of its own, so two tabs
// don't take each other's place. sessionStorage is the tab's, and stays through a reload
export function getDeviceId() {
  const KEY = "chatDeviceId";
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
