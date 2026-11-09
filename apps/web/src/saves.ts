import { content } from '@silvanus/content';
import type { State } from '@silvanus/sim';
import { testTickMs } from './clock';

export const SCHEMA = 1;
export const STORE = 'saves';
export const KEY = 'main';

export type SaveRecord = { schema: number; anchorMs: number; state: State };
export type Loaded =
  | { kind: 'none' }
  | { kind: 'ok'; record: SaveRecord }
  | { kind: 'tooNew'; raw: unknown }
  | { kind: 'damaged'; raw: unknown }
  | { kind: 'unavailable' };

// Upgrade steps from a stored schema to the next one. Empty in M0.
const upgrades: Record<number, (old: unknown) => unknown> = {};

// A test tick length uses its own database, so a test never touches the real save.
export function databaseName(search: string): string {
  return testTickMs(search) === null ? 'silvanus' : 'silvanus-test';
}

function currentDatabase(): string {
  return databaseName(typeof location === 'undefined' ? '' : location.search);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isWhole = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

function shapeOk(v: unknown): v is SaveRecord {
  if (!isObject(v) || typeof v.anchorMs !== 'number' || !Number.isFinite(v.anchorMs)) return false;
  const state = v.state;
  if (!isObject(state) || !isObject(state.stock) || !isObject(state.rng)) return false;
  if (![state.seed, state.tick, state.contentVersion, state.stock.food].every(isWhole)) {
    return false;
  }
  if (!isWhole(state.foragers) || state.foragers > content.camp.maxForagers) return false;
  if (!Object.values(state.rng).every((n) => isWhole(n) && n <= 4294967295)) return false;
  return Array.isArray(state.residents);
}

// Shared by load and (from S3) importText.
export function parse(raw: unknown): Loaded {
  if (!isObject(raw) || typeof raw.schema !== 'number' || !Number.isInteger(raw.schema)) {
    return { kind: 'damaged', raw };
  }
  if (raw.schema > SCHEMA) return { kind: 'tooNew', raw };
  let current: unknown = raw;
  for (let schema = raw.schema; schema < SCHEMA; schema++) {
    const upgrade = upgrades[schema];
    if (!upgrade) return { kind: 'damaged', raw };
    current = upgrade(current);
  }
  if (!shapeOk(current)) return { kind: 'damaged', raw };
  // A different contentVersion is not an error in M0: it becomes the running content's.
  return {
    kind: 'ok',
    record: {
      schema: SCHEMA,
      anchorMs: current.anchorMs,
      state: { ...current.state, contentVersion: content.version },
    },
  };
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(currentDatabase(), 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('The save database is blocked.'));
  });
}

export async function load(): Promise<Loaded> {
  let db: IDBDatabase;
  try {
    db = await open();
  } catch {
    return { kind: 'unavailable' };
  }
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return raw === undefined ? { kind: 'none' } : parse(raw);
  } catch {
    return { kind: 'unavailable' };
  } finally {
    db.close();
  }
}

export async function save(record: SaveRecord): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      tx.objectStore(STORE).put(record, KEY);
      // Commit at once: the page may be closing (the write is also made on hide).
      tx.commit();
    });
  } finally {
    db.close();
  }
}

// JSON with a 2-space indent; also used for a record the app refused.
export function exportText(raw: unknown): string {
  return JSON.stringify(raw, null, 2);
}
