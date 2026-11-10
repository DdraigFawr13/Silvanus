import { content } from '@silvanus/content';
import type { State } from '@silvanus/sim';
import { testTickMs } from './clock';

export const SCHEMA = 1;
export const STORE = 'saves';
export const KEY = 'main';
// The record an import replaced, kept so a replace can be undone by hand (audit F4).
export const PREVIOUS = 'previous';
export const IMPORT_MAX_BYTES = 5_000_000;

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
// Whole, 0 or more, and small enough that tick arithmetic stays exact (audit F5).
const isWhole = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const isId = (v: unknown) => v === null || isWhole(v);

function residentOk(v: unknown): boolean {
  if (!isObject(v)) return false;
  if (!isWhole(v.id) || typeof v.name !== 'string' || typeof v.people !== 'string') return false;
  // a resident can be born before the town's first tick
  if (!Number.isSafeInteger(v.bornTick)) return false;
  return [v.motherId, v.fatherId, v.spouseId, v.householdId].every(isId);
}

// A new field in the save means a check here and, for a stored shape that changes, an upgrade
// step below.
function shapeOk(v: unknown): v is SaveRecord {
  if (!isObject(v) || !isWhole(v.anchorMs)) return false;
  const state = v.state;
  if (!isObject(state) || !isObject(state.stock) || !isObject(state.rng)) return false;
  if (![state.seed, state.tick, state.contentVersion, state.stock.food].every(isWhole)) {
    return false;
  }
  if ((state.stock.food as number) > content.resources.food.cap) return false;
  if (!isWhole(state.foragers) || state.foragers > content.camp.maxForagers) return false;
  if (!Object.values(state.rng).every((n) => isWhole(n) && n <= 4294967295)) return false;
  return Array.isArray(state.residents) && state.residents.every(residentOk);
}

// Shared by load and importText.
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

// One connection, opened on first use and shared by every read and write (audit F1). It is
// dropped when the browser closes it or a read or write fails, so the next call opens a new one.
let connection: Promise<IDBDatabase> | null = null;

// With `only`, the shared connection is closed only if it is still that one: a failed call
// must not close the connection that has since replaced its own.
export function closeConnection(only?: Promise<IDBDatabase>): void {
  const was = connection;
  if (was === null || (only !== undefined && only !== was)) return;
  connection = null;
  was.then(
    (db) => db.close(),
    () => {},
  );
}

function connect(): Promise<IDBDatabase> {
  if (connection === null) {
    let mine: Promise<IDBDatabase>;
    const drop = () => closeConnection(mine);
    try {
      mine = open();
    } catch (error) {
      // no IndexedDB at all
      return Promise.reject(error);
    }
    connection = mine;
    mine.then((db) => {
      db.onclose = drop;
      db.onversionchange = drop;
    }, drop);
  }
  return connection;
}

export async function load(): Promise<Loaded> {
  let used: Promise<IDBDatabase> | undefined;
  try {
    used = connect();
    const db = await used;
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return raw === undefined ? { kind: 'none' } : parse(raw);
  } catch {
    if (used) closeConnection(used);
    return { kind: 'unavailable' };
  }
}

// A write that has not landed after this long is given up as failed, so a database that never
// answers cannot hold every later save behind it in silence.
export const WRITE_TIMEOUT_MS = 10_000;

async function write(record: SaveRecord, keepPrevious: boolean): Promise<void> {
  let used: Promise<IDBDatabase> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('The save timed out.')), WRITE_TIMEOUT_MS);
  });
  try {
    used = connect();
    await Promise.race([timedOut, putRecord(used, record, keepPrevious)]);
  } catch (error) {
    if (used) closeConnection(used);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function putRecord(
  connecting: Promise<IDBDatabase>,
  record: SaveRecord,
  keepPrevious: boolean,
): Promise<void> {
  const db = await connecting;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    const store = tx.objectStore(STORE);
    const put = () => {
      store.put(record, KEY);
      // Commit at once: the page may be closing (the write is also made on hide).
      tx.commit();
    };
    if (!keepPrevious) {
      put();
      return;
    }
    // The copy and the new record land together or not at all.
    const old = store.get(KEY);
    old.onsuccess = () => {
      if (old.result !== undefined) store.put(old.result, PREVIOUS);
      put();
    };
  });
}

// Writes run one at a time in call order, so an older state is never stored last (audit F1).
// A failed write rejects its own call and does not hold up the next one.
let writes: Promise<void> = Promise.resolve();

// `keepPrevious`: the record now stored (if any) is copied to `previous` in the same
// transaction, replacing an older copy. Imports use it (audit F4).
export function save(record: SaveRecord, options: { keepPrevious?: boolean } = {}): Promise<void> {
  const run = () => write(record, options.keepPrevious === true);
  const result = writes.then(run, run);
  writes = result.catch(() => {});
  return result;
}

// JSON with a 2-space indent; also used for a record the app refused.
export function exportText(raw: unknown): string {
  return JSON.stringify(raw, null, 2);
}

// Reads a save file's text. The anchor becomes the time of import, so a file never causes a
// catch-up.
export function importText(text: string): SaveRecord {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not a Silvanus save.');
  }
  const parsed = parse(raw);
  if (parsed.kind === 'tooNew') throw new Error('This save is from a newer version of the game.');
  if (parsed.kind !== 'ok') throw new Error('This file is not a Silvanus save.');
  return { ...parsed.record, anchorMs: Date.now() };
}

// Reads a chosen file. One over the size limit is refused before it is read (audit F5).
export async function importFile(file: Pick<File, 'size' | 'text'>): Promise<SaveRecord> {
  if (file.size > IMPORT_MAX_BYTES) throw new Error('That file is too large to be a save.');
  return importText(await file.text());
}

export type StorageAnswer = 'kept' | 'mayClear' | 'unknown';

// Asks the browser once to keep the save, then reads its answer.
export async function storageAnswer(
  storage: Pick<StorageManager, 'persist' | 'persisted'> | undefined,
): Promise<StorageAnswer> {
  if (!storage || !storage.persist || !storage.persisted) return 'unknown';
  try {
    await storage.persist();
    return (await storage.persisted()) ? 'kept' : 'mayClear';
  } catch {
    return 'unknown';
  }
}
