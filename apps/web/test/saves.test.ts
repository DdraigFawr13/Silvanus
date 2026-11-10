import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { content } from '@silvanus/content';
import { advance, newGame } from '@silvanus/sim';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  KEY,
  SCHEMA,
  STORE,
  databaseName,
  exportText,
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
const readRaw = () => withDb<unknown>((store) => store.get(KEY));

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

  test('a good record parses, at the edges of the shape check', () => {
    const good = record();
    const edge = {
      ...good,
      state: { ...good.state, foragers: content.camp.maxForagers, rng: { yield: 4294967295 } },
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
