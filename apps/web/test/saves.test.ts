import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { content } from '@silvanus/content';
import { advance, newGame } from '@silvanus/sim';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  IMPORT_MAX_BYTES,
  KEY,
  PREVIOUS,
  WRITE_TIMEOUT_MS,
  SCHEMA,
  STORE,
  closeConnection,
  databaseName,
  exportText,
  importFile,
  importText,
  load,
  parse,
  save,
  storageAnswer,
} from '../src/saves';
import type { SaveRecord } from '../src/saves';

// A played state, so the rng and stock fields hold real values.
function record(): SaveRecord {
  const state = advance({ ...newGame(7, content), foragers: 2 }, 40, content).state;
  return { schema: SCHEMA, anchorMs: 1_700_000_000_000, state };
}

function withDb<T>(run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(databaseName(''), 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, 'readwrite');
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      tx.onerror = () => reject(tx.error);
    };
  });
}
const putRaw = (raw: unknown) => withDb((store) => store.put(raw, KEY));
const readRaw = (key: string = KEY) => withDb<unknown>((store) => store.get(key));

// An M0 resident record: no code makes one yet, but the shape is checked (audit F5).
const resident = () => ({
  id: 1,
  name: 'Brynoc',
  people: 'human',
  bornTick: 0,
  motherId: null,
  fatherId: null,
  spouseId: 2,
  householdId: null,
});

// Every way the shape check can fail, each from a good record.
function damagedRecords(): [string, unknown][] {
  const good = record();
  const withState = (patch: object) => ({ ...good, state: { ...good.state, ...patch } });
  return [
    ['not an object', 'save'],
    ['null', null],
    ['an array', [good]],
    ['no schema', { anchorMs: good.anchorMs, state: good.state }],
    ['schema is not whole', { ...good, schema: 1.5 }],
    ['schema 0 has no upgrade step', { ...good, schema: 0 }],
    ['anchorMs missing', { schema: SCHEMA, state: good.state }],
    ['anchorMs not finite', { ...good, anchorMs: Infinity }],
    ['no state', { schema: SCHEMA, anchorMs: good.anchorMs }],
    ['negative tick', withState({ tick: -1 })],
    ['fractional tick', withState({ tick: 2.5 })],
    ['seed is text', withState({ seed: '7' })],
    ['no contentVersion', withState({ contentVersion: undefined })],
    ['no stock', withState({ stock: undefined })],
    ['fractional food', withState({ stock: { food: 0.5 } })],
    ['negative foragers', withState({ foragers: -1 })],
    ['too many foragers', withState({ foragers: content.camp.maxForagers + 1 })],
    ['no rng', withState({ rng: undefined })],
    ['rng value past 32 bits', withState({ rng: { yield: 4294967296 } })],
    ['rng value negative', withState({ rng: { yield: -1 } })],
    ['residents is not a list', withState({ residents: {} })],
  ];
}

