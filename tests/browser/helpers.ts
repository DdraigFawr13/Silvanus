import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { content } from '@silvanus/content';
import { apply, newGame } from '@silvanus/sim';
import type { Command, State } from '@silvanus/sim';
import type { Locator, Page } from '@playwright/test';

export { content };

// A schema 2 record of a new town, as the app stores it. `commands` are carried out on it
// first; `state` then overrides fields. The anchor is now unless given.
export function townRecord(
  overrides: {
    seed?: number;
    anchorMs?: number;
    commands?: Command[];
    state?: Partial<State>;
  } = {},
) {
  const start = newGame(overrides.seed ?? 1, content);
  const state = apply(start, overrides.commands ?? [], content).state;
  return {
    schema: 3,
    anchorMs: overrides.anchorMs ?? Date.now(),
    state: { ...state, ...overrides.state },
  };
}

// The town with copies of its residents added until it holds `total`, each with its own id and
// name: a seed of 20 without waiting for settlers.
export function crowd(state: State, total: number): Partial<State> {
  const residents = state.residents.slice();
  let nextId = state.nextId;
  for (let i = 0; residents.length < total; i++) {
    const model = state.residents[i % state.residents.length];
    residents.push({
      ...model,
      id: nextId++,
      name: `${model.name} ${i + 2}`,
      jobId: null,
      pinnedTo: null,
    });
  }
  return { residents, nextId, jobsDirty: true };
}

// Seed 1's Forager's hut.
export const HUT = newGame(1, content).buildings.find((b) => b.kind === 'forager')!.id;

// The tick behind a date on the page. Dates carry it in `data-tick`; the player never sees it.
const tickOf = async (locator: Locator) => Number(await locator.getAttribute('data-tick'));
export const tick = (page: Page) => tickOf(page.getByTestId('date'));
export const savedTick = (page: Page) => tickOf(page.getByTestId('saved-at'));

// The row of a built lot, by the building's name.
export const lot = (page: Page, name: string) => page.getByTestId('lot').filter({ hasText: name });

// Stores a record before the app ever runs, from an empty page on the app's origin.
export async function seedRecord(page: Page, record: unknown) {
  await page.route('**/seed.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>seed</title>' }),
  );
  await page.goto('/seed.html');
  await page.evaluate(
    (raw) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('silvanus-test', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('saves');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(raw, 'main');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    record,
  );
}

// The record stored under `key` in the test database, read from the page.
export const readRecord = (page: Page, key = 'main') =>
  page.evaluate(
    (k) =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('silvanus-test', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const get = db.transaction('saves', 'readonly').objectStore('saves').get(k);
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
          get.onerror = () => reject(get.error);
        };
      }),
    key,
  );

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

// Serves a folder's files as they are at the time of each request, never cached, so a test can
// swap one build for another under a running page. Resolves once it listens.
export function serveFolder(dir: string, port: number): Promise<http.Server> {
  const server = http.createServer((request, response) => {
    const name = new URL(request.url ?? '/', 'http://x').pathname;
    const file = path.join(dir, name === '/' ? 'index.html' : path.normalize(name));
    if (!file.startsWith(dir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404, { 'Cache-Control': 'no-store' }).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(fs.readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
