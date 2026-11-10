import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import type http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readRecord, seedRecord, serveFolder } from './helpers';

const number = async (page: Page, id: string) => Number(await page.getByTestId(id).innerText());

// The state of the page's active service worker, or null while there is none.
const workerState = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.state ?? null;
  });

test('reload keeps the town', async ({ page }) => {
  await page.goto('/?tickMs=200');
  await expect.poll(() => number(page, 'tick')).toBeGreaterThanOrEqual(20);
  await page.getByRole('button', { name: 'More foragers' }).click();
  await page.getByRole('button', { name: 'More foragers' }).click();
  await expect(page.getByTestId('foragers')).toHaveText('3');
  const t = await number(page, 'tick');
  // A save made after the taps: one at exactly `t` could be older than them.
  await expect.poll(() => number(page, 'saved-tick')).toBeGreaterThan(t);

  await page.goto('/?tickMs=60000');
  // A game that was not kept would show Foragers 1 and tick 0.
  await expect(page.getByTestId('foragers')).toHaveText('3');
  const after = await number(page, 'tick');
  expect(after).toBeGreaterThanOrEqual(t);
  expect(after).toBeLessThanOrEqual(t + 50);
});

test('five minutes closed is caught up as 5 ticks', async ({ page }) => {
  // A town last true 5 minutes and 20 seconds ago, with no foragers so food cannot move.
  const state = {
    contentVersion: 1,
    seed: 1,
    tick: 100,
    rng: {},
    stock: { food: 9 },
    foragers: 0,
    residents: [],
  };
  await seedRecord(page, { schema: 1, anchorMs: Date.now() - 320_000, state });
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('caught-up')).toHaveText('5');
  await expect(page.getByTestId('tick')).toHaveText('105');
  await expect(page.getByTestId('food')).toHaveText('9');
  // the catch-up is saved once, at its end
  await expect(page.getByTestId('saved-tick')).toHaveText('105');
});

test('unreadable save shows the refusal', async ({ page }) => {
  const record = { schema: 2, anchorMs: 1_700_000_000_000, town: { name: 'a later shape' } };
  await seedRecord(page, record);

  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('notice')).toHaveText(
    'This save is from a newer version of the game.',
  );
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  await expect(page.getByTestId('tick')).toHaveCount(0);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  expect((await download).suggestedFilename()).toBe('silvanus-save-unreadable.json');

  // Leaving the page is when a running town saves. This read backs up the checks above:
  // had a game started over the refused save, its save on hide would show here.
  await page.goto('/seed.html');
  expect(await readRecord(page)).toEqual(record);
});

test('second window stands down', async ({ page, context }) => {
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('tick')).toBeVisible();
  const second = await context.newPage();
  await second.goto('/?tickMs=60000');
  await expect(second.getByTestId('notice')).toHaveText('Silvanus is open in another window.');
  await expect(second.getByTestId('tick')).toHaveCount(0);
  // the first window still runs the town
  await expect(page.getByTestId('tick')).toBeVisible();
  await expect(page.getByTestId('notice')).toHaveCount(0);
});

// A save file as Export writes it; the anchor is 40 hours old, which would be a full catch-up.
const fileState = {
  contentVersion: 1,
  seed: 5,
  tick: 388,
  rng: { yield: 12345 },
  stock: { food: 40 },
  foragers: 3,
  residents: [],
};
const saveFile = (text: string) => ({
  name: 'silvanus-save.json',
  mimeType: 'application/json',
  buffer: Buffer.from(text),
});
const goodFile = () =>
  saveFile(JSON.stringify({ schema: 1, anchorMs: Date.now() - 40 * 3_600_000, state: fileState }));

