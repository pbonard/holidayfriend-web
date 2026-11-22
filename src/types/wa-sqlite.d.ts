declare module 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js' {
  export class OPFSCoopSyncVFS {
    static create(name: string, module: unknown): Promise<SQLiteVFS>;
  }
}

declare module 'wa-sqlite/src/examples/MemoryVFS.js' {
  export class MemoryVFS {
    static create(name: string, module: unknown): Promise<SQLiteVFS>;
  }
}
