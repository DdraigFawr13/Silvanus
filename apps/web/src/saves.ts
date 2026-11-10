import { content } from '@silvanus/content';
import { capsOf, freeMethods, kindOf, newGame } from '@silvanus/sim';
import type { State } from '@silvanus/sim';
import { testTickMs } from './clock';

export const SCHEMA = 3;
export const STORE = 'saves';
export const KEY = 'main';
// The record an import or an upgrade replaced, kept so it can be brought back by hand (audit F4).
export const PREVIOUS = 'previous';
export const IMPORT_MAX_BYTES = 5_000_000;

export type SaveRecord = { schema: number; anchorMs: number; state: State };
export type Loaded =
  | { kind: 'none' }
  // `upgradedFrom`: the record was stored in that older schema and has not been saved since
  | { kind: 'ok'; record: SaveRecord; upgradedFrom?: number }
  | { kind: 'tooNew'; raw: unknown }
  | { kind: 'damaged'; raw: unknown }
  | { kind: 'unavailable' };

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
const upTo = (v: unknown, max: number): v is number => isWhole(v) && v <= max;
const rngOk = (v: unknown) =>
  isObject(v) && Object.values(v).every((n) => isWhole(n) && n <= 4294967295);

// The fields a resident has had since M0.
function personOk(v: unknown): v is Record<string, unknown> {
  if (!isObject(v)) return false;
  if (!isWhole(v.id) || typeof v.name !== 'string' || typeof v.people !== 'string') return false;
  // a resident can be born before the town's first tick
  if (!Number.isSafeInteger(v.bornTick)) return false;
  return [v.motherId, v.fatherId, v.spouseId, v.householdId].every(isId);
}

// M0's limits, kept here because the content no longer holds them.
const M0_FOOD_CAP = 200;
const M0_MAX_FORAGERS = 3;

// The shape of a schema 1 (M0) record.
function shapeOkV1(v: unknown): v is { anchorMs: number; state: { seed: number } } {
  if (!isObject(v) || !isWhole(v.anchorMs)) return false;
  const state = v.state;
  if (!isObject(state) || !isObject(state.stock) || !rngOk(state.rng)) return false;
  if (![state.seed, state.tick, state.contentVersion].every(isWhole)) return false;
  if (!upTo(state.stock.food, M0_FOOD_CAP) || !upTo(state.foragers, M0_MAX_FORAGERS)) return false;
  return Array.isArray(state.residents) && state.residents.every(personOk);
}

// Whole amounts keyed by resources the content has.
function amountsOk(v: unknown): v is Record<string, number> {
  if (!isObject(v)) return false;
  return Object.entries(v).every(
    ([id, n]) => content.resources.some((r) => r.id === id) && isWhole(n),
  );
}

function buildingOk(v: unknown): boolean {
  if (!isObject(v) || !isWhole(v.id) || typeof v.kind !== 'string') return false;
  const kind = kindOf(content, v.kind);
  if (!kind || !upTo(v.tier, kind.tiers.length)) return false;
  const methods = content.methods.filter((m) => m.building === kind.id).map((m) => m.id);
  if (methods.length === 0 ? v.method !== null : !methods.includes(v.method as string)) {
    return false;
  }
  const slots = v.tier === 0 ? 0 : kind.tiers[v.tier - 1].slots;
  if (!upTo(v.open, slots) || !isWhole(v.retoolLeft) || typeof v.short !== 'boolean') return false;
  // its own methods, each once, the one it runs among them (D-034)
  const owned = v.owned;
  if (!Array.isArray(owned) || new Set(owned).size !== owned.length) return false;
  if (!owned.every((id) => methods.includes(id as string))) return false;
  if (v.method !== null && !owned.includes(v.method)) return false;
  return amountsOk(v.carry) && amountsOk(v.debt);
}

function residentOk(v: unknown, buildingIds: Set<unknown>): boolean {
  if (!personOk(v) || !content.peoples.some((p) => p.id === v.people)) return false;
  const skills = v.skills;
  if (!isObject(skills) || Object.keys(skills).length !== content.skills.length) return false;
  if (!content.skills.every((skill) => upTo(skills[skill.id], 100))) return false;
  if (!Array.isArray(v.traits) || v.traits.length !== 2) return false;
  if (!v.traits.every((id) => content.traits.some((trait) => trait.id === id))) return false;
  if (!upTo(v.morale, 100) || !isWhole(v.workDays) || !isWhole(v.arrivedTick)) return false;
  const reasonOk = (r: unknown) =>
    isObject(r) && typeof r.id === 'string' && Number.isSafeInteger(r.amount);
  if (!Array.isArray(v.reasons) || !v.reasons.every(reasonOk)) return false;
  return [v.jobId, v.pinnedTo].every((id) => id === null || buildingIds.has(id));
}