test('export and import carry the town', async ({ page }) => {
  const startedMs = Date.now();
  const state = { ...fileState, seed: 1, tick: 512, rng: {}, stock: { food: 9 }, foragers: 0 };
  await seedRecord(page, { schema: 1, anchorMs: Date.now(), state });
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('tick')).toHaveText('512');

  // Export gives the town as it stands, the tap just made included.
  await page.getByRole('button', { name: 'More foragers' }).click();
  await expect(page.getByTestId('foragers')).toHaveText('1');
  const download = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('silvanus-save-512.json');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(exported.schema).toBe(1);
  expect(exported.state).toEqual({ ...state, foragers: 1 });

  // A file that is not a save is refused with a message and changes nothing.
  await page.getByTestId('import-file').setInputFiles(saveFile('{ "town": '));
  await expect(page.getByTestId('notice')).toHaveText('This file is not a Silvanus save.');
  await expect(page.getByTestId('import-confirm')).toHaveCount(0);
  await expect(page.getByTestId('tick')).toHaveText('512');

  // Cancel, by keyboard, keeps the town.
  await page.getByTestId('import-file').setInputFiles(goodFile());
  await expect(page.getByTestId('import-confirm')).toContainText('Replace tick 512 with tick 388?');
  await expect(page.getByTestId('notice')).toHaveCount(0);
  await page.getByTestId('cancel').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('import-confirm')).toHaveCount(0);
  await expect(page.getByTestId('tick')).toHaveText('512');
  await expect(page.getByTestId('foragers')).toHaveText('1');

  // Replace loads the file's town, saves it, and catches nothing up.
  await page.getByTestId('import-file').setInputFiles(goodFile());
  await page.getByTestId('replace').click();
  await expect(page.getByTestId('tick')).toHaveText('388');
  await expect(page.getByTestId('foragers')).toHaveText('3');
  await expect(page.getByTestId('food')).toHaveText('40');
  await expect(page.getByTestId('saved-tick')).toHaveText('388');
  await expect(page.getByTestId('caught-up')).toHaveCount(0);
  await expect(page.getByTestId('import-confirm')).toHaveCount(0);
  // The stored anchor is the time of import, not the file's, so no catch-up is owed.
  const stored = (await readRecord(page)) as { anchorMs: number };
  expect(stored.anchorMs).toBeGreaterThanOrEqual(startedMs);
  // the town the import replaced is kept under `previous`, with the tap made before the export
  const previous = (await readRecord(page, 'previous')) as { state: unknown };
  expect(previous.state).toEqual({ ...state, foragers: 1 });

  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('tick')).toHaveText('388');
  await expect(page.getByTestId('foragers')).toHaveText('3');
});

test('an import replaces an unreadable save', async ({ page }) => {
  const record = { schema: 2, anchorMs: 1_700_000_000_000, town: { name: 'a later shape' } };
  await seedRecord(page, record);
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('notice')).toHaveText(
    'This save is from a newer version of the game.',
  );

  await page.getByTestId('import-file').setInputFiles(goodFile());
  await expect(page.getByTestId('import-confirm')).toContainText(
    'Replace the unreadable save with tick 388?',
  );
  // Nothing is written until Replace.
  expect(await readRecord(page)).toEqual(record);
  await page.getByTestId('replace').click();
  await expect(page.getByTestId('tick')).toHaveText('388');
  await expect(page.getByTestId('saved-tick')).toHaveText('388');
  await expect(page.getByTestId('notice')).toHaveCount(0);
  const stored = (await readRecord(page)) as { schema: number; state: unknown };
  expect(stored.schema).toBe(1);
  expect(stored.state).toEqual(fileState);
  // the record the import replaced is kept beside it
  expect(await readRecord(page, 'previous')).toEqual(record);
});

for (const [granted, line] of [
  [true, 'kept'],
  [false, 'the browser may clear this. Export a save.'],
] as const) {
  test(`the storage line says "${line}" when the browser answers ${granted}`, async ({ page }) => {
    await page.addInitScript((answer) => {
      navigator.storage.persist = async () => answer;
      navigator.storage.persisted = async () => answer;
    }, granted);
    await page.goto('/?tickMs=60000');
    await expect(page.getByTestId('storage')).toHaveText(line);
  });
}

test('hiding the page saves', async ({ page }) => {
  // A minute per tick: no autosave falls inside this test, so only the hide can store the tap.
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('foragers')).toHaveText('1');
  await page.getByRole('button', { name: 'More foragers' }).click();
  await expect(page.getByTestId('foragers')).toHaveText('2');
  expect(await readRecord(page)).toBeUndefined();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(
      async () =>
        ((await readRecord(page)) as { state: { foragers: number } } | undefined)?.state.foragers,
    )
    .toBe(2);
});

