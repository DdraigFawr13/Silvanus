import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { Page } from '@playwright/test';

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
