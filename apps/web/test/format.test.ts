import { YEAR_TICKS } from '@silvanus/sim';
import { expect, test } from 'vitest';
import { ageOf, dateText, duration, reasonsText, signed, theList } from '../src/ui/format';

// The display words the screens are built from (M1 audit F10). Display only: no rule lives here.

test('an age is whole game years, rounded down at the birthday', () => {
  const born = 1000;
  expect(ageOf(born + YEAR_TICKS - 1, born)).toBe(0);
  expect(ageOf(born + YEAR_TICKS, born)).toBe(1);
  expect(ageOf(born + 20 * YEAR_TICKS + 5, born)).toBe(20);
});

test('a list of places reads as a sentence', () => {
  expect(theList([])).toBe('');
  expect(theList(['Workshop'])).toBe('the Workshop');
  expect(theList(['Workshop', 'Tavern'])).toBe('the Workshop and the Tavern');
  expect(theList(['Farm', 'Mine', 'Tavern'])).toBe('the Farm, the Mine and the Tavern');
});

test('a signed number uses a minus sign, not a hyphen', () => {
  expect(signed(-1)).toBe('−1');
  expect(signed(0)).toBe('0');
  expect(signed(1)).toBe('+1');
  expect(reasonsText([], 'None')).toBe('None');
  expect(reasonsText([{ id: 'dislikes', amount: -10 }], 'None')).toBe('Dislikes the work −10');
});

test('a duration is game days and hours, never ticks', () => {
  expect(duration(1)).toBe('1 game hour');
  expect(duration(8)).toBe('8 game hours');
  expect(duration(24)).toBe('1 game day');
  expect(duration(36)).toBe('1 game day, 12 game hours');
  expect(duration(100)).toBe('4 game days, 4 game hours');
  expect(dateText(0)).toBe('Year 1, season 1, day 1, hour 0');
});