test('a failed save is shown', async ({ page }) => {
  await page.goto('/?tickMs=50');
  await expect.poll(() => number(page, 'saved-tick')).toBeGreaterThan(0);
  await expect(page.getByTestId('notice-saveFailed')).toHaveCount(0);
  // Every write now fails: the open connection gives no transaction and no new one can open.
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.realTransaction = IDBDatabase.prototype.transaction;
    w.realOpen = IDBFactory.prototype.open;
    IDBDatabase.prototype.transaction = () => {
      throw new DOMException('no transaction', 'InvalidStateError');
    };
    IDBFactory.prototype.open = () => {
      throw new DOMException('no database', 'InvalidStateError');
    };
  });
  await expect(page.getByTestId('notice-saveFailed')).toHaveText('Saving failed. Export a save.');
  const stuck = await number(page, 'saved-tick');
  expect(await number(page, 'tick')).toBeGreaterThan(stuck);
  // The next save that lands clears the notice.
  await page.evaluate(() => {
    const w = window as unknown as Record<string, never>;
    IDBDatabase.prototype.transaction = w.realTransaction;
    IDBFactory.prototype.open = w.realOpen;
  });
  await expect(page.getByTestId('notice-saveFailed')).toHaveCount(0);
  await expect.poll(() => number(page, 'saved-tick')).toBeGreaterThan(stuck);
});

test.describe('installed', () => {
  // Every other test runs with service workers blocked, so `page.route` sees each request.
  test.use({ serviceWorkers: 'allow' });

  test('starts with no network', async ({ page, context }) => {
    await page.goto('/?tickMs=60000');
    await expect(page.getByTestId('tick')).toBeVisible();
    const manifest = await page.evaluate(async () => {
      const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href;
      const data = await (await fetch(href)).json();
      const icons = await Promise.all(
        data.icons.map(async (icon: { src: string; sizes: string; purpose: string }) => ({
          sizes: icon.sizes,
          purpose: icon.purpose,
          ok: (await fetch(new URL(icon.src, href))).ok,
        })),
      );
      return { name: data.name, id: data.id, display: data.display, start: data.start_url, icons };
    });
    expect(manifest).toEqual({
      name: 'Silvanus',
      id: '/',
      display: 'standalone',
      start: '/',
      icons: [
        { sizes: '192x192', purpose: 'any', ok: true },
        { sizes: '512x512', purpose: 'any', ok: true },
        { sizes: '512x512', purpose: 'maskable', ok: true },
      ],
    });
    // The service worker has cached the app once it is active.
    await expect.poll(() => workerState(page)).toBe('activated');
    await context.setOffline(true);
    await page.goto('/?tickMs=60000');
    await expect(page.getByTestId('tick')).toBeVisible();
    await expect(page.getByTestId('version')).not.toBeEmpty();
  });

  test.describe('update', () => {
    // Two builds of the app that differ only in their Version line, and one folder that is
    // served: the first build's files, then the second's.
    const web = path.resolve('apps/web');
    const build = (name: string) => path.join(web, `dist-${name}`);
    const ORIGIN = 'http://127.0.0.1:4174';
    let served = '';
    let server: http.Server | null = null;
    const serve = (name: string) => {
      for (const entry of fs.readdirSync(served)) {
        fs.rmSync(path.join(served, entry), { recursive: true });
      }
      fs.cpSync(build(name), served, { recursive: true });
    };

    test.beforeAll(async () => {
      test.setTimeout(120_000);
      for (const name of ['a', 'b']) {
        execFileSync('npx', ['vite', 'build', '--outDir', `dist-${name}`], {
          cwd: web,
          env: { ...process.env, SILVANUS_VERSION: `build-${name}` },
          stdio: 'pipe',
        });
      }
      served = fs.mkdtempSync(path.join(os.tmpdir(), 'silvanus-update-'));
      serve('a');
      server = await serveFolder(served, 4174);
    });

    test.afterAll(async () => {
      await new Promise((resolve) => (server ? server.close(resolve) : resolve(null)));
      for (const dir of [build('a'), build('b'), served]) {
        if (dir) fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('update prompt appears', async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto(`${ORIGIN}/?tickMs=60000`);
      await expect(page.getByTestId('version')).toHaveText('build-a');
      await expect.poll(() => workerState(page)).toBe('activated');
      // An installed app that has been opened before: the page is run by the first build's
      // service worker.
      await page.reload();
      await expect
        .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
        .toBe(true);
      await expect(page.getByTestId('version')).toHaveText('build-a');
      await expect(page.getByTestId('notice-update')).toHaveCount(0);

      // The next deploy, found when the app looks for it.
      serve('b');
      await page.evaluate(async () => {
        await (await navigator.serviceWorker.ready).update();
      });
      const notice = page.getByTestId('notice-update');
      await expect(notice).toContainText('Update ready');
      await expect(page.getByTestId('version')).toHaveText('build-a');
      await notice.getByRole('button', { name: 'Reload' }).click();
      await expect(page.getByTestId('version')).toHaveText('build-b');
      await expect(page.getByTestId('notice-update')).toHaveCount(0);
    });
  });
});
