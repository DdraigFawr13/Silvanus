import { content } from '@silvanus/content';
import { newGame, plotsFor } from '@silvanus/sim';
import type { Building, State } from '@silvanus/sim';
import { expect, test } from 'vitest';
import { emptyMemory, scene, spotsFor } from '../src/town/layout';
import { tapBoxes } from '../src/town/map';
import type { Item, Piece } from '../src/town/layout';

const built = (id: number, kind: string, plot: number, tier = 1): Building => ({
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
  plot,
  shutLeft: 0,
  shutBy: null,
});
// Seed 1 with the Hall at `hallTier` (the plots of its tiers open) and the given buildings (ids from 100),
// each on the first plot the sim offers its kind (plotsFor).
function town(kinds: string[], hallTier = 1): State {
  const base = newGame(1, content);
  let state: State = {
    ...base,
    hallTier,
    buildings: [],
    plots: base.plots.map((p) => ({ ...p, open: p.tier <= hallTier })),
  };
  kinds.forEach((kind, i) => {
    const plot = plotsFor(state, kind, content)[0];
    state = { ...state, buildings: [...state.buildings, built(100 + i, kind, plot.id)] };
  });
  return state;
}
// the spot names in order: the Hall, then each open plot that has a spot
const names = (state: State) => spotsFor(state).map((s) => s.name);
const piecesOf = (items: Item[]) => items.filter((i): i is Piece => i.type === 'piece');
// the spot a building stands on
const spotOf = (state: State, id: number) => spotsFor(state).find((s) => s.buildingId === id)?.name;
const SITE_OF: Record<string, string> = {
  forest: 'site_woodcutter',
  woods: 'site_forager',
  fields: 'site_farm',
  mountain: 'site_mine',
};