// A new field in the save means a check here and, for a stored shape that changes, an upgrade
// step below.
function shapeOk(v: unknown): v is SaveRecord {
  if (!isObject(v) || !isWhole(v.anchorMs)) return false;
  const state = v.state;
  if (!isObject(state) || !rngOk(state.rng)) return false;
  if (![state.seed, state.tick, state.contentVersion, state.nextId].every(isWhole)) return false;
  if (!isWhole(state.hallTier) || state.hallTier < 1) return false;
  const hall = content.hall.tiers[state.hallTier - 1];
  if (!hall || !Number.isSafeInteger(state.lastLeftTick)) return false;
  if (typeof state.jobsDirty !== 'boolean') return false;

  const { buildings, residents, queue, log } = state;
  if (!Array.isArray(buildings) || buildings.length > hall.lots) return false;
  if (!buildings.every(buildingOk)) return false;
  const buildingIds = new Set<unknown>(buildings.map((b) => b.id));
  if (!Array.isArray(residents) || !residents.every((r) => residentOk(r, buildingIds))) {
    return false;
  }
  const ids = [...buildings, ...residents].map((entry) => entry.id as number);
  if (new Set(ids).size !== ids.length || ids.some((id) => id >= (state.nextId as number))) {
    return false;
  }

  // A job fits its target: the Hall or a building in the record, one tier up from where it is,
  // and one job at most for each. A building not yet built must have its job, or its lot could
  // never be freed.
  if (!Array.isArray(queue) || queue.length > 1 + content.rules.queueMax) return false;
  const targets = new Set<unknown>();
  for (const job of queue) {
    if (!isObject(job) || !isWhole(job.ticksLeft) || !amountsOk(job.cost)) return false;
    if (targets.has(job.target)) return false;
    targets.add(job.target);
    if (job.target === 'hall') {
      if (job.toTier !== state.hallTier + 1 || !content.hall.tiers[state.hallTier]) return false;
      continue;
    }
    const building = buildings.find((b) => b.id === job.target);
    if (!building || job.toTier !== building.tier + 1) return false;
    if (building.tier >= kindOf(content, building.kind)!.tiers.length) return false;
  }
  if (buildings.some((b) => b.tier === 0 && !targets.has(b.id))) return false;
  if (residents.length > hall.residents) return false;

  const lineOk = (line: unknown) =>
    isObject(line) &&
    isWhole(line.tick) &&
    typeof line.type === 'string' &&
    typeof line.text === 'string';
  if (!Array.isArray(log) || log.length > content.rules.logMax || !log.every(lineOk)) return false;

  // every store the content has, each a whole number up to its cap, and no others
  const stock = state.stock;
  if (!amountsOk(stock) || Object.keys(stock).length !== content.resources.length) return false;
  const caps = capsOf(state as unknown as State, content);
  return content.resources.every((r) => upTo(stock[r.id], caps[r.id]));
}

// Upgrade steps from a stored schema to the next one; null for a record the step cannot read.
// 1 to 2: an M0 save holds a counter, not a town, so its seed starts a new town at tick 0.
const upgrades: Record<number, (old: unknown) => unknown> = {
  1: (old) =>
    shapeOkV1(old)
      ? { schema: 2, anchorMs: Date.now(), state: newGame(old.state.seed, content) }
      : null,
  // 2 to 3: buildings own methods (D-034). Each owns its kind's free methods and the one it runs.
  2: (old) => {
    if (!isObject(old) || !isObject(old.state) || !Array.isArray(old.state.buildings)) return null;
    const buildings = old.state.buildings.map((b: unknown) => {
      if (!isObject(b) || typeof b.kind !== 'string') return b;
      const free = freeMethods(content, b.kind);
      const runs = typeof b.method === 'string' && !free.includes(b.method) ? [b.method] : [];
      return { ...b, owned: [...free, ...runs] };
    });
    return { ...old, schema: 3, state: { ...old.state, buildings } };
  },
};

// Shared by load and importText.
export function parse(raw: unknown): Loaded {
  if (!isObject(raw) || typeof raw.schema !== 'number' || !Number.isInteger(raw.schema)) {
    return { kind: 'damaged', raw };
  }
  if (raw.schema > SCHEMA) return { kind: 'tooNew', raw };
  let current: unknown = raw;
  for (let schema = raw.schema; schema < SCHEMA; schema++) {
    const upgrade = upgrades[schema];
    current = upgrade ? upgrade(current) : null;
    if (current === null) return { kind: 'damaged', raw };
  }
  if (!shapeOk(current)) return { kind: 'damaged', raw };
  // A different contentVersion is not an error: it becomes the running content's.
  const record: SaveRecord = {
    schema: SCHEMA,
    anchorMs: current.anchorMs,
    state: { ...current.state, contentVersion: content.version },
  };
  return raw.schema < SCHEMA
    ? { kind: 'ok', record, upgradedFrom: raw.schema }
    : { kind: 'ok', record };
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
