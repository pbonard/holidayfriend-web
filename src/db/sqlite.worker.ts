import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
import * as SQLite from 'wa-sqlite';
import { MemoryVFS } from 'wa-sqlite/src/examples/MemoryVFS.js';
import { OPFSCoopSyncVFS } from 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js';

export type SqlValue = string | number | bigint | Uint8Array | null;
export type SqliteRequest = { id: number; sql: string; bind?: SqlValue[] };
export type SqliteResponse =
  | { id: number; rows: Record<string, unknown>[] }
  | { id: number; error: string };

const FILENAME = 'holidayfriend-chat.sqlite3';
const WASM_URL = '/wa-sqlite/wa-sqlite.wasm';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS gap (
    user TEXT NOT NULL,
    room_id TEXT NOT NULL,
    cursor TEXT NOT NULL,
    PRIMARY KEY (user, room_id, cursor)
  ) WITHOUT ROWID;
  CREATE TABLE IF NOT EXISTS message (
    user TEXT NOT NULL,
    id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    from_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    contents TEXT NOT NULL,
    PRIMARY KEY (user, id)
  ) WITHOUT ROWID;
  CREATE INDEX IF NOT EXISTS message_by_room ON message (user, room_id, id);
  CREATE TABLE IF NOT EXISTS room (
    user TEXT NOT NULL,
    room_id TEXT NOT NULL,
    read_id TEXT NOT NULL,
    PRIMARY KEY (user, room_id)
  ) WITHOUT ROWID;
  CREATE TABLE IF NOT EXISTS meta (
    user TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user, name)
  ) WITHOUT ROWID;
  CREATE TABLE IF NOT EXISTS pending (
    user TEXT NOT NULL,
    key TEXT NOT NULL,
    room_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    text TEXT,
    uploaded TEXT,
    PRIMARY KEY (user, key)
  ) WITHOUT ROWID;
  CREATE TABLE IF NOT EXISTS pending_file (
    user TEXT NOT NULL,
    key TEXT NOT NULL,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    last_modified INTEGER NOT NULL,
    data BLOB NOT NULL,
    PRIMARY KEY (user, key, position)
  ) WITHOUT ROWID;
`;

async function open() {
  const wasm = await SQLiteESMFactory({ locateFile: () => WASM_URL });
  const sqlite3 = SQLite.Factory(wasm);
  try {
    sqlite3.vfs_register(await OPFSCoopSyncVFS.create('opfs', wasm), true);
  } catch (error) {
    console.warn('chat database: OPFS unavailable, kept in memory', error);
    sqlite3.vfs_register(await MemoryVFS.create('memory', wasm), true);
  }
  const db = await sqlite3.open_v2(FILENAME);
  await sqlite3.exec(db, SCHEMA);
  return { sqlite3, db };
}

const opening = open();

async function run(sql: string, bind?: SqlValue[]) {
  const { sqlite3, db } = await opening;
  const rows: Record<string, unknown>[] = [];
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (bind !== undefined) sqlite3.bind_collection(stmt, bind);
    const columns = sqlite3.column_names(stmt);
    while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
      const values = sqlite3.row(stmt);
      rows.push(
        Object.fromEntries(
          columns.map((column, index) => {
            const value = values[index];
            return [column, value instanceof Uint8Array ? value.slice() : value];
          }),
        ),
      );
    }
  }
  return rows;
}

self.onmessage = async ({ data }: MessageEvent<SqliteRequest>) => {
  const { id, sql, bind } = data;
  let response: SqliteResponse;
  try {
    response = { id, rows: await run(sql, bind) };
  } catch (error) {
    response = { id, error: String(error) };
  }
  self.postMessage(response);
};
