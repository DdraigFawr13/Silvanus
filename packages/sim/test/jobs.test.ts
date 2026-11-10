import { describe, expect, test } from 'vitest';
import { apply, assignJobs, newGame } from '../src/index';
import type { State } from '../src/index';
import { byKind, content, finished, workers } from './town';

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
});
