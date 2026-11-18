import { content } from '@silvanus/content';
import { newGame } from '@silvanus/sim';
import type { Building, State } from '@silvanus/sim';
import { expect, test } from 'vitest';
import { emptyMemory, scene, spotsFor } from '../src/town/layout';
import { tapBoxes } from '../src/town/map';
import type { Item, Piece } from '../src/town/layout';

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
});
// seed 1 with the given buildings (ids from 100) and Hall tier
const town = (kinds: string[], hallTier = 1): State => ({
  ...newGame(1, content),
  hallTier,
  buildings: kinds.map((kind, i) => built(100 + i, kind)),
});
// the spot names in order: the Hall, each building in lot order, then each empty lot
const names = (state: State) => spotsFor(state).map((s) => s.name);
const piecesOf = (items: Item[]) => items.filter((i): i is Piece => i.type === 'piece');

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
  const items = piecesOf(scene(state, emptyMemory(), 0, null));
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
  expect(piecesOf(scene(grown, emptyMemory(), 0, null)).some((i) => i.name === 'plot1_t3')).toBe(
    true,
  );
});

test('empty lots glow pale with a Build marker; a built lot glows gold only while open', () => {
  // a new town: Cottage, Forager's hut and 4 empty lots (lots 2 to 5)
  const state = newGame(1, content);
  const [cottage, hut] = state.buildings;
  const marks = (open: number | null) =>
    scene(state, emptyMemory(), 0, open).filter((i) => i.type !== 'piece');
  const shut = marks(null);
  const pale = shut.filter((i) => i.type === 'glow' && i.tone === 'pale');
  const markers = shut.filter((i) => i.type === 'build-marker');
  expect(pale.map((i) => i.lot)).toEqual([2, 3, 4, 5]);
  expect(markers.map((i) => i.lot)).toEqual([2, 3, 4, 5]);
  // no gold glow while no sheet is open
  expect(shut.some((i) => i.type === 'glow' && i.tone === 'gold')).toBe(false);
  // the Cottage's sheet open: a gold glow on its lot (0) only, the empty lots unchanged
  for (const [id, lot] of [
    [cottage.id, 0],
    [hut.id, 1],
  ]) {
    const gold = marks(id).filter((i) => i.type === 'glow' && i.tone === 'gold');
    expect(gold.map((i) => i.lot)).toEqual([lot]);
    expect(marks(id).length).toBe(shut.length + 1);
  }
  // the pale glow and the marker sit on their own spot: inside that lot's tap box
  const spots = spotsFor(state);
  for (const mark of shut) {
    const tap = spots.find((s) => s.lot === mark.lot)!.tap;
    expect(mark.x).toBeGreaterThanOrEqual(tap.x);
    expect(mark.x).toBeLessThanOrEqual(tap.x + tap.w);
    expect(mark.y).toBeGreaterThanOrEqual(tap.y);
    expect(mark.y).toBeLessThanOrEqual(tap.y + tap.h);
  }
  // the gold ring follows the open building's own piece and is drawn just before it
  const all = scene(state, emptyMemory(), 0, cottage.id);
  const at = all.findIndex((i) => i.type === 'glow' && i.tone === 'gold');
  const ring = all[at];
  const next = all[at + 1];
  expect(ring.type === 'glow' && ring.tone === 'gold' && ring.piece).toBe('plot0');
  expect(next).toMatchObject({ type: 'piece', name: 'plot0', x: ring.x, y: ring.y });
  // a full town has no empty lots: no pale glow, no marker
  const full = town(['cottage', 'forager', 'workshop', 'cottage', 'mine', 'farm']);
  expect(scene(full, emptyMemory(), 0, null).filter((i) => i.type !== 'piece')).toEqual([]);
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

test('tap boxes are at least 44 CSS px and apart at any zoom and screen density', () => {
  // the Hall, all 4 sites and all 10 plots
  const state = town(
    ['woodcutter', 'farm', 'mine', 'forager', ...Array.from({ length: 6 }, () => 'cottage')],
    2,
  );
  const spots = spotsFor(state);
  expect(spots).toHaveLength(11);
  const full = [
    ...spots,
    ...spotsFor(
      town(
        Array.from({ length: 10 }, () => 'cottage'),
        2,
      ),
    ),
  ];
  const taps = [...new Map(full.map((s) => [s.name, s])).values()];
  expect(taps).toHaveLength(15);
  for (const dpr of [1, 2, 2.625, 3, 3.5]) {
    for (const zoom of [1, 2, 3]) {
      const boxes = tapBoxes(
        taps.map((s) => s.tap),
        zoom,
        dpr,
      );
      const at = `dpr ${dpr} at ${zoom}x`;
      boxes.forEach((b, i) => {
        expect((b.w * zoom) / dpr, `${at} ${taps[i].name}`).toBeGreaterThanOrEqual(44 - 1e-9);
        expect((b.h * zoom) / dpr, `${at} ${taps[i].name}`).toBeGreaterThanOrEqual(44 - 1e-9);
        // still over its own piece's centre
        const c = {
          x: taps[i].rect.x + taps[i].rect.w / 2,
          y: taps[i].rect.y + taps[i].rect.h / 2,
        };
        expect(
          c.x > b.x && c.x < b.x + b.w && c.y > b.y && c.y < b.y + b.h,
          `${at} ${taps[i].name}`,
        ).toBe(true);
        for (const [j, o] of boxes.entries()) {
          if (j <= i) continue;
          const apart =
            b.x + b.w <= o.x + 1e-9 ||
            o.x + o.w <= b.x + 1e-9 ||
            b.y + b.h <= o.y + 1e-9 ||
            o.y + o.h <= b.y + 1e-9;
          expect(apart, `${at} ${taps[i].name} and ${taps[j].name}`).toBe(true);
        }
      });
    }
  }
  // on Morgan's phone no box changes
  expect(
    tapBoxes(
      taps.map((s) => s.tap),
      1,
      2.625,
    ),
  ).toEqual(taps.map((s) => s.tap));
});
