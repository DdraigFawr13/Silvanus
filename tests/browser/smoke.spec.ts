import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const number = async (page: Page, id: string) => Number(await page.getByTestId(id).innerText());

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

// Stores a record before the app ever runs, from an empty page on the app's origin.
async function seedRecord(page: Page, record: unknown) {
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

const readRecord = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('silvanus-test', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const get = db.transaction('saves', 'readonly').objectStore('saves').get('main');
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
          get.onerror = () => reject(get.error);
        };
      }),
  );

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
