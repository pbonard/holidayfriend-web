import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const to = join(root, 'public/wa-sqlite');

mkdirSync(to, { recursive: true });
cpSync(
  join(root, 'node_modules/wa-sqlite/dist/wa-sqlite.wasm'),
  join(to, 'wa-sqlite.wasm'),
);