test('spots follow the plots', () => {
  // a new town: the Hall, the 6 open town lots on plot0 to plot5, then the first site of each ground
  // that has a spot (the river has none yet)
  const fresh = newGame(1, content);
  const sites = fresh.plots.filter((p) => p.open && p.ground !== null && SITE_OF[p.ground]);
  expect(names(fresh)).toEqual([
    'hall',
    ...Array.from({ length: 6 }, (_, i) => `plot${i}`),
    ...sites.map((p) => SITE_OF[p.ground!]),
  ]);
  const spots = spotsFor(fresh);
  expect(spots.map((s) => s.plot)).toEqual([
    null,
    ...fresh.plots
      .filter((p) => p.open && (p.ground === null || SITE_OF[p.ground]))
      .map((p) => p.id),
  ]);
  // each building on its own plot's spot: the Cottage on its town lot, the Forager's hut on the woods site
  for (const b of fresh.buildings) {
    const plot = fresh.plots[b.plot];
    expect(spotOf(fresh, b.id)).toBe(
      plot.ground === null ? `plot${plot.id}` : SITE_OF[plot.ground],
    );
  }
  // the map's empty town lots are the Town tab's: open town lots no building stands on
  const tabEmpty = fresh.plots.filter(
    (p) => p.open && p.ground === null && !fresh.buildings.some((b) => b.plot === p.id),
  );
  const mapEmpty = spots.filter(
    (s) => s.plot !== null && s.buildingId === null && s.name.startsWith('plot'),
  );
  expect(mapEmpty.map((s) => s.plot)).toEqual(tabEmpty.map((p) => p.id));
  expect(mapEmpty).toHaveLength(5);
  // the same state always gives the same answer
  expect(spotsFor(fresh)).toEqual(spots);

  // a building keeps its spot when another is cleared (lots are records now, D-058)
  const four = town(['cottage', 'workshop', 'mine', 'cottage']);
  const before = four.buildings.map((b) => spotOf(four, b.id));
  const cleared = { ...four, buildings: four.buildings.slice(1) };
  expect(cleared.buildings.map((b) => spotOf(cleared, b.id))).toEqual(before.slice(1));
  // the cleared lot is empty on the map
  expect(spotsFor(cleared).find((s) => s.name === before[0])?.buildingId).toBeNull();

  // a second Mine stands on the Village's mountain site, which has no spot yet: not on the map
  const village = town(['cottage', 'mine', 'mine'], 2);
  expect(spotOf(village, 101)).toBe('site_mine');
  expect(spotOf(village, 102)).toBeUndefined();
  // the Village's 10 town lots fill plot0 to plot9; plots closed by the Hall's tier have no spot
  expect(names(village).filter((n) => n.startsWith('plot'))).toEqual(
    Array.from({ length: 10 }, (_, i) => `plot${i}`),
  );
  expect(names(fresh).filter((n) => n.startsWith('plot'))).toHaveLength(6);

  // one spot per open plot with a spot, plus the Hall, and no two share a spot or a tap box
  const tenLots = town(
    Array.from({ length: 10 }, (_, i) => (i % 2 ? 'cottage' : 'workshop')),
    2,
  );
  for (const state of [
    fresh,
    tenLots,
    town(['woodcutter', 'farm', 'mine', 'forager', 'tavern'], 2),
  ]) {
    const all = spotsFor(state);
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
  const [cottage, , workshop] = state.buildings.map((b) => spotOf(state, b.id)!);
  expect(named.get('hall')?.alpha).toBe(1);
  expect(named.get(cottage)?.alpha).toBe(1);
  expect(named.get('site_forager')?.alpha).toBe(1);
  expect(named.get(`${workshop}_workshop`)?.alpha).toBe(0.45);
  // empty lots and free sites draw nothing
  expect(
    [...named.keys()].filter((n) => n.startsWith('plot') || n.startsWith('site')),
  ).toHaveLength(3);
  expect(items.filter((i) => i.name.startsWith('scenery')).length).toBe(30 - 1 - 4 - 10);
  // sorted by depth (bottom edge)
  for (let i = 1; i < items.length; i++)
    expect(items[i].depth).toBeGreaterThanOrEqual(items[i - 1].depth);
  // a Cottage at tier 3 on a cottage-a plot draws that piece's tier 3
  const grown = town(['cottage']);
  grown.buildings[0].tier = 3;
  grown.buildings[0].plot = 1; // plot1's own piece is cottage a
  expect(piecesOf(scene(grown, emptyMemory(), 0, null)).some((i) => i.name === 'plot1_t3')).toBe(
    true,
  );
});

test('empty plots glow pale with a Build marker; a built lot glows gold only while open', () => {
  // a new town: the Cottage and the Forager's hut; empty are the other open town lots and the forest,
  // fields and mountain sites
  const state = newGame(1, content);
  const [cottage, hut] = state.buildings;
  const empty = spotsFor(state)
    .filter((s) => s.plot !== null && s.buildingId === null)
    .map((s) => s.plot);
  expect(empty).toHaveLength(5 + 3);
  const marks = (open: number | null) =>
    scene(state, emptyMemory(), 0, open).filter((i) => i.type !== 'piece');
  const shut = marks(null);
  const pale = shut.filter((i) => i.type === 'glow' && i.tone === 'pale');
  const markers = shut.filter((i) => i.type === 'build-marker');
  expect(pale.map((i) => i.plot)).toEqual(empty);
  expect(markers.map((i) => i.plot)).toEqual(empty);
  // no gold glow while no sheet is open
  expect(shut.some((i) => i.type === 'glow' && i.tone === 'gold')).toBe(false);
  // a building's sheet open: a gold glow on its plot only, the empty plots unchanged
  for (const b of [cottage, hut]) {
    const all = scene(state, emptyMemory(), 0, b.id);
    const gold = all.filter((i) => i.type === 'glow' && i.tone === 'gold');
    expect(gold.map((i) => i.type === 'glow' && i.plot)).toEqual([b.plot]);
    expect(marks(b.id).length).toBe(shut.length + 1);
  }
  // the pale glow and the marker sit on their own spot: inside that plot's tap box
  const spots = spotsFor(state);
  for (const mark of shut) {
    const tap = spots.find((s) => s.plot === mark.plot)!.tap;
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
  const own = spotOf(state, cottage.id);
  expect(ring.type === 'glow' && ring.tone === 'gold' && ring.piece).toBe(own);
  expect(next).toMatchObject({ type: 'piece', name: own, x: ring.x, y: ring.y });
  // a town with every spot built has no pale glow and no marker
  const full = town([
    'cottage',
    'forager',
    'workshop',
    'cottage',
    'mine',
    'farm',
    'woodcutter',
    'cottage',
    'tavern',
    'cottage',
  ]);
  expect(spotsFor(full).every((s) => s.plot === null || s.buildingId !== null)).toBe(true);
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
  // the Village: the Hall, all 10 plot spots and all 4 site spots
  const taps = spotsFor(town([], 2));
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
