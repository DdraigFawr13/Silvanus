import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import type http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { apply } from '@silvanus/sim';
import type { Command } from '@silvanus/sim';
import {
  HUT,
  content,
  lot,
  readRecord,
  savedTick,
  seedRecord,
  serveFolder,
  tick,
  townRecord,
} from './helpers';

// The state of the page's active service worker, or null while there is none.
const workerState = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.state ?? null;
  });

// Opens the hut's sheet and taps its stepper until it shows `to`. Each tap sends the count the
// sheet shows, so the next tap waits for the sheet to show the last one's answer.
const openSlots = async (page: Page, change: 'Fewer' | 'More', to: number) => {
  await lot(page, "Forager's hut").click();
  const shown = page.getByTestId('open-slots');
  for (let n = Number(await shown.innerText()); n !== to; n += change === 'More' ? 1 : -1) {
    await page.getByRole('button', { name: `${change} open slots` }).click();
    await expect(shown).toHaveText(String(n + (change === 'More' ? 1 : -1)));
  }
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByTestId('building-sheet')).toHaveCount(0);
};

test('reload keeps the town', async ({ page }) => {
  await page.goto('/?tickMs=200');
  await expect.poll(() => tick(page)).toBeGreaterThanOrEqual(20);
  await openSlots(page, 'Fewer', 2);
  await expect(lot(page, "Forager's hut")).toContainText('Workers 2 / 2');
  const t = await tick(page);
  // A save made after the taps: one at exactly `t` could be older than them.
  await expect.poll(() => savedTick(page)).toBeGreaterThan(t);

  await page.goto('/?tickMs=60000');
  // A town that was not kept would show Workers 4 / 4 and hour 0.
  await expect(lot(page, "Forager's hut")).toContainText('Workers 2 / 2');
  const after = await tick(page);
  expect(after).toBeGreaterThanOrEqual(t);
  expect(after).toBeLessThanOrEqual(t + 50);
});

// A town with its hut closed, so food cannot move between game days.
const closed: Command[] = [{ type: 'setOpen', buildingId: HUT, count: 0 }];

test('five minutes closed is caught up as 5 ticks', async ({ page }) => {
  // A town last true 5 minutes and 20 seconds ago. No game day starts between ticks 100 and 105.
  const record = townRecord({
    anchorMs: Date.now() - 320_000,
    commands: closed,
    state: { tick: 100 },
  });
  await seedRecord(page, record);
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '105');
  await expect(page.getByTestId('date')).toHaveText('Year 1, season 1, day 5, hour 9');
  await expect(page.getByTestId('stock-food')).toHaveText('Food40 / 200');
  // the catch-up is saved once, at its end: the stored tick rose by 5
  await expect(page.getByTestId('saved-at')).toHaveAttribute('data-tick', '105');
  const stored = (await readRecord(page)) as { state: { tick: number } };
  expect(stored.state.tick).toBe(105);
});

test('unreadable save shows the refusal', async ({ page }) => {
  const record = { schema: 3, anchorMs: 1_700_000_000_000, town: { name: 'a later shape' } };
  await seedRecord(page, record);

  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('notice')).toHaveText(
    'This save is from a newer version of the game.',
  );
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  await expect(page.getByTestId('date')).toHaveCount(0);

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
  await expect(page.getByTestId('date')).toBeVisible();
  const second = await context.newPage();
  await second.goto('/?tickMs=60000');
  await expect(second.getByTestId('notice')).toHaveText('Silvanus is open in another window.');
  await expect(second.getByTestId('date')).toHaveCount(0);
  // the first window still runs the town
  await expect(page.getByTestId('date')).toBeVisible();
  await expect(page.getByTestId('notice')).toHaveCount(0);
});

// A save file as Export writes it: another town (seed 5) with food 77. The anchor is 40 hours
// old, which would be a full catch-up.
const fileRecord = () =>
  townRecord({
    seed: 5,
    anchorMs: Date.now() - 40 * 3_600_000,
    state: { tick: 388, stock: { food: 77, wood: 60, stone: 0, ore: 0, tools: 0 } },
  });
const saveFile = (text: string) => ({
  name: 'silvanus-save.json',
  mimeType: 'application/json',
  buffer: Buffer.from(text),
});
const goodFile = () => saveFile(JSON.stringify(fileRecord()));

