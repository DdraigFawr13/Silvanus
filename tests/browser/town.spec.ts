import { expect, test } from '@playwright/test';
import { lot, readRecord } from './helpers';

// The Town tab (J11), at the first target width. A minute per tick, so no tick falls inside a
// test and the texts it reads hold still.
test.use({ viewport: { width: 412, height: 915 } });

const sidewaysScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('the town tab shows stock and lots', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  await expect(page.getByRole('heading', { name: 'Ashwick' })).toBeVisible();
  await expect(page.getByTestId('date')).toHaveText('Year 1, season 1, day 1, hour 0');
  await expect(page.getByTestId('stock').locator('.lab')).toHaveText([
    'Food',
    'Wood',
    'Stone',
    'Ore',
    'Tools',
  ]);
  await expect(page.getByTestId('stock-food')).toHaveText('Food40 / 200');
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood60 / 200');
  await expect(page.getByTestId('stock-tools')).toHaveText('Tools0 / 50');
  await expect(page.getByTestId('hall')).toContainText('Residents 8 / 25');
  const lots = page.getByTestId('lot');
  await expect(lots).toHaveCount(6);
  await expect(lots.nth(0)).toContainText('Cottage');
  await expect(lots.nth(1)).toContainText("Forager's hut");
  await expect(lots.nth(1)).toContainText('Gather · Workers 4 / 4');
  await expect(lots.filter({ hasText: 'Empty lot' })).toHaveCount(4);
  await expect(page.getByTestId('queue')).toHaveText('Nothing is being built.');
  await expect(page.getByTestId('log')).toHaveText('Nothing has happened yet.');
  expect(await sidewaysScroll(page)).toBe(0);
  // and at the second width
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(lots).toHaveCount(6);
  expect(await sidewaysScroll(page)).toBe(0);
});

test('building from an open lot', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  const empty = page.getByTestId('lot').filter({ hasText: 'Empty lot' });
  await empty.first().click();
  const sheet = page.getByTestId('build-sheet');
  // what cannot be paid for is off, and says what is missing
  await expect(sheet.getByTestId('build-farm')).toBeDisabled();
  await expect(sheet.getByTestId('build-farm')).toContainText('Needs 5 tools');
  await expect(sheet.getByTestId('build-woodcutter')).toContainText('Free: the town has none');
  await sheet.getByTestId('build-woodcutter').click();
  await expect(sheet).toHaveCount(0);
  await expect(lot(page, "Woodcutter's camp")).toContainText('Building, 8 game hours left');
  // the town's first camp is free
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood60 / 200');
  await expect(empty).toHaveCount(3);

  await empty.first().click();
  // a second camp has its price
  await expect(sheet.getByTestId('build-woodcutter')).toContainText('25 wood');
  await sheet.getByTestId('build-mine').click();
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood20 / 200');
  await expect(lot(page, 'Mine')).toContainText('Waiting in the work queue');
  await expect(page.getByTestId('queue')).toContainText('Waiting, takes 1 game day');

  // cancelling the waiting job gives the wood back and frees the lot
  await page.getByTestId('queue').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood60 / 200');
  await expect(lot(page, 'Mine')).toHaveCount(0);
  await expect(empty).toHaveCount(3);
});

test('the building sheet sets open slots and clears a lot after asking', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  await lot(page, "Forager's hut").click();
  const sheet = page.getByTestId('building-sheet');
  await expect(sheet.getByRole('heading', { name: "Forager's hut Tier 1" })).toBeVisible();
  await expect(sheet.getByTestId('sheet-workers')).toHaveText('Workers 4 / 4');
  await expect(sheet.getByRole('button', { name: 'More open slots' })).toBeDisabled();
  await sheet.getByRole('button', { name: 'Fewer open slots' }).click();
  await expect(sheet.getByTestId('open-slots')).toHaveText('3');
  await expect(sheet.getByTestId('sheet-workers')).toHaveText('Workers 3 / 3');
  // the upgrade is off and says what is missing
  await expect(sheet.getByTestId('upgrade')).toBeDisabled();
  await expect(sheet).toContainText('Needs 5 tools');

  // clearing asks in the sheet; "Keep it" changes nothing
  await sheet.getByTestId('clear').click();
  await expect(sheet.getByTestId('clear-confirm')).toContainText(
    "Clear the Forager's hut? Nothing is refunded and its 3 workers lose their jobs.",
  );
  await sheet.getByRole('button', { name: 'Keep it' }).click();
  await expect(sheet.getByTestId('clear-confirm')).toHaveCount(0);
  await expect(lot(page, "Forager's hut")).toHaveCount(1);
  await sheet.getByTestId('clear').click();
  await sheet.getByTestId('clear-yes').click();
  await expect(sheet).toHaveCount(0);
  await expect(lot(page, "Forager's hut")).toHaveCount(0);
  await expect(page.getByTestId('lot').filter({ hasText: 'Empty lot' })).toHaveCount(5);
  await expect(page.getByTestId('log')).toContainText(
    "The Forager's hut was cleared from its lot.",
  );
});

test('a build finishes, works and is kept', async ({ page }) => {
  await page.goto('/?tickMs=50');
  await page.getByTestId('lot').filter({ hasText: 'Empty lot' }).first().click();
  await page.getByTestId('build-sheet').getByTestId('build-woodcutter').click();
  // 8 game hours later the camp is built and the four idle residents work in it
  await expect(lot(page, "Woodcutter's camp")).toContainText('Hand axes · Workers 4 / 4');
  await expect(page.getByTestId('log')).toContainText("The Woodcutter's camp is built.");
  // it makes wood: the store rises past its starting 60
  await expect
    .poll(async () =>
      Number((await page.getByTestId('stock-wood').innerText()).match(/(\d+) \//)?.[1]),
    )
    .toBeGreaterThan(60);
  // and the town is stored with the camp in it
  type Stored = { state: { buildings: { kind: string; tier: number }[] } } | undefined;
  await expect
    .poll(async () =>
      ((await readRecord(page)) as Stored)?.state.buildings.some(
        (b) => b.kind === 'woodcutter' && b.tier === 1,
      ),
    )
    .toBe(true);
});
