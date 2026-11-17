import { expect, test } from '@playwright/test';
import { advance, newGame } from '@silvanus/sim';
import { content, seedRecord, townRecord } from './helpers';

// The board on the Town tab (M2e J8), at the first target width. A minute per tick, so nothing
// moves while the test reads.
test.use({ viewport: { width: 412, height: 915 } });

// Seed 1 after 25 ticks, its board set by hand: none of the three is met there (no Mine, 8
// residents, and Lay in timber counts only what is made after the pick).
function town() {
  const state = advance(newGame(1, content), 25, content).state;
  const board = { ...state.board, goals: ['stockpile', 'quarry', 'twelve'], active: null };
  return townRecord({ state: { ...state, board } });
}

test('the board offers three goals', async ({ page }) => {
  await seedRecord(page, town());
  await page.goto('/?tickMs=60000');
  const board = page.getByTestId('board');
  await expect(page.locator('h2.sec').filter({ hasText: 'Board' })).toBeVisible();
  // after the Hall and before the work queue
  const top = async (locator: ReturnType<typeof page.getByTestId>) =>
    (await locator.boundingBox())!.y;
  expect(await top(board)).toBeGreaterThan(await top(page.getByTestId('hall')));
  expect(await top(board)).toBeLessThan(await top(page.getByTestId('queue')));

  const goals = board.getByTestId('goal');
  await expect(goals).toHaveCount(3);
  await expect(goals.filter({ hasText: 'Lay in timber' })).toContainText('Make 80 wood');
  await expect(goals.filter({ hasText: 'Open the quarry' })).toContainText('Build a Mine');
  await expect(goals.filter({ hasText: 'Twelve hearths' })).toContainText('12 residents');
  for (let i = 0; i < 3; i++) {
    await expect(goals.nth(i)).toContainText('Goal');
    await expect(goals.nth(i)).toContainText(/Worth about \d+ \w+/);
    await expect(goals.nth(i).getByRole('button')).toHaveText('Pick');
  }

  const timber = goals.filter({ hasText: 'Lay in timber' });
  await timber.getByRole('button', { name: 'Pick Lay in timber' }).click();
  await expect(timber.getByTestId('goal-progress')).toHaveText('0 of 80 wood');
  await expect(timber.getByRole('button')).toHaveCount(0);
  for (const name of ['Open the quarry', 'Twelve hearths']) {
    await expect(goals.filter({ hasText: name }).getByRole('button')).toHaveText('Pick instead');
  }
  // no sideways scroll at 412 px
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(wide).toBeLessThanOrEqual(412);
});

test("the trader's offer", async ({ page }) => {
  const record = town();
  const board = record.state.board;
  // wood 60: the wood swap can be paid, the stone one cannot (no stone yet)
  const offers = [
    {
      id: 1,
      give: { resource: 'wood', amount: 40 },
      get: { resource: 'tools', amount: 13 },
      until: 2172,
    },
    {
      id: 2,
      give: { resource: 'stone', amount: 40 },
      get: { resource: 'food', amount: 50 },
      until: 2412,
    },
  ];
  record.state.board = { ...board, offers, nextOfferId: 3, nextOfferTick: 252 };
  expect(record.state.stock.wood).toBe(60);
  expect(record.state.stock.stone).toBe(0);
  await seedRecord(page, record);
  await page.goto('/?tickMs=60000');
  const cards = page.getByTestId('offer');
  await expect(cards).toHaveCount(2);
  const tools = cards.filter({ hasText: '13 tools for 40 wood' });
  const food = cards.filter({ hasText: '50 food for 40 stone' });
  await expect(tools).toContainText('Trader');
  await expect(tools).toContainText(`Leaves in `);
  await expect(tools.getByRole('button', { name: /^Accept/ })).toHaveClass('btn');
  await expect(food.getByRole('button', { name: /^Accept/ })).toHaveClass('btn second');
  await expect(food).toContainText('Needs 40 stone');

  await tools.getByRole('button', { name: /^Accept/ }).click();
  await expect(cards).toHaveCount(1);
  await expect(page.getByTestId('stock-wood').locator('.num')).toHaveText('20 / 200');
  await expect(page.getByTestId('delivery')).toContainText('13 tools on the way, 1 game day left');

  await food.getByRole('button', { name: /^Decline/ }).click();
  await expect(cards).toHaveCount(0);
  await expect(page.getByTestId('stock-stone').locator('.num')).toHaveText('0 / 200');
});

test('sending a trip', async ({ page }) => {
  const record = town();
  const residents = record.state.residents;
  await seedRecord(page, record);
  await page.goto('/?tickMs=60000');
  const card = page.getByTestId('trip');
  await expect(card).toContainText('Send two to the forest edge for a day');
  await card.getByRole('button', { name: 'Send two' }).click();
  const sheet = page.getByTestId('trip-sheet');
  const picks = sheet.getByTestId('trip-pick');
  await expect(picks).toHaveCount(residents.length);
  // those with no work first
  const idle = residents.filter((r) => r.jobId === null).length;
  for (let i = 0; i < idle; i++) await expect(picks.nth(i)).toContainText('No work');
  const send = sheet.getByRole('button', { name: 'Send', exact: true });
  await expect(send).toBeDisabled();
  const [a, b, c] = [0, 1, 2].map((i) => picks.nth(i));
  const name = async (pick: typeof a) => (await pick.locator('.trip-name').textContent())!;
  const [na, nb] = [await name(a), await name(b)];
  await a.click();
  await expect(send).toBeDisabled();
  await b.click();
  await expect(send).toBeEnabled();
  await expect(sheet.getByTestId('trip-chosen')).toHaveText(`${na} and ${nb}`);
  await c.click();
  await expect(send).toBeDisabled();
  await c.click();
  await expect(a).toHaveAttribute('aria-checked', 'true');
  await send.click();
  await expect(sheet).toHaveCount(0);
  await expect(card).toContainText(`${na} and ${nb} are out at the forest edge, 1 game day left`);
  await page.getByTestId('tab-people').click();
  for (const n of [na, nb]) {
    await expect(page.getByTestId('person').filter({ hasText: n })).toContainText('On a trip');
  }
});