describe('saves', () => {
  beforeEach(() => {
    // each test gets an empty database and a new connection to it
    closeConnection();
    globalThis.indexedDB = new IDBFactory();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test('save then load', async () => {
    expect(await load()).toEqual({ kind: 'none' });
    const saved = record();
    expect(saved.state.stock.food).toBeGreaterThan(0);
    expect(Object.keys(saved.state.rng)).toEqual(['yield']);
    await save(saved);
    expect(await load()).toEqual({ kind: 'ok', record: saved });
    // a later save replaces the one record
    const later = { ...saved, anchorMs: saved.anchorMs + 60_000 };
    await save(later);
    expect(await load()).toEqual({ kind: 'ok', record: later });
  });

  test('writes land in call order', async () => {
    const a = record();
    const b = { ...a, anchorMs: a.anchorMs + 60_000 };
    for (let run = 0; run < 20; run++) {
      closeConnection();
      const factory = new IDBFactory();
      globalThis.indexedDB = factory;
      // The first open answers after every later one: a save that opens its own connection
      // would then write `a` last.
      const realOpen = factory.open.bind(factory);
      let calls = 0;
      let releaseFirst = () => {};
      factory.open = (name: string, version?: number) => {
        const request = realOpen(name, version);
        if (calls++ > 0) {
          request.addEventListener('success', () => setTimeout(releaseFirst, 0));
          return request;
        }
        // hold the first request's success handler back until a later open has answered, or
        // for 20 ms when no later open is made
        const held = { onsuccess: null as ((event: Event) => void) | null };
        let fired: Event | null = null;
        let released = false;
        releaseFirst = () => {
          released = true;
          if (fired) held.onsuccess?.(fired);
        };
        setTimeout(releaseFirst, 20);
        request.addEventListener('success', (event) => {
          fired = event;
          if (released) held.onsuccess?.(event);
        });
        return new Proxy(request, {
          set(target, key, value) {
            if (key === 'onsuccess') held.onsuccess = value;
            else Reflect.set(target, key, value);
            return true;
          },
          get(target, key) {
            const value = Reflect.get(target, key);
            return typeof value === 'function' ? value.bind(target) : value;
          },
        });
      };
      const first = save(a);
      const second = save(b);
      await Promise.all([first, second]);
      factory.open = realOpen;
      expect(await readRaw(), `run ${run}`).toEqual(b);
    }
  });

  test('a failed write does not block the next one', async () => {
    const a = record();
    await save(a);
    const real = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = () => {
      throw new Error('no transaction');
    };
    let failed: Promise<void>;
    try {
      failed = save({ ...a, anchorMs: 1 });
      await expect(failed).rejects.toThrow('no transaction');
    } finally {
      IDBDatabase.prototype.transaction = real;
    }
    const b = { ...a, anchorMs: a.anchorMs + 60_000 };
    await save(b);
    expect(await readRaw()).toEqual(b);
  });

  test('a save that never lands fails and frees the next one', async () => {
    const a = record();
    const factory = indexedDB;
    const realOpen = factory.open.bind(factory);
    // a database that never answers
    factory.open = () => ({}) as IDBOpenDBRequest;
    vi.useFakeTimers();
    const stuck = save(a);
    const queued = save({ ...a, anchorMs: 2 });
    const outcomes = Promise.allSettled([stuck, queued]);
    await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS - 1);
    let settled = false;
    void outcomes.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    // the first gives up at the limit; the second waited its turn and gets its own limit
    await vi.advanceTimersByTimeAsync(1 + WRITE_TIMEOUT_MS);
    expect((await outcomes).map((o) => o.status)).toEqual(['rejected', 'rejected']);
    await expect(stuck).rejects.toThrow('The save timed out.');
    vi.useRealTimers();
    factory.open = realOpen;
    const b = { ...a, anchorMs: a.anchorMs + 60_000 };
    await save(b);
    expect(await readRaw()).toEqual(b);
  });

  test('replace keeps the previous record', async () => {
    const a = record();
    const b = { ...a, anchorMs: a.anchorMs + 60_000 };
    const c = { ...a, anchorMs: a.anchorMs + 120_000 };
    // nothing stored yet: nothing to keep
    await save(a, { keepPrevious: true });
    expect(await readRaw(PREVIOUS)).toBeUndefined();
    // an ordinary save keeps no copy
    await save(b);
    expect(await readRaw(PREVIOUS)).toBeUndefined();
    await save(c, { keepPrevious: true });
    expect(await readRaw(PREVIOUS)).toEqual(b);
    expect(await readRaw()).toEqual(c);
    // a later replace keeps the newest replaced record, whatever it holds
    const strange = { schema: SCHEMA + 1, town: 'a later shape' };
    await putRaw(strange);
    await save(a, { keepPrevious: true });
    expect(await readRaw(PREVIOUS)).toEqual(strange);
    expect(await load()).toEqual({ kind: 'ok', record: a });
  });

  test('a good record parses, at the edges of the shape check', () => {
    const good = record();
    const edge = {
      ...good,
      state: {
        ...good.state,
        tick: Number.MAX_SAFE_INTEGER,
        stock: { food: content.resources.food.cap },
        foragers: content.camp.maxForagers,
        rng: { yield: 4294967295 },
        residents: [resident()],
      },
    };
    expect(parse(edge)).toEqual({ kind: 'ok', record: edge });
    // another content version is not an error: it becomes the running content's
    const older = { ...good, state: { ...good.state, contentVersion: content.version + 5 } };
    expect(parse(older)).toEqual({ kind: 'ok', record: good });
  });

  test('too-new save is refused and kept', async () => {
    const raw = { ...record(), schema: SCHEMA + 1 };
    expect(parse(raw)).toEqual({ kind: 'tooNew', raw });
    // too new wins even when the rest is unreadable to this version
    const strange = { schema: SCHEMA + 1, town: 'a later shape' };
    expect(parse(strange)).toEqual({ kind: 'tooNew', raw: strange });
    await putRaw(raw);
    expect(await load()).toEqual({ kind: 'tooNew', raw });
    expect(await readRaw()).toEqual(raw);
  });

  test('damaged save is refused and kept', async () => {
    for (const [name, raw] of damagedRecords()) {
      expect(parse(raw), name).toEqual({ kind: 'damaged', raw });
    }
    const raw = { ...record(), state: { tick: 12 } };
    await putRaw(raw);
    expect(await load()).toEqual({ kind: 'damaged', raw });
    expect(await readRaw()).toEqual(raw);
  });

  test('unsafe numbers are damaged', () => {
    const good = record();
    const withState = (patch: object) => ({ ...good, state: { ...good.state, ...patch } });
    const withResident = (patch: object) => withState({ residents: [{ ...resident(), ...patch }] });
    const cases: [string, unknown][] = [
      ['tick past 2^53', withState({ tick: 2 ** 53 })],
      ['tick far past 2^53', withState({ tick: 1e300 })],
      ['seed past 2^53', withState({ seed: 2 ** 53 })],
      ['contentVersion past 2^53', withState({ contentVersion: 2 ** 60 })],
      ['food past 2^53', withState({ stock: { food: 2 ** 53 } })],
      ['food over the cap', withState({ stock: { food: content.resources.food.cap + 1 } })],
      ['anchorMs past 2^53', { ...good, anchorMs: 2 ** 53 }],
      ['anchorMs fractional', { ...good, anchorMs: 1.5 }],
      ['anchorMs negative', { ...good, anchorMs: -1 }],
      ['a resident is not an object', withState({ residents: [7] })],
      ['resident id fractional', withResident({ id: 1.5 })],
      ['resident id past 2^53', withResident({ id: 2 ** 53 })],
      ['resident name missing', withResident({ name: undefined })],
      ['resident people is a number', withResident({ people: 3 })],
      ['resident bornTick is text', withResident({ bornTick: '0' })],
      ['resident motherId is text', withResident({ motherId: 'x' })],
      ['resident spouseId negative', withResident({ spouseId: -1 })],
    ];
    for (const [name, raw] of cases) expect(parse(raw), name).toEqual({ kind: 'damaged', raw });
  });

  test('an oversized import is refused', async () => {
    const saved = record();
    const text = exportText(saved);
    let reads = 0;
    const file = (size: number) => ({ size, text: async () => (reads++, text) });
    await expect(importFile(file(IMPORT_MAX_BYTES + 1))).rejects.toThrow(
      'That file is too large to be a save.',
    );
    // refused before the file is read
    expect(reads).toBe(0);
    expect(IMPORT_MAX_BYTES).toBe(5_000_000);
    const imported = await importFile(file(IMPORT_MAX_BYTES));
    expect(imported.state).toEqual(saved.state);
    expect(reads).toBe(1);
  });

  test('no IndexedDB gives unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(await load()).toEqual({ kind: 'unavailable' });
  });

  test('a test tick length has its own database', () => {
    expect(databaseName('')).toBe('silvanus');
    expect(databaseName('?tickMs=60000')).toBe('silvanus-test');
    expect(databaseName('?tickMs=200')).toBe('silvanus-test');
    // an ignored value does not switch databases
    expect(databaseName('?tickMs=49')).toBe('silvanus');
    expect(databaseName('?tickMs=abc')).toBe('silvanus');
  });

  test('export text is indented JSON of the record', () => {
    const raw = { schema: SCHEMA + 1, town: 'a later shape' };
    const text = exportText(raw);
    expect(JSON.parse(text)).toEqual(raw);
    expect(text.split('\n')[1]).toBe(`  "schema": ${SCHEMA + 1},`);
  });

  test('export then import', () => {
    const saved = record();
    vi.useFakeTimers();
    vi.setSystemTime(1_800_000_000_000);
    const imported = importText(exportText(saved));
    expect(imported.state).toEqual(saved.state);
    expect(imported.schema).toBe(SCHEMA);
    // the anchor is the time of import, so a file never causes a catch-up
    expect(imported.anchorMs).toBe(1_800_000_000_000);
    expect(saved.anchorMs).not.toBe(1_800_000_000_000);
  });

  test('import rejects bad files', async () => {
    const kept = record();
    await save(kept);
    const notASave = 'This file is not a Silvanus save.';
    expect(() => importText('')).toThrow(notASave);
    expect(() => importText('{ "schema": 1, ')).toThrow(notASave);
    expect(() => importText('"a town"')).toThrow(notASave);
    for (const [name, raw] of damagedRecords()) {
      // undefined fields vanish in JSON, which leaves them missing: still damaged
      expect(() => importText(JSON.stringify(raw)), name).toThrow(notASave);
    }
    const newer = exportText({ ...record(), schema: SCHEMA + 1 });
    expect(() => importText(newer)).toThrow('This save is from a newer version of the game.');
    // a rejected file changes nothing
    expect(await load()).toEqual({ kind: 'ok', record: kept });
  });

  test('storage answer', async () => {
    const manager = (granted: boolean) => {
      const calls: string[] = [];
      const storage = {
        persist: async () => (calls.push('persist'), granted),
        persisted: async () => (calls.push('persisted'), granted),
      };
      return { calls, storage };
    };
    const yes = manager(true);
    expect(await storageAnswer(yes.storage)).toBe('kept');
    // asks once, then reads the answer
    expect(yes.calls).toEqual(['persist', 'persisted']);
    expect(await storageAnswer(manager(false).storage)).toBe('mayClear');
    expect(await storageAnswer(undefined)).toBe('unknown');
    const broken = {
      persist: () => Promise.reject(new Error('no')),
      persisted: () => Promise.reject(new Error('no')),
    };
    expect(await storageAnswer(broken)).toBe('unknown');
  });
});
