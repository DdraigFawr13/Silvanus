import { describe, expect, test } from 'vitest';
import { apply, capsOf, hallOf, jobCost, newGame, refusal } from '../src/index';
import type { Command, State } from '../src/index';
import { byKind, content, crowd, finished, rich, run, workers } from './town';

const send = (state: State, ...commands: Command[]) => apply(state, commands, content);

describe('build', () => {
  test('a build pays at once and finishes on time', () => {
    const ordered = send(newGame(1, content), { type: 'build', kind: 'mine' }).state;
    expect(ordered.stock.wood).toBe(20);
    expect(byKind(ordered, 'mine').tier).toBe(0);
    expect(byKind(run(ordered, 23), 'mine').tier).toBe(0);
    const done = run(ordered, 24);
    const mine = byKind(done, 'mine');
    expect(mine.tier).toBe(1);
    expect(mine.open).toBe(4);
    expect(workers(done, mine.id)).toBe(4);
    expect(done.queue).toEqual([]);
    expect(done.log.map((line) => line.text)).toEqual(['The Mine is built.']);
  });

  test("a town with no Woodcutter's camp gets one free", () => {
    const start = newGame(1, content);
    const poor: State = { ...start, stock: { ...start.stock, wood: 0 } };
    const first = send(poor, { type: 'build', kind: 'woodcutter' });
    expect(first.events).toEqual([]);
    expect(first.state.stock.wood).toBe(0);
    expect(first.state.queue).toHaveLength(1);
    const command: Command = { type: 'build', kind: 'woodcutter' };
    const second = send(first.state, command);
    expect(second.events).toEqual([{ type: 'rejected', command, reason: 'noStock' }]);
    expect(second.state).toEqual(first.state);
  });

  test('the queue holds one job under way and three waiting', () => {
    const kinds = ['cottage', 'farm', 'mine', 'workshop'];
    const filled = send(rich(), ...kinds.map((kind): Command => ({ type: 'build', kind })));
    expect(filled.events).toEqual([]);
    expect(filled.state.queue).toHaveLength(4);
    expect(filled.state.buildings).toHaveLength(6);
    const command: Command = { type: 'upgrade', buildingId: byKind(filled.state, 'forager').id };
    const refused = send(filled.state, command);
    expect(refused.events).toEqual([{ type: 'rejected', command, reason: 'queueFull' }]);
    expect(refused.state.stock).toEqual(filled.state.stock);
    // only the job at the front moves
    const later = run(filled.state, 5);
    expect(later.queue.map((job) => job.ticksLeft)).toEqual([7, 24, 24, 24]);
  });

  test('no lot, no build', () => {
    let town = rich();
    for (const kind of ['farm', 'woodcutter', 'mine', 'workshop']) town = finished(town, kind);
    expect(town.buildings).toHaveLength(6);
    const command: Command = { type: 'build', kind: 'tavern' };
    const refused = send(town, command);
    expect(refused.events).toEqual([{ type: 'rejected', command, reason: 'noLot' }]);
    expect(refused.state).toEqual(town);
  });

  test('cancelling a waiting job gives its cost back and frees the lot', () => {
    const start = newGame(1, content);
    const two = send(start, { type: 'build', kind: 'woodcutter' }, { type: 'build', kind: 'mine' });
    expect(two.state.stock.wood).toBe(20);
    const back = send(two.state, { type: 'cancelJob', index: 1 });
    expect(back.state.stock.wood).toBe(60);
    expect(back.state.buildings.map((b) => b.kind)).toEqual(['cottage', 'forager', 'woodcutter']);
    expect(back.state.queue).toHaveLength(1);
    // a refund that does not fit under the cap is lost and counted
    const full: State = { ...two.state, stock: { ...two.state.stock, wood: 190 } };
    const lost = send(full, { type: 'cancelJob', index: 1 });
    expect(lost.state.stock.wood).toBe(200);
    expect(lost.events).toEqual([{ type: 'lost', resource: 'wood', amount: 30 }]);
  });

  test('an upgrade keeps the building working and opens the new slots', () => {
    const hut = byKind(rich(), 'forager').id;
    const ordered = send(rich(), { type: 'upgrade', buildingId: hut });
    expect(ordered.state.stock.wood).toBe(160);
    expect(ordered.state.stock.tools).toBe(45);
    const busy: Command = { type: 'clear', buildingId: hut };
    expect(send(ordered.state, busy).events).toEqual([
      { type: 'rejected', command: busy, reason: 'busy' },
    ]);
    const done = run(ordered.state, 24);
    expect(byKind(done, 'forager')).toMatchObject({ tier: 2, open: 6 });
    expect(done.log.at(-1)?.text).toBe("The Forager's hut is now tier 2.");
  });

  test('clearing a lot removes the building and frees its workers', () => {
    const start = newGame(1, content);
    const hut = byKind(start, 'forager').id;
    const pinned = send(start, { type: 'pin', residentId: 1, buildingId: hut }).state;
    const cleared = send(pinned, { type: 'clear', buildingId: hut });
    expect(cleared.state.buildings.map((b) => b.kind)).toEqual(['cottage']);
    expect(cleared.state.residents.every((r) => r.jobId === null && r.pinnedTo === null)).toBe(
      true,
    );
    expect(cleared.state.log.at(-1)?.text).toBe("The Forager's hut was cleared from its lot.");
  });

  test('clearing a Storehouse cuts stock to the smaller cap', () => {
    const town = finished(newGame(1, content), 'storehouse');
    expect(capsOf(town, content).wood).toBe(400);
    const stocked: State = { ...town, stock: { ...town.stock, wood: 312 } };
    const cleared = send(stocked, { type: 'clear', buildingId: byKind(town, 'storehouse').id });
    expect(cleared.state.stock.wood).toBe(200);
    expect(cleared.events).toContainEqual({ type: 'capLost', resource: 'wood', amount: 112 });
    expect(cleared.state.log.at(-1)?.text).toBe('112 wood was lost when storage shrank.');
  });

  test('the Hall upgrade makes a Village', () => {
    const cost = { wood: 180, stone: 180, tools: 45 };
    const start = crowd(newGame(1, content), 20);
    const town: State = { ...start, stock: { ...start.stock, ...cost } };
    const command: Command = { type: 'upgradeHall' };
    expect(jobCost(town, command, content)).toEqual(cost);
    const ordered = send(town, command);
    expect(ordered.events).toEqual([]);
    expect(ordered.state.stock).toMatchObject({ wood: 0, stone: 0, tools: 0 });
    expect(ordered.state.queue).toEqual([{ target: 'hall', toTier: 2, ticksLeft: 96, cost }]);
    // the Hall has its job; a second order is refused before any other check
    expect(refusal(ordered.state, command, content)).toBe('busy');
    expect(run(ordered.state, 95).hallTier).toBe(1);
    const done = run(ordered.state, 96);
    expect(done.hallTier).toBe(2);
    expect(done.queue).toEqual([]);
    expect(hallOf(done, content).lots).toBe(10);
    expect(hallOf(done, content).catchUpCap).toBe(960);
    // written in the step from tick 95, as a build's line is
    expect(done.log.filter((line) => line.type === 'village')).toEqual([
      { tick: 95, type: 'village', text: 'Ashwick is now a Village.' },
    ]);
    // a Village cannot be ordered again
    expect(refusal({ ...done, stock: town.stock }, command, content)).toBe('notAllowed');
    // the job carries on if residents fall below 20 while it runs
    const fewer = { ...ordered.state, residents: ordered.state.residents.slice(0, 12) };
    expect(run(fewer, 96).hallTier).toBe(2);
  });

  test('the Hall upgrade asks for residents, then stock', () => {
    const cost = { wood: 180, stone: 180, tools: 45 };
    const start = newGame(1, content);
    const why = (state: State) => refusal(state, { type: 'upgradeHall' }, content);
    // 19 residents with the stock: too few; 8 with no stock: still too few, checked first
    expect(why({ ...crowd(start, 19), stock: { ...start.stock, ...cost } })).toBe('tooFew');
    expect(why(start)).toBe('tooFew');
    // 20 residents, 1 tool short
    expect(why({ ...crowd(start, 20), stock: { ...start.stock, ...cost, tools: 44 } })).toBe(
      'noStock',
    );
    // a full queue comes before both
    const kinds = ['cottage', 'farm', 'mine', 'workshop'];
    const filled = send(rich(), ...kinds.map((kind): Command => ({ type: 'build', kind })));
    expect(why(filled.state)).toBe('queueFull');
  });
});
