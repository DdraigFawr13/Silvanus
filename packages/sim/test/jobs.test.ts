import { describe, expect, test } from 'vitest';
import { apply, assignJobs, newGame, pinPreview } from '../src/index';
import type { State } from '../src/index';
import { byKind, content, finished, run, workers } from './town';

const assigned = (state: State): State => {
  const copy = JSON.parse(JSON.stringify(state)) as State;
  assignJobs(copy, content);
  return copy;
};

describe('jobs', () => {
  test('assignment is stable and respects pins and open slots', () => {
    // a town with more work than people: 8 residents, 12 open slots
    let town = finished(finished(newGame(1, content), 'mine'), 'woodcutter');
    const mine = byKind(town, 'mine').id;
    const hut = byKind(town, 'forager').id;
    // pin two residents who work in the hut to the mine, and close half the hut
    const inHut = town.residents.filter((r) => r.jobId === hut).map((r) => r.id);
    expect(inHut).toHaveLength(4);
    town = apply(
      town,
      [
        { type: 'pin', residentId: inHut[0], buildingId: mine },
        { type: 'pin', residentId: inHut[1], buildingId: mine },
        { type: 'setOpen', buildingId: hut, count: 2 },
      ],
      content,
    ).state;
    const once = assigned(town);
    expect(assigned(town)).toEqual(once);
    // a second pass from its own result changes nothing
    expect(assigned(once)).toEqual(once);
    for (const id of [inHut[0], inHut[1]]) {
      expect(once.residents.find((r) => r.id === id)?.jobId).toBe(mine);
    }
    for (const building of once.buildings) {
      expect(workers(once, building.id), building.kind).toBeLessThanOrEqual(building.open);
    }
    expect(workers(once, hut)).toBe(2);
    // everyone has work: 2 + 4 + 4 slots for 8 people leaves 2 slots unfilled
    expect(once.residents.filter((r) => r.jobId === null)).toHaveLength(0);
    expect(once.jobsDirty).toBe(false);
  });

  test('a pin that does not fit is kept, and the resident works elsewhere', () => {
    const town = finished(newGame(1, content), 'mine');
    const mine = byKind(town, 'mine').id;
    const closed = apply(town, [{ type: 'setOpen', buildingId: mine, count: 0 }], content).state;
    const pinned = apply(closed, [{ type: 'pin', residentId: 1, buildingId: mine }], content).state;
    const resident = pinned.residents.find((r) => r.id === 1)!;
    expect(resident.pinnedTo).toBe(mine);
    expect(resident.jobId).not.toBe(mine);
  });

  test('skills grow by working', () => {
    // seed 1: Dai (1), Mairoc (2), Hrutrek (4) and Llewed (8) forage; the other four have no job
    const start = newGame(1, content);
    const before = new Map(start.residents.map((r) => [r.id, { ...r.skills }]));
    // two game days (ticks 24 and 48) count, and the skill has not moved yet
    const two = run(start, 72);
    expect(two.residents.find((r) => r.id === 1)!.workDays).toBe(2);
    expect(two.residents.find((r) => r.id === 1)!.skills).toEqual(before.get(1));
    // the third, at tick 72, raises Husbandry by 1 for each forager and starts the count again
    const three = run(start, 73);
    for (const r of three.residents) {
      const was = before.get(r.id)!;
      if (r.jobId === null) {
        expect(r.skills, r.name).toEqual(was);
        expect(r.workDays, r.name).toBe(0);
      } else {
        expect(r.skills, r.name).toEqual({ ...was, husbandry: was.husbandry + 1 });
        expect(r.workDays, r.name).toBe(0);
      }
    }
    expect(three.residents.filter((r) => r.jobId !== null).map((r) => r.id)).toEqual([1, 2, 4, 8]);
  });

  test('pinPreview gives the reasons a job would bring', () => {
    let town = finished(finished(newGame(1, content), 'mine'), 'tavern');
    const mine = byKind(town, 'mine').id;
    const tavern = byKind(town, 'tavern').id;
    const hut = byKind(town, 'forager').id;
    town = JSON.parse(JSON.stringify(town)) as typeof town;
    // Ceriin (3): mining 23, below 30, and no trait that minds a Mine
    expect(pinPreview(town, 3, mine, content)).toEqual([{ id: 'fit', amount: -10 }]);
    // Balkrek (5): Deep-delver likes a Mine; mining 41 is neither good nor bad
    expect(pinPreview(town, 5, mine, content)).toEqual([{ id: 'likes', amount: 10 }]);
    // Mairoc (2): Sociable likes the tavern and dislikes a Mine; a tavern asks no skill
    expect(pinPreview(town, 2, tavern, content)).toEqual([{ id: 'likes', amount: 10 }]);
    expect(pinPreview(town, 2, mine, content)).toEqual([{ id: 'dislikes', amount: -10 }]);
    // Dai (1): Hearth-bound dislikes the Forager's hut, his job now
    expect(pinPreview(town, 1, hut, content)).toEqual([{ id: 'dislikes', amount: -10 }]);
    // a skill of 60 or more fits
    const skilled = {
      ...town,
      residents: town.residents.map((r) =>
        r.id === 3 ? { ...r, skills: { ...r.skills, mining: 60 } } : r,
      ),
    };
    expect(pinPreview(skilled, 3, mine, content)).toEqual([{ id: 'fit', amount: 10 }]);
    // a building with no worker slots brings nothing
    const cottage = byKind(town, 'cottage').id;
    expect(pinPreview(town, 3, cottage, content)).toEqual([]);
  });
});
