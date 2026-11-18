import { content } from '@silvanus/content';
import { newGame } from '@silvanus/sim';
import type { Building, State } from '@silvanus/sim';
import { expect, test } from 'vitest';
import { emptyMemory, scene, spotsFor } from '../src/town/layout';

const built = (id: number, kind: string, tier = 1): Building => ({
  id,
  kind,
  tier,
  method: null,
  open: 0,
  retoolLeft: 0,
  carry: {},
  debt: {},
  short: false,
  owned: [],
  // M2d S1: the map does not read plots yet
  plot: id - 100,
  shutLeft: 0,
  shutBy: null,
});
// seed 1 with the given buildings (ids from 100) and Hall tier
const town = (kinds: string[], hallTier = 1): State => ({
  ...newGame(1, content),
  hallTier,
  buildings: kinds.map((kind, i) => built(100 + i, kind)),
});
// the spot names in order: the Hall, each building in lot order, then each empty lot
const names = (state: State) => spotsFor(state).map((s) => s.name);

test('spots follow the rule', () => {
  // a new town: Cottage on the plot nearest the square, the Forager's hut on its site, 4 empty lots
  const fresh = newGame(1, content);
  expect(names(fresh)).toEqual([
    'hall',
    'plot0',
    'site_forager',
    'plot1',
    'plot2',
    'plot3',
    'plot4',
  ]);
  const spots = spotsFor(fresh);
  expect(spots.map((s) => s.lot)).toEqual([null, 0, 1, 2, 3, 4, 5]);
  expect(spots.slice(1, 3).map((s) => s.buildingId)).toEqual(fresh.buildings.map((b) => b.id));
  expect(spots.slice(3).every((s) => s.buildingId === null && s.kind === null)).toBe(true);
  // the same state always gives the same answer
  expect(spotsFor(fresh)).toEqual(spots);

  // a second Mine takes a plot; the first keeps the site
  expect(names(town(['cottage', 'mine', 'mine']))).toEqual([
    'hall',
    'plot0',
    'site_mine',
    'plot1',
    'plot2',
    'plot3',
    'plot4',
  ]);
  // a cleared lot: the buildings after it move up a lot, and plots refill from the nearest
  expect(names(town(['cottage', 'workshop']))).toEqual([
    'hall',
    'plot0',
    'plot1',
    'plot2',
    'plot3',
    'plot4',
    'plot5',
  ]);
  // clearing the first of two Mines: the second takes the site
  expect(names(town(['cottage', 'mine']))).toEqual([
    'hall',
    'plot0',
    'site_mine',
    'plot1',
    'plot2',
    'plot3',
    'plot4',
  ]);
  // a Farm built while lots are empty takes its site, not the next plot
  expect(names(town(['cottage', 'forager', 'farm']))).toEqual([
    'hall',
    'plot0',
    'site_forager',
    'site_farm',
    'plot1',
    'plot2',
    'plot3',
  ]);
  // 10 lots, none of a site kind: all 10 plots
  const ten = town(
    Array.from({ length: 10 }, (_, i) => (i % 2 ? 'cottage' : 'workshop')),
    2,
  );
  expect(names(ten)).toEqual(['hall', ...Array.from({ length: 10 }, (_, i) => `plot${i}`)]);

  // one spot per building and per empty lot, plus the Hall, and no two share a spot or a tap box
  for (const state of [fresh, ten, town(['woodcutter', 'farm', 'mine', 'forager', 'tavern'], 2)]) {
    const all = spotsFor(state);
    expect(all.length).toBe(1 + content.hall.tiers[state.hallTier - 1].lots);
    expect(new Set(all.map((s) => s.name)).size).toBe(all.length);
    for (const a of all) {
      expect(a.tap.w).toBeGreaterThanOrEqual(116);
      expect(a.tap.h).toBeGreaterThanOrEqual(116);
      for (const b of all) {
        if (a === b) continue;
        const apart =
          a.tap.x + a.tap.w <= b.tap.x ||
          b.tap.x + b.tap.w <= a.tap.x ||
          a.tap.y + a.tap.h <= b.tap.y ||
          b.tap.y + b.tap.h <= a.tap.y;
        expect(apart, `${a.name} and ${b.name}`).toBe(true);
      }
    }
  }
});

test('the draw list: scenery, the Hall and one piece per building, faded while built', () => {
  const state = town(['cottage', 'forager', 'workshop']);
  state.buildings[2].tier = 0;
  const items = scene(state, emptyMemory(), 0, null);
  const named = new Map(items.map((i) => [i.name, i]));
  expect(named.get('hall')?.alpha).toBe(1);
  expect(named.get('plot0')?.alpha).toBe(1);
  expect(named.get('site_forager')?.alpha).toBe(1);
  expect(named.get('plot1_workshop')?.alpha).toBe(0.45);
  // empty lots and free sites draw nothing
  expect(
    [...named.keys()].filter((n) => n.startsWith('plot') || n.startsWith('site')),
  ).toHaveLength(3);
  expect(items.filter((i) => i.name.startsWith('scenery')).length).toBe(30 - 1 - 4 - 10);
  // sorted by depth (bottom edge)
  for (let i = 1; i < items.length; i++)
    expect(items[i].depth).toBeGreaterThanOrEqual(items[i - 1].depth);
  // a Cottage at tier 3 on a cottage-a plot draws that piece's tier 3
  const grown = town(['workshop', 'cottage']);
  grown.buildings[1].tier = 3;
  expect(scene(grown, emptyMemory(), 0, null).some((i) => i.name === 'plot1_t3')).toBe(true);
});

test('the view reads the state and changes nothing', () => {
  const state = town(['cottage', 'forager', 'mine', 'mine', 'tavern'], 2);
  const before = structuredClone(state);
  for (let i = 0; i < 1000; i++) {
    spotsFor(state);
    scene(state, emptyMemory(), i * 16.7, i % 3 ? null : state.buildings[0].id);
  }
  expect(state).toEqual(before);
});

test('the view uses its own random numbers', () => {
  // every source file in src/town, as text (Vite reads them; the web app has no Node types)
  const sources = import.meta.glob<string>('../src/town/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  const files = Object.keys(sources);
  // an empty or wrong folder must fail, not pass with nothing checked
  expect(files.length).toBeGreaterThanOrEqual(5);
  const allowed = new Set(['kindOf', 'hallOf', 'capsOf', 'onTrip']);
  for (const file of files) {
    const text = sources[file];
    expect(text, file).not.toMatch(/Math\.random/);
    for (const m of text.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'@silvanus\/sim'/g)) {
      if (m[1]) continue; // types only
      for (const name of m[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)) {
        expect(
          allowed.has(name.replace(/^type\s+/, '')) || name.startsWith('type '),
          `${file}: ${name}`,
        ).toBe(true);
      }
    }
    expect(text, file).not.toMatch(/from '@silvanus\/sim\//);
  }
});
