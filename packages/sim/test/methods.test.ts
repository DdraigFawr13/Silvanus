import { describe, expect, test } from 'vitest';
import { advance, apply, assignJobs, newGame, perDay, refusal } from '../src/index';
import type { Building, Command, State } from '../src/index';
import { byKind, content, finished, run, workers } from './town';

// Every resident at skill 50 and morale 50, an effect of 100 in every slice (spec, "Journeys").
function steady(state: State): State {
  const residents = state.residents.map((r) => ({
    ...r,
    morale: 50,
    skills: Object.fromEntries(Object.keys(r.skills).map((id) => [id, 50])),
  }));
  return { ...state, residents };
}

// Seed 1 with a finished building of `kind` on `method` with `open` slots, jobs assigned.
function withBuilding(kind: string, method: string, open: number, stock = {}): State {
  const start = finished(steady(newGame(1, content)), kind);
  // a building already on `method` owns it
  const buildings = start.buildings.map((b): Building =>
    b.kind === kind
      ? { ...b, method, open, owned: b.owned.includes(method) ? b.owned : [...b.owned, method] }
      : b,
  );
  const state = JSON.parse(
    JSON.stringify({ ...start, buildings, stock: { ...start.stock, ...stock } }),
  ) as State;
  assignJobs(state, content);
  return state;
}

const shortLines = (state: State) => state.log.filter((line) => line.type === 'short');

