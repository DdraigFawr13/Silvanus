import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { content } from '@silvanus/content';
import { advance, apply, newGame } from '@silvanus/sim';
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

// A played town, so the rng, stock, queue and log fields hold real values.
function record(): SaveRecord {
  const start = apply(newGame(7, content), [{ type: 'build', kind: 'woodcutter' }], content);
  const state = advance(start.state, 40, content).state;
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

// An M0 (schema 1) record, as M0's page stored it.
const m0Resident = () => ({
  id: 1,
  name: 'Brynoc',
  people: 'human',
  bornTick: 0,
  motherId: null,
  fatherId: null,
  spouseId: 2,
  householdId: null,
});
const m0Record = () => ({
  schema: 1,
  anchorMs: 1_700_000_000_000,
  state: {
    contentVersion: 1,
    seed: 7,
    tick: 40,
    rng: { yield: 123 },
    stock: { food: 12 },
    foragers: 2,
    residents: [m0Resident()],
  },
});

// Every way the frame of a record can fail, each from a good record.
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
    ['fractional food', withState({ stock: { ...good.state.stock, food: 0.5 } })],
    ['a store missing', withState({ stock: { food: 1 } })],
    ['a store the content does not have', withState({ stock: { ...good.state.stock, gold: 1 } })],
    ['no rng', withState({ rng: undefined })],
    ['rng value past 32 bits', withState({ rng: { arrivals: 4294967296 } })],
    ['rng value negative', withState({ rng: { arrivals: -1 } })],
    ['residents is not a list', withState({ residents: {} })],
    ['buildings is not a list', withState({ buildings: {} })],
    ['no queue', withState({ queue: undefined })],
    ['no log', withState({ log: undefined })],
    ['jobsDirty is a number', withState({ jobsDirty: 0 })],
    ['hallTier 0', withState({ hallTier: 0 })],
    ['hallTier past the content', withState({ hallTier: 3 })],
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
    expect(Object.keys(saved.state.rng)).toEqual(['arrivals']);
    expect(saved.state.queue).toEqual([]);
    expect(saved.state.log).toHaveLength(1);
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
    const caps = Object.fromEntries(content.resources.map((r) => [r.id, r.cap]));
    const residents = good.state.residents.map((r, i) =>
      i === 0 ? { ...r, morale: 100, skills: { ...r.skills, mining: 0 }, bornTick: -13440 } : r,
    );
    const edge = {
      ...good,
      state: {
        ...good.state,
        tick: Number.MAX_SAFE_INTEGER,
        stock: caps,
        rng: { arrivals: 4294967295 },
        lastLeftTick: -168,
        residents,
      },
    };
    expect(parse(edge)).toEqual({ kind: 'ok', record: edge });
    // another content version is not an error: it becomes the running content's
    const older = { ...good, state: { ...good.state, contentVersion: content.version + 5 } };
    expect(parse(older)).toEqual({ kind: 'ok', record: good });
  });

  test('schema 1 upgrades to a new town', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_800_000_000_000);
    const old = m0Record();
    const parsed = parse(old);
    const town = newGame(7, content);
    expect(parsed).toEqual({
      kind: 'ok',
      record: { schema: SCHEMA, anchorMs: 1_800_000_000_000, state: town },
      upgradedFrom: 1,
    });
    // a schema 2 town at tick 0 with the same seed: 8 residents, the Hall, a Cottage, a hut
    expect(town.tick).toBe(0);
    expect(town.seed).toBe(7);
    expect(town.residents).toHaveLength(8);
    expect(town.hallTier).toBe(1);
    expect(town.buildings.map((b) => b.kind)).toEqual(['cottage', 'forager']);
    vi.useRealTimers();
    // the stored record is not touched by reading it
    await putRaw(old);
    expect(await load()).toMatchObject({ kind: 'ok', upgradedFrom: 1 });
    expect(await readRaw()).toEqual(old);
    // a town already in schema 2 says nothing about an upgrade
    expect(parse(record())).not.toHaveProperty('upgradedFrom');
  });

  test('schema 2 upgrades to owned methods', () => {
    // a schema 2 town as S2 stored it: buildings with no `owned`, a Workshop already on Forge
    const town = record().state;
    const shop = {
      ...town.buildings[1],
      id: town.nextId,
      kind: 'workshop',
      method: 'forge',
      open: 4,
    };
    const strip = ({ owned, ...rest }: (typeof town.buildings)[number]) => {
      void owned;
      return rest;
    };
    const old = {
      schema: 2,
      anchorMs: 1_700_000_000_000,
      state: { ...town, nextId: town.nextId + 1, buildings: [...town.buildings, shop].map(strip) },
    };
    const parsed = parse(old);
    expect(parsed.kind).toBe('ok');
    if (parsed.kind !== 'ok') return;
    expect(parsed.upgradedFrom).toBe(2);
    expect(parsed.record.schema).toBe(SCHEMA);
    expect(parsed.record.state.tick).toBe(town.tick);
    // each building owns its kind's free methods, and the one it runs
    expect(parsed.record.state.buildings.map((b) => [b.kind, b.owned])).toEqual([
      ['cottage', []],
      ['forager', ['gather']],
      ['woodcutter', ['axes']],
      ['workshop', ['mend', 'forge']],
    ]);
    // a schema 2 record that is damaged stays damaged
    const broken = { ...old, state: { ...old.state, tick: -1 } };
    expect(parse(broken)).toEqual({ kind: 'damaged', raw: broken });
  });

  test('a damaged schema 1 save stays damaged', () => {
    const good = m0Record();
    expect(parse(good).kind).toBe('ok');
    const withState = (patch: object) => ({ ...good, state: { ...good.state, ...patch } });
    const withResident = (patch: object) =>
      withState({ residents: [{ ...m0Resident(), ...patch }] });
    const cases: [string, unknown][] = [
      ['no state', { schema: 1, anchorMs: good.anchorMs }],
      ['anchorMs negative', { ...good, anchorMs: -1 }],
      ['negative tick', withState({ tick: -1 })],
      ['seed past 2^53', withState({ seed: 2 ** 53 })],
      ['fractional food', withState({ stock: { food: 0.5 } })],
      ['food over the cap', withState({ stock: { food: 201 } })],
      ['negative foragers', withState({ foragers: -1 })],
      ['too many foragers', withState({ foragers: 4 })],
      ['rng value past 32 bits', withState({ rng: { yield: 4294967296 } })],
      ['residents is not a list', withState({ residents: {} })],
      ['resident id fractional', withResident({ id: 1.5 })],
      ['resident bornTick is text', withResident({ bornTick: '0' })],
      ['resident spouseId negative', withResident({ spouseId: -1 })],
    ];
    for (const [name, raw] of cases) expect(parse(raw), name).toEqual({ kind: 'damaged', raw });
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
    const state = good.state;
    const camp = state.buildings.find((b) => b.kind === 'woodcutter')!;
    const withState = (patch: object) => ({ ...good, state: { ...state, ...patch } });
    const withResident = (patch: object) =>
      withState({ residents: [{ ...state.residents[0], ...patch }, ...state.residents.slice(1)] });
    const withCamp = (patch: object) =>
      withState({ buildings: state.buildings.map((b) => (b === camp ? { ...b, ...patch } : b)) });
    const job = { target: camp.id, toTier: 2, ticksLeft: 24, cost: { wood: 40 } };
    const hallJob = { target: 'hall', toTier: 2, ticksLeft: 96, cost: {} };
    const line = { tick: 1, type: 'built', text: 'x' };
    const cases: [string, unknown][] = [
      ['tick past 2^53', withState({ tick: 2 ** 53 })],
      ['tick far past 2^53', withState({ tick: 1e300 })],
      ['seed past 2^53', withState({ seed: 2 ** 53 })],
      ['contentVersion past 2^53', withState({ contentVersion: 2 ** 60 })],
      ['food past 2^53', withState({ stock: { ...state.stock, food: 2 ** 53 } })],
      ['food over the cap', withState({ stock: { ...state.stock, food: 201 } })],
      ['anchorMs past 2^53', { ...good, anchorMs: 2 ** 53 }],
      ['anchorMs fractional', { ...good, anchorMs: 1.5 }],
      ['anchorMs negative', { ...good, anchorMs: -1 }],
      ['lastLeftTick fractional', withState({ lastLeftTick: 0.5 })],
      ['nextId below an id', withState({ nextId: camp.id })],
      ['a resident is not an object', withState({ residents: [7] })],
      ['resident id fractional', withResident({ id: 1.5 })],
      ['resident id past 2^53', withResident({ id: 2 ** 53 })],
      ['two residents share an id', withResident({ id: state.residents[1].id })],
      ['a resident and a building share an id', withResident({ id: camp.id })],
      ['resident name missing', withResident({ name: undefined })],
      ['resident people is a number', withResident({ people: 3 })],
      ['resident people not in the content', withResident({ people: 'elf' })],
      ['resident bornTick is text', withResident({ bornTick: '0' })],
      ['resident motherId is text', withResident({ motherId: 'x' })],
      ['resident spouseId negative', withResident({ spouseId: -1 })],
      ['morale over 100', withResident({ morale: 101 })],
      ['morale fractional', withResident({ morale: 49.5 })],
      ['a skill over 100', withResident({ skills: { ...state.residents[0].skills, mining: 101 } })],
      ['a skill missing', withResident({ skills: { mining: 30 } })],
      ['a trait not in the content', withResident({ traits: ['lucky', 'deft'] })],
      ['a job in no building', withResident({ jobId: 999 })],
      ['a pin to no building', withResident({ pinnedTo: 999 })],
      ['workDays negative', withResident({ workDays: -1 })],
      ['a reason with no amount', withResident({ reasons: [{ id: 'food' }] })],
      ['a kind not in the content', withCamp({ kind: 'castle' })],
      ["another building's method", withCamp({ method: 'gather' })],
      ['no method where the kind has some', withCamp({ method: null })],
      ['tier 4', withCamp({ tier: 4 })],
      ['more open slots than the tier has', withCamp({ open: 5 })],
      ['open slots on a building not built yet', withCamp({ tier: 0 })],
      ['carry in an unknown resource', withCamp({ carry: { gold: 1 } })],
      ['debt fractional', withCamp({ debt: { wood: 0.5 } })],
      ['short is a number', withCamp({ short: 1 })],
      ['no owned list', withCamp({ owned: undefined })],
      ["owns another building's method", withCamp({ owned: ['axes', 'gather'] })],
      ['owns a method twice', withCamp({ owned: ['axes', 'axes'] })],
      ['does not own the method it runs', withCamp({ owned: [] })],
      ['short on a method with no fallback', withCamp({ short: true })],
      ['retooling past a setup', withCamp({ retoolLeft: 25 })],
      ['more buildings than lots', withState({ buildings: Array(7).fill(camp) })],
      ['five jobs', withState({ queue: [job, hallJob, job, hallJob, job] })],
      ['two jobs for one building', withState({ queue: [job, job] })],
      ['a job that skips a tier', withState({ queue: [{ ...job, toTier: 3 }] })],
      ['a first build of a built building', withState({ queue: [{ ...job, toTier: 1 }] })],
      ['a Hall job past the last tier', withState({ queue: [{ ...hallJob, toTier: 3 }] })],
      ['a Hall job to tier 0', withState({ queue: [{ ...hallJob, toTier: 0 }] })],
      ['a building not built and with no job', withCamp({ tier: 0, open: 0 })],
      ['three traits', withResident({ traits: ['deft', 'woodwise', 'sociable'] })],
      [
        'more residents than the Hall holds',
        withState({
          residents: Array.from({ length: 26 }, (_, i) => ({ ...state.residents[0], id: 100 + i })),
          nextId: 200,
        }),
      ],
      ['a job for no building', withState({ queue: [{ ...job, target: 999 }] })],
      ['a job with a text cost', withState({ queue: [{ ...job, cost: { wood: '40' } }] })],
      ['101 log lines', withState({ log: Array(101).fill(line) })],
      ['a log line with no text', withState({ log: [{ tick: 1, type: 'built' }] })],
    ];
    for (const [name, raw] of cases) expect(parse(raw), name).toEqual({ kind: 'damaged', raw });
    // the same patches, kept inside the limits, are still a good record
    const fine = withState({ queue: [job, hallJob], log: Array(100).fill(line) });
    expect(parse(fine).kind).toBe('ok');
    // a building still waiting to be built, with its job, is a good record too
    const ordered = apply(state, [{ type: 'build', kind: 'cottage' }], content).state;
    expect(ordered.buildings.at(-1)?.tier).toBe(0);
    expect(parse({ ...good, state: ordered }).kind).toBe('ok');
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
