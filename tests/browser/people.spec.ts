import { expect, test } from '@playwright/test';
import { advance, apply, newGame, plotsFor } from '@silvanus/sim';
import { content, seedRecord, townRecord } from './helpers';

// The People tab (J12), at the first target width. A minute per tick, so the texts read hold
// still.
test.use({ viewport: { width: 412, height: 915 } });

// Seed 1 one hour into its second game day: the first day's morale reasons are stored. Four
// forage and four have no job. Names, skills and traits are read from this state, not written
// out, so a change to how residents are drawn does not break the tests (M1 audit F4).
const dayOne = () => advance(newGame(1, content), 25, content).state;

test('people list, filter and sheet', async ({ page }) => {
  await seedRecord(page, townRecord({ state: dayOne() }));
  await page.goto('/?tickMs=60000');
  await page.getByTestId('tab-people').click();
  const rows = page.getByTestId('person');
  await expect(rows).toHaveCount(8);
  await expect(rows.filter({ hasText: 'Forager' })).toHaveCount(4);
  await expect(rows.filter({ hasText: 'No work' })).toHaveCount(4);
  // every row has a morale number
  for (let i = 0; i < 8; i++) await expect(rows.nth(i).getByTestId('morale')).toHaveText(/^\d+$/);

  await page.getByTestId('chip-idle').click();
  await expect(rows).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(rows.nth(i)).toContainText('No work');
  await page.getByTestId('chip-all').click();
  await expect(rows).toHaveCount(8);

  // sorted by name by default
  const town = dayOne();
  const first = town.residents.map((r) => r.name).sort((a, b) => a.localeCompare(b))[0];
  await expect(rows.first()).toContainText(first);
  // the idle resident with the lowest id
  const idle = town.residents.find((r) => r.jobId === null)!;
  await rows.filter({ hasText: idle.name }).click();
  const sheet = page.getByTestId('resident-sheet');
  await expect(sheet).toContainText(idle.name);
  await expect(sheet.getByTestId('skill')).toHaveText(
    content.skills.map((skill) => `${skill.name}${idle.skills[skill.id]}`),
  );
  await expect(sheet.getByTestId('trait')).toHaveText(
    idle.traits.map((id) => new RegExp(`^${content.traits.find((t) => t.id === id)!.name}Likes`)),
  );
  await expect(sheet.getByTestId('reason')).toHaveText(['Food+10', 'No work−10']);
  await expect(sheet.getByTestId('resident-job')).toHaveText('No work');
});

test('pinning shows its cost', async ({ page }) => {
  // a Mine finished at tick 24; the day's jobs pass filled it with the four who had no job
  let start = newGame(1, content);
  start = { ...start, stock: { ...start.stock, wood: 100 } };
  const plot = plotsFor(start, 'mine', content)[0].id;
  const built = apply(start, [{ type: 'build', kind: 'mine', plot }], content).state;
  await seedRecord(page, townRecord({ state: advance(built, 25, content).state }));
  await page.goto('/?tickMs=60000');
  await page.getByTestId('tab-people').click();
  await page.getByTestId('person').filter({ hasText: 'Mairoc' }).click();
  const sheet = page.getByTestId('resident-sheet');
  await expect(sheet.getByTestId('resident-job')).toHaveText("Forager at the Forager's hut");

  // Mairoc is Sociable, which dislikes a Mine: the cost is shown before anything is sent
  await sheet.getByTestId('pin-to').click();
  const mine = sheet.getByTestId('pin-choice').filter({ hasText: 'Mine' });
  await expect(mine).toContainText('Dislikes the work −10');
  await mine.click();
  const confirm = sheet.getByTestId('pin-confirm');
  await expect(confirm).toContainText('Pin Mairoc to the Mine?');
  await expect(confirm).toContainText('Dislikes the work−10');
  await expect(confirm).toContainText('From this work−10');
  await expect(sheet.getByTestId('resident-job')).toHaveText("Forager at the Forager's hut");
  await confirm.getByTestId('pin').click();

  // the job after: pinned residents are placed first
  await expect(sheet.getByTestId('resident-job')).toHaveText('Miner at the Mine');
  await expect(sheet.getByTestId('resident-pin')).toHaveText('Pinned to the Mine');
  await expect(page.getByTestId('person').filter({ hasText: 'Mairoc' })).toContainText('Miner');
  // and it can be taken back
  await sheet.getByTestId('unpin').click();
  await expect(sheet.getByTestId('resident-pin')).toHaveText('Not pinned');
});

test('pinned residents are labelled and filtered', async ({ page }) => {
  const town = dayOne();
  const hut = town.buildings.find((b) => b.kind === 'forager')!.id;
  const pinned = town.residents.find((r) => r.jobId === hut)!;
  const state = apply(town, [{ type: 'pin', residentId: pinned.id, buildingId: hut }], content);
  await seedRecord(page, townRecord({ state: state.state }));
  await page.goto('/?tickMs=60000');
  await page.getByTestId('tab-people').click();
  const rows = page.getByTestId('person');
  const row = rows.filter({ hasText: pinned.name });
  // the label sits in the name line, right after the name
  await expect(row.locator('.name span.pin')).toHaveText('Pinned');
  await expect(page.locator('span.pin')).toHaveCount(1);
  await page.getByTestId('chip-pinned').click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(pinned.name);
  await page.getByTestId('chip-all').click();
  await expect(rows).toHaveCount(8);
});

test('no Pinned chip while nobody is pinned', async ({ page }) => {
  await seedRecord(page, townRecord({ state: dayOne() }));
  await page.goto('/?tickMs=60000');
  await page.getByTestId('tab-people').click();
  await expect(page.getByTestId('person')).toHaveCount(8);
  await expect(page.getByTestId('chip-pinned')).toHaveCount(0);
});