describe('methods', () => {
  test('a short input drops to the basic method and comes back', () => {
    const town = withBuilding('workshop', 'forge', 1, { ore: 0 });
    const shop = byKind(town, 'workshop').id;
    expect(workers(town, shop)).toBe(1);

    // the first cycle runs at tick 3: one worker owes 25 ore, and 0 < 25
    const short = run(town, 4);
    const ran = byKind(short, 'workshop');
    expect(ran.method).toBe('forge');
    expect(ran.short).toBe(true);
    // Mend and make do: 5 hundredths at an effect of 100
    expect(ran.carry.tools).toBe(500);
    expect(ran.debt).toEqual({});
    expect(short.stock.ore).toBe(0);
    expect(shortLines(short).map((line) => line.text)).toEqual([
      'The Workshop ran short of ore and fell back to Mend and make do.',
    ]);

    // still short a cycle later: still one line
    const still = run(short, 4);
    expect(byKind(still, 'workshop').short).toBe(true);
    expect(byKind(still, 'workshop').carry.tools).toBe(1000);
    expect(shortLines(still)).toHaveLength(1);

    // ore arrives: the next cycle forges, owing what is not yet a whole unit
    const supplied: State = { ...still, stock: { ...still.stock, ore: 10 } };
    const back = run(supplied, 4);
    const forged = byKind(back, 'workshop');
    expect(forged.short).toBe(false);
    expect(forged.carry.tools).toBe(3500);
    expect(forged.debt).toEqual({ ore: 25, wood: 10 });
    expect(back.stock.ore).toBe(10);
    expect(shortLines(back)).toHaveLength(1);

    // four forging cycles owe 100 ore hundredths: one whole ore is taken
    const later = run(back, 12);
    expect(later.stock.ore).toBe(9);
    expect(byKind(later, 'workshop').debt.ore).toBe(0);
  });

  test('retooling costs a game day', () => {
    // a Workshop on Mend buys Forge tools: paid once, then a game day with nothing made
    const town = withBuilding('workshop', 'mend', 1, { wood: 60, stone: 30, ore: 50 });
    const shop = byKind(town, 'workshop').id;
    expect(workers(town, shop)).toBe(1);
    const command: Command = { type: 'setMethod', buildingId: shop, method: 'forge' };
    const sent = apply(town, [command], content);
    expect(sent.events).toEqual([]);
    expect(byKind(sent.state, 'workshop').method).toBe('forge');
    expect(byKind(sent.state, 'workshop').retoolLeft).toBe(24);

    const day = run(sent.state, 24);
    expect(byKind(day, 'workshop').carry).toEqual({});
    expect(byKind(day, 'workshop').debt).toEqual({});
    expect(day.stock.ore).toBe(50);
    expect(byKind(day, 'workshop').retoolLeft).toBe(0);
    // the cycle at tick 27 forges: 25 hundredths of a tool at an effect of 100
    const after = run(day, 4);
    expect(byKind(after, 'workshop').carry.tools).toBe(2500);
    expect(byKind(after, 'workshop').debt).toEqual({ ore: 25, wood: 10 });
  });

  test('a method is bought once, then switching is quick and free', () => {
    const town = withBuilding('workshop', 'mend', 1, { wood: 60, stone: 30 });
    const shop = byKind(town, 'workshop').id;
    expect(byKind(town, 'workshop').owned).toEqual(['mend']);
    const to = (method: string): Command => ({ type: 'setMethod', buildingId: shop, method });

    // buying Forge tools pays its cost once
    const bought = apply(town, [to('forge')], content).state;
    expect(bought.stock.wood).toBe(40);
    expect(bought.stock.stone).toBe(20);
    expect(byKind(bought, 'workshop').owned).toEqual(['mend', 'forge']);

    // back to Mend, then to Forge again: owned, so free and 4 ticks each
    const back = apply(bought, [to('mend')], content).state;
    expect(byKind(back, 'workshop').retoolLeft).toBe(4);
    const again = apply(back, [to('forge')], content).state;
    expect(byKind(again, 'workshop').retoolLeft).toBe(4);
    expect(again.stock.wood).toBe(40);
    expect(again.stock.stone).toBe(20);
    // a switch to an owned method makes again after one cycle
    expect(byKind(run(again, 4), 'workshop').retoolLeft).toBe(0);

    // short of the price: refused, and nothing changes
    const poor: State = { ...town, stock: { ...town.stock, stone: 9 } };
    const refused = apply(poor, [to('forge')], content);
    expect(refused.events).toEqual([{ type: 'rejected', command: to('forge'), reason: 'noStock' }]);
    expect(refused.state).toEqual(poor);

    // the Mine owns both its tier 1 methods from the start
    const mineTown = withBuilding('mine', 'ore', 4);
    const mine = byKind(mineTown, 'mine');
    expect(mine.owned).toEqual(['ore', 'stone']);
    const quarry = apply(
      mineTown,
      [{ type: 'setMethod', buildingId: mine.id, method: 'stone' }],
      content,
    );
    expect(byKind(quarry.state, 'mine').retoolLeft).toBe(4);
    expect(quarry.state.stock).toEqual(mineTown.stock);

    // clearing the lot loses what it bought: a new Workshop owns only Mend
    const cleared = apply(again, [{ type: 'clear', buildingId: shop }], content).state;
    const rich: State = { ...cleared, stock: { ...cleared.stock, wood: 100, stone: 100 } };
    const rebuilt = apply(rich, [{ type: 'build', kind: 'workshop' }], content).state;
    expect(byKind(rebuilt, 'workshop').owned).toEqual(['mend']);
  });

  test("setMethod refuses another building's, a locked, an unknown or the same method", () => {
    const town = withBuilding('mine', 'ore', 4);
    const mine = byKind(town, 'mine').id;
    const why = (method: string) =>
      refusal(town, { type: 'setMethod', buildingId: mine, method }, content);
    expect(why('stone')).toBeNull();
    expect(byKind(town, 'mine').owned).toEqual(['ore', 'stone']);
    expect(why('ore')).toBe('same');
    expect(why('shafts')).toBe('notAllowed');
    expect(why('gather')).toBe('notAllowed');
    expect(why('nothing')).toBe('unknown');
    const cottage = byKind(town, 'cottage').id;
    expect(refusal(town, { type: 'setMethod', buildingId: cottage, method: 'ore' }, content)).toBe(
      'notAllowed',
    );
  });

  test('perDay gives what a worker makes and uses in a game day', () => {
    expect(perDay(content, 'forge')).toEqual({
      makes: { tools: 150 },
      uses: { ore: 150, wood: 60 },
    });
    expect(perDay(content, 'ore')).toEqual({ makes: { ore: 180 }, uses: {} });
  });

  test('the summary counts the cycles a building ran short', () => {
    const town = withBuilding('workshop', 'forge', 1, { ore: 0 });
    const shop = byKind(town, 'workshop').id;
    const { summary } = advance(town, 100, content);
    expect(summary.shortCycles).toEqual({ [shop]: 25 });
    expect(summary.made.tools).toBe(1);
    expect(summary.used.ore).toBeUndefined();
  });
});