test('export and import carry the town', async ({ page }) => {
  const startedMs = Date.now();
  const seeded = townRecord({ commands: closed, state: { tick: 512 } });
  await seedRecord(page, seeded);
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '512');

  // Export gives the town as it stands, the tap just made included.
  await openSlots(page, 'More', 1);
  await expect(lot(page, "Forager's hut")).toContainText('Workers 1 / 1');
  const tapped = apply(seeded.state, [{ type: 'setOpen', buildingId: HUT, count: 1 }], content);
  const download = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('silvanus-save-512.json');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(exported.schema).toBe(2);
  expect(exported.state).toEqual(tapped.state);

  // A file that is not a save is refused with a message and changes nothing.
  await page.getByTestId('import-file').setInputFiles(saveFile('{ "town": '));
  await expect(page.getByTestId('notice')).toHaveText('This file is not a Silvanus save.');
  await expect(page.getByTestId('import-confirm')).toHaveCount(0);
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '512');

  // Cancel, by keyboard, keeps the town.
  await page.getByTestId('import-file').setInputFiles(goodFile());
  await expect(page.getByTestId('import-confirm')).toContainText(
    'Replace this town with the one saved at year 1, season 3, day 3, hour 4?',
  );
  await expect(page.getByTestId('notice')).toHaveCount(0);
  await page.getByTestId('cancel').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('import-confirm')).toHaveCount(0);
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '512');
  await expect(lot(page, "Forager's hut")).toContainText('Workers 1 / 1');

  // Replace loads the file's town, saves it, and catches nothing up.
  await page.getByTestId('import-file').setInputFiles(goodFile());
  await page.getByTestId('replace').click();
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '388');
  await expect(lot(page, "Forager's hut")).toContainText('Workers 4 / 4');
  await expect(page.getByTestId('stock-food')).toHaveText('Food77 / 200');
  await expect(page.getByTestId('saved-at')).toHaveAttribute('data-tick', '388');
  await expect(page.getByTestId('import-confirm')).toHaveCount(0);
  // The stored anchor is the time of import, not the file's, so no catch-up is owed.
  const stored = (await readRecord(page)) as { anchorMs: number };
  expect(stored.anchorMs).toBeGreaterThanOrEqual(startedMs);
  // the town the import replaced is kept under `previous`, with the tap made before the export
  const previous = (await readRecord(page, 'previous')) as { state: unknown };
  expect(previous.state).toEqual(tapped.state);

  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '388');
  await expect(page.getByTestId('stock-food')).toHaveText('Food77 / 200');
});

test('an import replaces an unreadable save', async ({ page }) => {
  const record = { schema: 3, anchorMs: 1_700_000_000_000, town: { name: 'a later shape' } };
  await seedRecord(page, record);
  await page.goto('/?tickMs=60000');
  await expect(page.getByTestId('notice')).toHaveText(
    'This save is from a newer version of the game.',
  );

  await page.getByTestId('import-file').setInputFiles(goodFile());
  await expect(page.getByTestId('import-confirm')).toContainText(
    'Replace the unreadable save with the one saved at year 1, season 3, day 3, hour 4?',
  );
  // Nothing is written until Replace.
  expect(await readRecord(page)).toEqual(record);
  await page.getByTestId('replace').click();
  await expect(page.getByTestId('date')).toHaveAttribute('data-tick', '388');
  await expect(page.getByTestId('saved-at')).toHaveAttribute('data-tick', '388');
  await expect(page.getByTestId('notice')).toHaveCount(0);
  const stored = (await readRecord(page)) as { schema: number; state: unknown };
  expect(stored.schema).toBe(2);
  expect(stored.state).toEqual(fileRecord().state);
  // the record the import replaced is kept beside it
  expect(await readRecord(page, 'previous')).toEqual(record);
});

test('an M0 save opens as a new town and is kept', async ({ page }) => {
  const old = {
    schema: 1,
    anchorMs: Date.now() - 3_600_000,
    state: {
      contentVersion: 1,
      seed: 1,
      tick: 512,
      rng: { yield: 12345 },
      stock: { food: 9 },
      foragers: 2,
      residents: [],
    },
  };
  await seedRecord(page, old);
  await page.goto('/?tickMs=60000');
  // a new town at hour 0, not a catch-up of the old counter
  await expect(page.getByTestId('date')).toHaveText('Year 1, season 1, day 1, hour 0');
  await expect(page.getByTestId('lot')).toHaveCount(6);
  await expect(page.getByTestId('saved-at')).toHaveAttribute('data-tick', '0');
  const stored = (await readRecord(page)) as { schema: number; state: unknown };
  expect(stored.schema).toBe(2);
  expect(stored.state).toEqual(townRecord().state);
  expect(await readRecord(page, 'previous')).toEqual(old);
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
  await expect(lot(page, "Forager's hut")).toContainText('Workers 4 / 4');
  await openSlots(page, 'Fewer', 3);
  await expect(lot(page, "Forager's hut")).toContainText('Workers 3 / 3');
  expect(await readRecord(page)).toBeUndefined();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  type Stored = { state: { buildings: { id: number; open: number }[] } } | undefined;
  await expect
    .poll(
      async () =>
        ((await readRecord(page)) as Stored)?.state.buildings.find((b) => b.id === HUT)?.open,
    )
    .toBe(3);
});

test('a failed save is shown', async ({ page }) => {
  await page.goto('/?tickMs=50');
  await expect.poll(() => savedTick(page)).toBeGreaterThan(0);
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
  const stuck = await savedTick(page);
  expect(await tick(page)).toBeGreaterThan(stuck);
  // The next save that lands clears the notice.
  await page.evaluate(() => {
    const w = window as unknown as Record<string, never>;
    IDBDatabase.prototype.transaction = w.realTransaction;
    IDBFactory.prototype.open = w.realOpen;
  });
  await expect(page.getByTestId('notice-saveFailed')).toHaveCount(0);
  await expect.poll(() => savedTick(page)).toBeGreaterThan(stuck);
});

test.describe('installed', () => {
  // Every other test runs with service workers blocked, so `page.route` sees each request.
  test.use({ serviceWorkers: 'allow' });

  test('starts with no network', async ({ page, context }) => {
    await page.goto('/?tickMs=60000');
    await expect(page.getByTestId('date')).toBeVisible();
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
    await expect(page.getByTestId('date')).toBeVisible();
    await expect(page.getByTestId('version')).not.toBeEmpty();
    // the fonts ship inside the app (D-003): the town's name is drawn in its face with no network
    await expect
      .poll(() => page.evaluate(() => document.fonts.check("700 26px 'Alegreya SC'")))
      .toBe(true);
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
