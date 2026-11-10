import { describe, expect, test } from 'vitest';
import { apply, newGame, step } from '../src/index';
import type { State } from '../src/index';
import { content } from './town';

// Seed 1 at the start of its first game day, with `food` in store. Nothing is made at tick 24,
// so the day's food is what is set here.
function dayStart(food: number, change: (s: State) => State = (s) => s): State {
  const start = newGame(1, content);
  return change({ ...start, tick: 24, stock: { ...start.stock, food } });
}

const who = (state: State, id: number) => state.residents.find((r) => r.id === id)!;

describe('growth', () => {
  // Seed 1: Dai (1) forages and is Hearth-bound, which dislikes the Forager's hut; Ceriin (3) has
  // no job; Hrutrek (4) forages and is Green-fingered, which likes it.
  test('morale moves toward its reasons by 5 a day', () => {
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

    // a fed day with food to spare: +10. Dai's target is 50, Hrutrek's 70, Ceriin's 50
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

  test('a job the resident is bad at costs morale through fit', () => {
    // Ceriin (3) has mining 23, below 30. Pinned to a Mine, the day gives fit -10.
    let town = newGame(1, content);
    town = { ...town, stock: { ...town.stock, wood: 200 } };
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
});
