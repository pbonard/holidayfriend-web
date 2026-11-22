import type {
  SqliteRequest,
  SqliteResponse,
  SqlValue,
} from '@/db/sqlite.worker';

type Row = Record<string, unknown>;

export type Sql = <T extends Row = Row>(
  sql: string,
  bind?: SqlValue[],
) => Promise<T[]>;

let worker: Worker | null = null;
let nextId = 0;
const waiting = new Map<
  number,
  { resolve: (rows: Row[]) => void; reject: (error: Error) => void }
>();
let queue: Promise<unknown> = Promise.resolve();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = ({ data }: MessageEvent<SqliteResponse>) => {
    const call = waiting.get(data.id);
    if (!call) return;
    waiting.delete(data.id);
    if ('error' in data) call.reject(new Error(data.error));
    else call.resolve(data.rows);
  };
  return worker;
}

const send: Sql = <T extends Row = Row>(sql: string, bind?: SqlValue[]) =>
  new Promise<T[]>((resolve, reject) => {
    const id = nextId++;
    waiting.set(id, {
      resolve: resolve as (rows: Row[]) => void,
      reject,
    });
    getWorker().postMessage({ id, sql, bind } satisfies SqliteRequest);
  });

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const running = queue.then(work, work);
  queue = running.catch(() => undefined);
  return running;
}

export function query<T extends Row = Row>(
  sql: string,
  bind?: SqlValue[],
): Promise<T[]> {
  return enqueue(() => send<T>(sql, bind));
}

export function transaction<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
  return enqueue(async () => {
    await send('BEGIN IMMEDIATE');
    try {
      const result = await work(send);
      await send('COMMIT');
      return result;
    } catch (error) {
      await send('ROLLBACK').catch(() => undefined);
      throw error;
    }
  });
}
