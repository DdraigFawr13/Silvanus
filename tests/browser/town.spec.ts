import { expect, test } from '@playwright/test';
import { advance, newGame } from '@silvanus/sim';
import type { Building, State } from '@silvanus/sim';
import { content, crowd, lot, readRecord, seedRecord, townRecord } from './helpers';

// The Town tab (J11), at the first target width. A minute per tick, so no tick falls inside a
// test and the texts it reads hold still.
test.use({ viewport: { width: 412, height: 915 } });

const sidewaysScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('the town tab shows stock and lots', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  await expect(page.getByRole('heading', { name: 'Ashwick' })).toBeVisible();
  await expect(page.getByTestId('date')).toHaveText('Year 1, season 1, day 1, hour 0');
  // an empty store says so in words as well as colour (M1 audit F17)
  await expect(page.getByTestId('stock').locator('.lab')).toHaveText([
    'Food',
    'Wood',
    'Stone · empty',
    'Ore · empty',
    'Tools · empty',
  ]);
  await expect(page.getByTestId('stock-food')).toHaveText('Food40 / 200');
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood60 / 200');
  await expect(page.getByTestId('stock-tools')).toHaveText('Tools · empty0 / 50');
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

  // cancelling the waiting job gives the wood back and frees the lot; the button names its job
  // and the panel says a cancel refunds (M1 audit F16)
  await expect(page.getByTestId('cancel-note')).toHaveText(
    'Cancelling a waiting job refunds its cost, up to what the stores hold.',
  );
  await page.getByTestId('queue').getByRole('button', { name: 'Cancel Mine', exact: true }).click();
  await expect(page.getByTestId('cancel-note')).toHaveCount(0);
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

test('a sheet keeps keyboard focus, closes on Escape and gives focus back', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  // the tabs say which one is shown
  await expect(page.getByRole('button', { name: 'Town' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'People' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  const opener = lot(page, "Forager's hut");
  await opener.focus();
  await page.keyboard.press('Enter');
  // the dialog is named by its title, and Close takes focus
  const dialog = page.getByRole('dialog', { name: "Forager's hut Tier 1" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  const inDialog = () =>
    page.evaluate(() => document.activeElement?.closest('[role=dialog]') !== null);
  // Tab and Shift+Tab go round the sheet's own controls and never reach the page behind it
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await inDialog()).toBe(true);
  }
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await inDialog()).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('text follows the root text size', async ({ page }) => {
  // the phone's text-size setting reaches the page through the root size (M1 audit F13)
  await page.goto('/?tickMs=60000');
  const label = page.getByTestId('stock-food').locator('.lab');
  const labelSize = () => label.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const before = await labelSize();
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await expect.poll(labelSize).toBe(before * 2);
  expect(await sidewaysScroll(page)).toBe(0);
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

// A finished building added to a new town's state, as the engine would have left it.
function withBuilt(
  kind: string,
  method: string | null,
  open: number,
  extra: Partial<Building> = {},
): Partial<State> {
  const start = newGame(1, content);
  const building: Building = {
    id: start.nextId,
    kind,
    tier: 1,
    method,
    open,
    retoolLeft: 0,
    carry: {},
    debt: {},
    short: false,
    owned: content.methods
      .filter((m) => m.building === kind && (Object.keys(m.cost).length === 0 || m.id === method))
      .map((m) => m.id),
    ...extra,
  };
  return { buildings: [...start.buildings, building], nextId: start.nextId + 1, jobsDirty: true };
}

test('switching a method asks first, then retools', async ({ page }) => {
  await seedRecord(page, townRecord({ state: withBuilt('mine', 'ore', 4) }));
  await page.goto('/?tickMs=60000');
  await lot(page, 'Mine').click();
  const sheet = page.getByTestId('building-sheet');
  await expect(sheet.getByTestId('method-ore')).toContainText('Dig ore');
  await expect(sheet.getByTestId('method-ore')).toContainText('Makes 1.8 ore');
  await expect(sheet.getByTestId('method-ore')).toContainText('In use');
  await expect(sheet.getByTestId('method-shafts')).toContainText('Makes 3.3 ore · Uses 0.6 wood');
  await expect(sheet.getByTestId('method-shafts')).toContainText('Tier 2');
  await expect(sheet.getByTestId('method-shafts').getByRole('button')).toHaveCount(0);
  await expect(sheet.getByTestId('method-cutstone')).toContainText('Uses 0.2 tools');
  await expect(sheet.getByTestId('method-cutstone')).toContainText('Costs 30 wood, 10 tools');

  // Switch asks in the sheet; Keep changes nothing
  await sheet.getByTestId('method-stone').getByRole('button', { name: 'Switch' }).click();
  const confirm = sheet.getByTestId('method-confirm');
  await expect(confirm).toContainText(
    'Switch the Mine to Quarry stone? It makes nothing for 4 game hours while it retools.',
  );
  await confirm.getByRole('button', { name: 'Keep Dig ore' }).click();
  await expect(confirm).toHaveCount(0);
  await expect(sheet.getByTestId('method-ore')).toContainText('In use');

  await sheet.getByTestId('method-stone').getByRole('button', { name: 'Switch' }).click();
  await confirm.getByRole('button', { name: 'Switch' }).click();
  await expect(sheet.getByTestId('method-stone')).toContainText('In use');
  await expect(sheet).toContainText('Retooling, 4 game hours left');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(lot(page, 'Mine')).toContainText('Quarry stone · Retooling, 4 game hours left');
  type Stored = { state: { buildings: { kind: string; method: string }[] } } | undefined;
  // hiding the page saves it, with the new method
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(
      async () =>
        ((await readRecord(page)) as Stored)?.state.buildings.find((b) => b.kind === 'mine')
          ?.method,
    )
    .toBe('stone');
});

test('away summary after catch-up', async ({ page }) => {
  // A Workshop on Forge tools with no ore, and a camp 6 game hours from done, closed 100 game hours
  const start = newGame(1, content);
  const camp = start.nextId + 1;
  const built = withBuilt('workshop', 'forge', 1);
  const state: Partial<State> = {
    ...built,
    buildings: [
      ...built.buildings!,
      {
        id: camp,
        kind: 'woodcutter',
        tier: 0,
        method: 'axes',
        open: 0,
        retoolLeft: 0,
        carry: {},
        debt: {},
        short: false,
        owned: ['axes'],
      },
    ],
    nextId: camp + 1,
    queue: [{ target: camp, toTier: 1, ticksLeft: 6, cost: {} }],
    stock: { food: 120, wood: 40, stone: 10, ore: 0, tools: 0 },
  };
  await seedRecord(page, townRecord({ state, anchorMs: Date.now() - 100 * 60_000 }));
  await page.goto('/?tickMs=60000');
  const card = page.getByTestId('away');
  await expect(card).toContainText('While you were away');
  await expect(card).toContainText('4 game days, 4 game hours passed.');
  // every resource made, with its amount, in content order, as the engine counts it (J13)
  const record = townRecord({ state });
  const made = advance(record.state, 100, content).summary.made;
  const expected = content.resources
    .filter((r) => (made[r.id] ?? 0) > 0)
    .map((r) => `${made[r.id]} ${r.name.toLowerCase()}`)
    .join(', ');
  expect(expected).toContain('tools');
  await expect(card.getByTestId('away-made')).toHaveText(expected);
  await expect(card.getByTestId('away-finished')).toHaveText("Woodcutter's camp, tier 1");
  await expect(card.getByTestId('away-short')).toHaveText(
    'Workshop, for 4 game days, 4 game hours',
  );
  await expect(lot(page, 'Workshop')).toContainText('Forge tools · Short: Mend and make do');
  await expect(page.getByTestId('log')).toContainText(
    'The Workshop ran short of ore and fell back to Mend and make do.',
  );
  expect(await sidewaysScroll(page)).toBe(0);
  await card.getByRole('button', { name: 'Dismiss' }).click();
  await expect(card).toHaveCount(0);
});

test('buying a method pays once and is kept', async ({ page }) => {
  const stock = { food: 40, wood: 46, stone: 14, ore: 18, tools: 0 };
  await seedRecord(page, townRecord({ state: { ...withBuilt('workshop', 'mend', 2), stock } }));
  await page.goto('/?tickMs=60000');
  await lot(page, 'Workshop').click();
  const sheet = page.getByTestId('building-sheet');
  const forge = sheet.getByTestId('method-forge');
  await expect(forge).toContainText('Costs 20 wood, 10 stone');
  await forge.getByRole('button', { name: 'Buy' }).click();
  await expect(sheet.getByTestId('method-confirm')).toContainText(
    'Buy Forge tools for the Workshop for 20 wood, 10 stone? It makes nothing for 1 game day while it is set up. After that the Workshop owns it: switching to it is free and takes 4 game hours.',
  );
  await sheet.getByRole('button', { name: 'Buy and switch' }).click();
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood26 / 200');
  await expect(page.getByTestId('stock-stone')).toHaveText('Stone4 / 200');
  await expect(forge).toContainText('In use, retooling');
  await expect(sheet).toContainText('Retooling, 1 game day left');
  await expect(sheet.getByTestId('method-mend')).toContainText('Owned');
  await expect(sheet).toContainText('Removes the building and the methods it bought.');
  // switching back is free
  await sheet.getByTestId('method-mend').getByRole('button', { name: 'Switch' }).click();
  await sheet.getByTestId('method-confirm').getByRole('button', { name: 'Switch' }).click();
  await expect(sheet.getByTestId('method-mend')).toContainText('In use, retooling');
  await expect(forge).toContainText('Owned');
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood26 / 200');
});

const VILLAGE_COST = { wood: 180, stone: 180, tools: 45 };

test('the Hall row offers the Village when it can be paid for', async ({ page }) => {
  // a new Hamlet: 8 residents and 60 wood, so both are missing
  await page.goto('/?tickMs=60000');
  const hall = page.getByTestId('hall');
  await expect(hall.getByTestId('village')).toBeDisabled();
  await expect(hall.getByTestId('village-why')).toHaveText([
    'Needs 20 residents',
    'Needs 120 wood, 180 stone, 45 tools',
  ]);

  // 20 residents and the stock: it can be upgraded, after asking
  const start = newGame(1, content);
  const state = { ...crowd(start, 20), stock: { ...start.stock, ...VILLAGE_COST } };
  await seedRecord(page, townRecord({ state }));
  await page.goto('/?tickMs=60000');
  await expect(hall).toContainText('Residents 20 / 25');
  await expect(hall.getByTestId('village-why')).toHaveCount(0);
  await hall.getByTestId('village').click();
  await expect(hall.getByTestId('village-confirm')).toContainText('180 wood, 180 stone, 45 tools');
  await hall.getByRole('button', { name: 'Not yet' }).click();
  await expect(hall.getByTestId('village-confirm')).toHaveCount(0);
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood180 / 200');
  await hall.getByTestId('village').click();
  await hall.getByRole('button', { name: 'Upgrade', exact: true }).click();
  await expect(hall).toContainText('Upgrading to Village, 4 game days left');
  await expect(hall.getByTestId('village')).toHaveCount(0);
  await expect(page.getByTestId('queue')).toContainText('The Hall to Village');
  await expect(page.getByTestId('stock-wood')).toHaveText('Wood · empty0 / 200');
  await expect(page.getByTestId('stock-tools')).toHaveText('Tools · empty0 / 50');
  expect(await sidewaysScroll(page)).toBe(0);
});

test('a Village catches up two nights', async ({ page }) => {
  // closed 3,000 game hours: a Hamlet would catch up 1,920 of them, a Village 3,840
  const start = newGame(1, content);
  const state = { ...crowd(start, 20), hallTier: 2 };
  await seedRecord(page, townRecord({ state, anchorMs: Date.now() - 3_000 * 60_000 }));
  await page.goto('/?tickMs=60000');
  await expect(page.getByText('Village', { exact: true })).toBeVisible();
  await expect(page.getByTestId('away')).toContainText('125 game days passed.');
});

test('the away card names who arrived', async ({ page }) => {
  // 9 residents, one of them miserable, a second Cottage, food, and the Hall 5 game hours from
  // the Village; closed 40 game hours (the away card shows from 40), so one game day begins
  const start = newGame(1, content);
  const crowded = crowd(start, 9);
  const second = withBuilt('cottage', null, 0);
  const state: State = {
    ...start,
    ...crowded,
    buildings: second.buildings!,
    nextId: crowded.nextId! + 1,
    residents: crowded.residents!.map((r) => (r.id === 1 ? { ...r, morale: 0 } : r)),
    queue: [{ target: 'hall', toTier: 2, ticksLeft: 5, cost: {} }],
    stock: { ...start.stock, food: 100 },
  };
  state.buildings[2] = { ...state.buildings[2], id: crowded.nextId! };
  // what the engine makes of it, read here rather than guessed
  const away = advance(state, 40, content).summary;
  const sad = state.residents.find((r) => r.id === 1)!.name;
  expect(away.left).toEqual([sad]);
  expect(away.arrived).toHaveLength(1);
  await seedRecord(page, townRecord({ state, anchorMs: Date.now() - 40 * 60_000 }));
  await page.goto('/?tickMs=60000');
  const card = page.getByTestId('away');
  await expect(card.getByTestId('away-arrived')).toHaveText(away.arrived[0]);
  await expect(card.getByTestId('away-left')).toHaveText(sad);
  await expect(card.getByTestId('away-finished')).toHaveText('The Hall: now a Village');
  await expect(page.getByTestId('log')).toContainText(`${away.arrived[0]}, a `);
  expect(await sidewaysScroll(page)).toBe(0);
});
