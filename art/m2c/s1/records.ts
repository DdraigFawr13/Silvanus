// M2c S1 mock-up (2026-11-18): the two towns the mock-up shows, as schema 4 save records.
// Usage: npx tsx art/m2c/s1/records.ts <out_dir>  (writes day1.json and village.json). Not game code.
import fs from 'node:fs';
import { content } from '@silvanus/content';
import { assignJobs, kindOf, newGame } from '@silvanus/sim';
import type { Building, State } from '@silvanus/sim';
const out = process.argv[2];
const day1 = newGame(1, content);
const v: State = structuredClone(day1);
v.hallTier = 2;
const add = (kind: string, tier: number): Building => {
  const k = kindOf(content, kind)!;
  const first = content.methods.find((m) => m.building === kind);
  const b: Building = {
    id: v.nextId++, kind, tier, method: first ? first.id : null,
    open: tier > 0 ? k.tiers[tier - 1].slots : 0, retoolLeft: 0, carry: {}, debt: {}, short: false,
    owned: first ? [first.id] : [],
  };
  v.buildings.push(b);
  return b;
};
v.buildings[0].tier = 2; // the first Cottage, upgraded
for (const [kind, tier] of [['woodcutter', 1], ['farm', 1], ['mine', 1], ['workshop', 1], ['cottage', 1], ['storehouse', 1], ['tavern', 1]] as const) add(kind, tier);
const building = add('cottage', 0);
v.queue = [{ target: building.id, toTier: 1, ticksLeft: 3, cost: { wood: 30 } }];
// 25 residents (the Village's ask), copies of the founders, as tests/browser/helpers.ts crowd() does
const residents = v.residents.slice();
for (let i = 0; residents.length < 25; i++) {
  const m = v.residents[i % v.residents.length];
  residents.push({ ...m, id: v.nextId++, name: `${m.name} ${i + 2}`, jobId: null, pinnedTo: null });
}
v.residents = residents; assignJobs(v, content);
v.stock = { food: 160, wood: 140, stone: 90, ore: 40, tools: 30 };
for (const [name, s] of [['day1', day1], ['village', v]] as const)
  fs.writeFileSync(`${out}/${name}.json`, JSON.stringify({ schema: 4, anchorMs: 0, state: s }));
console.log(v.buildings.map((b) => `${b.id}:${b.kind}:${b.tier}`).join(' '));
