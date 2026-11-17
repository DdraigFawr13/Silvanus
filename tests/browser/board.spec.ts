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
