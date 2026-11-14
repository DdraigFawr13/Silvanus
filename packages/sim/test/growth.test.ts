import { describe, expect, test } from 'vitest';
import { advance, apply, newGame, step } from '../src/index';
import type { State } from '../src/index';
import { content, crowd, finished } from './town';

// Seed 1 at the start of its first game day, with `food` in store. Nothing is made at tick 24,
// so the day's food is what is set here. The traits these tests read are set here, not taken
// from seed 1's draw, so a change to how residents are drawn does not move them (M1 audit F4):
// 1 is Hearth-bound (dislikes the Forager's hut), 3 Deft and 4 Green-fingered (likes it).
const TRAITS: Record<number, string[]> = {
  1: ['hearthBound', 'deft'],
  3: ['deft', 'woodwise'],
  4: ['greenFingered', 'woodwise'],
};
function dayStart(food: number, change: (s: State) => State = (s) => s): State {
  const start = newGame(1, content);
  const residents = start.residents.map((r) => (TRAITS[r.id] ? { ...r, traits: TRAITS[r.id] } : r));
  return change({ ...start, residents, tick: 24, stock: { ...start.stock, food } });
}

const who = (state: State, id: number) => state.residents.find((r) => r.id === id)!;

describe('growth', () => {
  // 1 and 4 forage and 3 has no job (seed 1's assignment, checked first).
  test('morale moves toward its reasons by 5 a day', () => {
    const start = dayStart(0);
    const hut = start.buildings.find((b) => b.kind === 'forager')!.id;
    expect([who(start, 1).jobId, who(start, 3).jobId, who(start, 4).jobId]).toEqual([
      hut,
      null,
      hut,
    ]);
    // a hungry day: the town is not fed
    const hungry = step(dayStart(0), [], content).state;
    expect(who(hungry, 1).reasons).toEqual([
      { id: 'food', amount: -30 },
      { id: 'dislikes', amount: -10 },
    ]);
    expect(who(hungry, 3).reasons).toEqual([
      { id: 'food', amount: -30 },
      { id: 'idle', amount: -10 },
    ]);
    expect(who(hungry, 4).reasons).toEqual([
      { id: 'food', amount: -30 },
      { id: 'likes', amount: 10 },
    ]);
    // every target is below 50, so everyone falls by 5, and by 5 again the next day
    for (const r of hungry.residents) expect(r.morale, r.name).toBe(45);
    const again = step(
      { ...hungry, tick: 48, stock: { ...hungry.stock, food: 0 } },
      [],
      content,
    ).state;
    for (const r of again.residents) expect(r.morale, r.name).toBe(40);

    // a fed day with food to spare: +10. 1's target is 50, 4's 70, 3's 50
    const fed = step(dayStart(100), [], content).state;
    expect(who(fed, 1).morale).toBe(50);
    expect(who(fed, 3).morale).toBe(50);
    expect(who(fed, 4).morale).toBe(55);
    expect(who(fed, 4).reasons).toEqual([
      { id: 'food', amount: 10 },
      { id: 'likes', amount: 10 },
    ]);
    // fed, but with less food left than residents: -5. 8 eat 12, leaving 4
    expect(who(step(dayStart(12), [], content).state, 3).reasons).toEqual([
      { id: 'food', amount: -5 },
      { id: 'idle', amount: -10 },
    ]);
    // fed, with between 1 and 2 a head left: no food reason. 8 eat 18, leaving 10
    expect(who(step(dayStart(18), [], content).state, 3).reasons).toEqual([
      { id: 'idle', amount: -10 },
    ]);

    // no Cottage: 8 residents and no beds
    const homeless = step(
      dayStart(100, (s) => ({ ...s, buildings: s.buildings.filter((b) => b.kind !== 'cottage') })),
      [],
      content,
    ).state;
    expect(who(homeless, 3).reasons).toEqual([
      { id: 'food', amount: 10 },
      { id: 'idle', amount: -10 },
      { id: 'crowded', amount: -15 },
    ]);
    expect(who(homeless, 3).morale).toBe(45);

    // morale stops at its target and at 100
    const high = step(
      dayStart(100, (s) => ({ ...s, residents: s.residents.map((r) => ({ ...r, morale: 98 })) })),
      [],
      content,
    ).state;
    expect(who(high, 4).morale).toBe(93);
    const near = step(
      dayStart(100, (s) => ({ ...s, residents: s.residents.map((r) => ({ ...r, morale: 67 })) })),
      [],
      content,
    ).state;
    expect(who(near, 4).morale).toBe(70);
  });

  test('a game day leaves the state it is given untouched', () => {
    const before = dayStart(0);
    const frozen = JSON.parse(JSON.stringify(before)) as State;
    const freeze = (value: unknown): void => {
      if (value && typeof value === 'object') {
        Object.freeze(value);
        for (const inner of Object.values(value)) freeze(inner);
      }
    };
    freeze(before);
    // a frozen input throws on any write; a forager's skill and everyone's reasons change
    const after = step(before, [], content).state;
    expect(before).toEqual(frozen);
    expect(after.residents[0].reasons).not.toEqual(before.residents[0].reasons);
  });

  test('a job the resident is bad at costs morale through fit', () => {
    // 3 is given mining 23, below 30. Pinned to a Mine, the day gives fit -10.
    let town = newGame(1, content);
    const residents = town.residents.map((r) =>
      r.id === 3 ? { ...r, skills: { ...r.skills, mining: 23 } } : r,
    );
    town = { ...town, residents, stock: { ...town.stock, wood: 200 } };
    town = apply(town, [{ type: 'build', kind: 'mine' }], content).state;
    for (let i = 0; i < 24; i++) town = step(town, [], content).state;
    const mine = town.buildings.find((b) => b.kind === 'mine')!;
    expect(mine.tier).toBe(1);
    town = apply(town, [{ type: 'pin', residentId: 3, buildingId: mine.id }], content).state;
    expect(who(town, 3).jobId).toBe(mine.id);
    const day = step({ ...town, stock: { ...town.stock, food: 100 } }, [], content).state;
    expect(day.tick).toBe(25);
    expect(who(day, 3).reasons).toEqual([
      { id: 'food', amount: 10 },
      { id: 'fit', amount: -10 },
    ]);
  });

  test('a settler arrives', () => {
    // a second Cottage gives 16 beds for 8; 8 eat 8 of 100, leaving 92, at least 2 a head
    const town = dayStart(100, (s) => finished(s, 'cottage'));
    const { state, events } = step(town, [], content);
    expect(state.residents).toHaveLength(9);
    const settler = state.residents[8];
    expect(settler.id).toBe(town.nextId);
    expect(state.nextId).toBe(town.nextId + 1);
    expect(settler.arrivedTick).toBe(24);
    expect(settler.morale).toBe(50);
    const people = content.peoples.find((p) => p.id === settler.people)!.name;
    expect(state.log.at(-1)).toEqual({
      tick: 24,
      type: 'arrived',
      text: `${settler.name}, a ${people}, has settled in Ashwick.`,
    });
    expect(events).toContainEqual({ type: 'arrived', residentId: settler.id, name: settler.name });
    expect(state.jobsDirty).toBe(false);
    // the away card's summary names them
    expect(advance(town, 1, content).summary.arrived).toEqual([settler.name]);

    // no free bed: nobody comes
    expect(step(dayStart(100), [], content).state.residents).toHaveLength(8);
    // 8 eat 8 of 23, leaving 15, under 2 a head: nobody comes; of 24, leaving 16, one comes
    const second = (food: number) => dayStart(food, (s) => finished(s, 'cottage'));
    expect(step(second(23), [], content).state.residents).toHaveLength(8);
    expect(step(second(24), [], content).state.residents).toHaveLength(9);
    // a town at its Hall's limit takes nobody, though beds and food would allow one: two more
    // Cottages give 32 beds for 25
    const roomy = (n: number) => {
      const town = crowd(finished(finished(second(200), 'cottage'), 'cottage'), n);
      return { ...town, stock: { ...town.stock, food: 200 } };
    };
    expect(step(roomy(24), [], content).state.residents).toHaveLength(25);
    expect(step(roomy(25), [], content).state.residents).toHaveLength(25);
  });

  // 20 residents at morale 0, food 0 and no food buildings, from `tick`
  function starving(tick: number): State {
    const town = crowd(newGame(1, content), 20);
    return {
      ...town,
      tick,
      stock: { ...town.stock, food: 0 },
      buildings: town.buildings.filter((b) => b.kind !== 'forager'),
      residents: town.residents.map((r) => ({ ...r, morale: 0, jobId: null, pinnedTo: null })),
    };
  }

  test('a hungry night costs at most three', () => {
    for (const tick of [100, 0]) {
      // an 8-real-hour night at 15 s (D-036)
      const night = advance(starving(tick), 1_920, content);
      const left = 20 - night.state.residents.length;
      expect(left, `from tick ${tick}`).toBeGreaterThanOrEqual(1);
      expect(left, `from tick ${tick}`).toBeLessThanOrEqual(3);
      expect(night.summary.left).toHaveLength(left);
      const lines = night.state.log.filter((line) => line.type === 'left');
      expect(lines.map((line) => line.text)).toEqual(
        night.summary.left.map((name) => `${name} has left Ashwick.`),
      );
      // everyone is idle and starving at morale 0, a tie, so the lowest id goes first
      const lowest = starving(tick).residents.reduce((a, b) => (b.id < a.id ? b : a));
      expect(night.summary.left[0], `from tick ${tick}`).toBe(lowest.name);
      // the leaving gap (672 ticks, D-039) at least between two departures
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].tick - lines[i - 1].tick).toBeGreaterThanOrEqual(
          content.rules.leaveGapTicks,
        );
      }
    }
    // the lowest morale goes first, ties by the lowest id
    const town = starving(100);
    const residents = town.residents.map((r) => (r.id === 5 ? r : { ...r, morale: 10 }));
    const first = advance({ ...town, residents }, 21, content).state;
    expect(first.residents.map((r) => r.id)).not.toContain(5);
    expect(first.lastLeftTick).toBe(120);
    expect(first.residents).toHaveLength(19);
  });

  test('nobody leaves a town of eight', () => {
    const start = newGame(1, content);
    const town: State = {
      ...start,
      stock: { ...start.stock, food: 0 },
      // the hut is shut, so the town stays hungry and everyone stays below the leaving line
      buildings: start.buildings.map((b) => (b.kind === 'forager' ? { ...b, open: 0 } : b)),
      residents: start.residents.map((r) => ({ ...r, morale: 0, jobId: null })),
    };
    const night = advance(town, 1_920, content);
    expect(night.state.residents.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(night.summary.left).toEqual([]);
    expect(night.state.residents.every((r) => r.morale < content.rules.leaveBelow)).toBe(true);
  });

  test('staffed tavern workers lift everyone, last among the reasons', () => {
    // a Tavern of 1 slot, staffed before the day begins
    const town = apply(
      { ...dayStart(100, (s) => finished(s, 'tavern')), jobsDirty: true },
      [],
      content,
    ).state;
    const tavern = town.buildings.find((b) => b.kind === 'tavern')!;
    expect(town.residents.filter((r) => r.jobId === tavern.id)).toHaveLength(1);
    const day = step(town, [], content).state;
    for (const r of day.residents) {
      expect(r.reasons.at(-1), r.name).toEqual({ id: 'tavern', amount: 4 });
    }
    // three workers would give 12, the most it gives; with nobody in it, nothing
    const empty = apply(town, [{ type: 'setOpen', buildingId: tavern.id, count: 0 }], content);
    const quiet = step(empty.state, [], content).state;
    for (const r of quiet.residents) expect(r.reasons.map((t) => t.id)).not.toContain('tavern');
  });
});
