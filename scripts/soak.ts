// Soak (J10). Pass 1: seed 1, a bot that sends random commands, 10,000 ticks, every invariant
// checked after every tick, then the recorded script replayed in chunks. Pass 2: a scripted
// player that must reach the Village in 1,200 to 2,200 ticks. Pass 3: that town starved for a
// night at 20 residents, which must lose at most 3 and be back to 20 within 2,000 ticks.
import { content } from '@silvanus/content';
import {
  advance,
  apply,
  bedsOf,
  capsOf,
  hallOf,
  newGame,
  nextU32,
  refusal,
  slotsOf,
  step,
} from '@silvanus/sim';
import type { Command, State } from '@silvanus/sim';

const TICKS = 10_000;
const MIN_TICKS_PER_S = 20_000;
const REPLAY_CHUNK = 97;

let state = newGame(1, content);
let bot = 99;

function fail(message: string): never {
  console.error(`soak failed at tick ${state.tick}: ${message}`);
  process.exit(1);
}

function roll(n: number): number {
  const next = nextU32(bot);
  bot = next.state;
  return next.value % n;
}

// The command types the engine carries out.
const TYPES = [
  'build',
  'upgrade',
  'cancelJob',
  'clear',
  'setOpen',
  'pin',
  'setMethod',
  'upgradeHall',
] as const;

// How often the bot picks each type: building and upgrading lead, and a clear is rare, so the
// town grows instead of being torn down as fast as it is built (M1 audit F1).
const WEIGHTS: [(typeof TYPES)[number], number][] = [
  ['build', 6],
  ['upgrade', 4],
  ['cancelJob', 2],
  ['clear', 1],
  ['setOpen', 2],
  ['pin', 2],
  ['setMethod', 3],
  ['upgradeHall', 1],
];
const WEIGHT_TOTAL = WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

function randomType(): (typeof TYPES)[number] {
  let pick = roll(WEIGHT_TOTAL);
  for (const [type, weight] of WEIGHTS) {
    if (pick < weight) return type;
    pick -= weight;
  }
  return 'build';
}

// Ids come from the living, kinds from content and counts from 0 to 9, so some are refused.
function randomCommand(s: State): Command {
  const building = () => (s.buildings.length ? s.buildings[roll(s.buildings.length)].id : 0);
  const type = randomType();
  switch (type) {
    case 'build':
      return { type, kind: content.buildings[roll(content.buildings.length)].id };
    case 'upgrade':
      return { type, buildingId: building() };
    case 'clear':
      // one clear in two becomes an upgrade, so the town keeps more of what it builds
      return { type: roll(2) === 0 ? 'clear' : 'upgrade', buildingId: building() };
    case 'cancelJob':
      // mostly a waiting job when there is one, so some cancels are carried out
      return s.queue.length > 1 && roll(4) !== 0
        ? { type, index: 1 + roll(s.queue.length - 1) }
        : { type, index: roll(content.rules.queueMax + 2) };
    case 'setOpen':
      return { type, buildingId: building(), count: roll(10) };
    case 'setMethod': {
      // mostly one of that building's own methods, so some switches and purchases go through
      const buildingId = building();
      const kind = s.buildings.find((b) => b.id === buildingId)?.kind;
      const own = content.methods.filter((m) => m.building === kind);
      const from = own.length && roll(4) !== 0 ? own : content.methods;
      return { type, buildingId, method: from[roll(from.length)].id };
    }
    case 'pin': {
      const residentId = s.residents.length ? s.residents[roll(s.residents.length)].id : 0;
      return { type, residentId, buildingId: roll(4) === 0 ? null : building() };
    }
    case 'upgradeHall':
      return { type };
  }
}

const whole = (n: unknown, max: number) =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;

function check(s: State): void {
  const caps = capsOf(s, content);
  for (const resource of content.resources) {
    if (!whole(s.stock[resource.id], caps[resource.id])) {
      fail(
        `${resource.id} is ${s.stock[resource.id]}, not a whole number up to ${caps[resource.id]}`,
      );
    }
  }
  const hall = hallOf(s, content);
  if (s.residents.length > hall.residents) fail(`${s.residents.length} residents`);
  if (s.buildings.length > hall.lots) fail(`${s.buildings.length} buildings on ${hall.lots} lots`);
  if (s.queue.length > 1 + content.rules.queueMax) fail(`${s.queue.length} jobs in the queue`);
  if (s.log.length > content.rules.logMax) fail(`${s.log.length} log lines`);
  const living = new Map(s.buildings.map((b) => [b.id, 0]));
  for (const resident of s.residents) {
    for (const id of [resident.jobId, resident.pinnedTo]) {
      if (id !== null && !living.has(id)) fail(`${resident.name} points at building ${id}`);
    }
    if (resident.jobId !== null) living.set(resident.jobId, living.get(resident.jobId)! + 1);
    if (!whole(resident.morale, 100)) fail(`${resident.name} has morale ${resident.morale}`);
    for (const [skill, value] of Object.entries(resident.skills)) {
      if (!whole(value, 100)) fail(`${resident.name} has ${skill} ${value}`);
    }
  }
  for (const building of s.buildings) {
    if (building.method !== null && !building.owned.includes(building.method)) {
      fail(`${building.kind} ${building.id} runs ${building.method}, which it does not own`);
    }
    if (!whole(building.retoolLeft, content.rules.retoolTicks)) {
      fail(`${building.kind} ${building.id} has ${building.retoolLeft} ticks of retooling`);
    }
    if (!whole(building.open, slotsOf(content, building))) {
      fail(`${building.kind} ${building.id} has ${building.open} open slots`);
    }
    if (living.get(building.id)! > building.open) {
      fail(`${building.kind} ${building.id} has more workers than open slots`);
    }
  }
  for (const [stream, value] of Object.entries(s.rng)) {
    if (!whole(value, 4294967295)) fail(`rng ${stream} is ${value}`);
  }
  // Ids are never shared, every job points at the Hall or a living building, and production
  // leftovers stay below one whole unit (carry) and one unit owed (debt).
  const buildingIds = new Set(s.buildings.map((b) => b.id));
  if (buildingIds.size !== s.buildings.length) fail('two buildings share an id');
  if (new Set(s.residents.map((r) => r.id)).size !== s.residents.length) {
    fail('two residents share an id');
  }
  for (const id of [...buildingIds, ...s.residents.map((r) => r.id)]) {
    if (id >= s.nextId) fail(`id ${id} is not below nextId ${s.nextId}`);
  }
  for (const job of s.queue) {
    if (job.target !== 'hall' && !buildingIds.has(job.target)) {
      fail(`a job points at building ${job.target}, which is gone`);
    }
  }
  for (const building of s.buildings) {
    for (const [resource, value] of Object.entries(building.carry)) {
      if (!whole(value, 9_999))
        fail(`${building.kind} ${building.id} carries ${value} ${resource}`);
    }
    for (const [resource, value] of Object.entries(building.debt)) {
      if (!whole(value, 99)) fail(`${building.kind} ${building.id} owes ${value} ${resource}`);
    }
  }
}

const script: { tick: number; command: Command }[] = [];
let largest = 0;
let refused = 0;
let stepping = 0n;
const builtKinds = new Set<string>();
const sent = new Map<string, number>();
const turnedDown = new Map<string, number>();
let peakBuildings = 0;
let peakResidents = 0;
let peakQueue = 0;
for (let i = 0; i < TICKS; i++) {
  const commands: Command[] = [];
  if (roll(8) === 0) {
    const command = randomCommand(state);
    commands.push(command);
    script.push({ tick: state.tick, command });
    sent.set(command.type, (sent.get(command.type) ?? 0) + 1);
  }
  const before = state.tick;
  const started = process.hrtime.bigint();
  const result = step(state, commands, content);
  stepping += process.hrtime.bigint() - started;
  state = result.state;
  if (state.tick !== before + 1) fail(`tick went from ${before} to ${state.tick}`);
  check(state);
  for (const event of result.events) {
    if (event.type === 'rejected') {
      refused += 1;
      turnedDown.set(event.command.type, (turnedDown.get(event.command.type) ?? 0) + 1);
    }
    if (event.type === 'built') builtKinds.add(event.kind);
  }
  largest = Math.max(largest, JSON.stringify(state).length);
  peakBuildings = Math.max(peakBuildings, state.buildings.length);
  peakResidents = Math.max(peakResidents, state.residents.length);
  peakQueue = Math.max(peakQueue, state.queue.length);
}

// The bot must have done something, or the invariants were checked on an idle town.
if (script.length - refused < 20) fail(`only ${script.length - refused} commands were carried out`);
if (refused === 0) fail('no command was refused');
if (builtKinds.size < 3) fail(`only ${builtKinds.size} kinds of building were built`);
// The town grew and most player commands were carried out (M1 audit F1). Residents' growth is
// pass 2's to prove: one bot seed in eight tried never grew past its founders.
const done = (type: string) => (sent.get(type) ?? 0) - (turnedDown.get(type) ?? 0);
// A random bot reaches upgrades and cancels only by luck (an upgrade needs tools, a cancel a second
// job waiting), so upgrades are pass 2's to prove, and cancelJob is build.test.ts's.
for (const type of ['build', 'clear', 'setOpen', 'pin', 'setMethod'] as const) {
  if (done(type) === 0) fail(`no ${type} command was carried out`);
}
if (peakBuildings < 5) fail(`the town never had more than ${peakBuildings} buildings`);

// The same script as commands between chunks of catch-up must give the same town (D-002).
let replay = newGame(1, content);
let at = 0;
while (replay.tick < TICKS) {
  if (at < script.length && script[at].tick === replay.tick) {
    replay = apply(replay, [script[at].command], content).state;
    at += 1;
  }
  const next = at < script.length ? script[at].tick : TICKS;
  const chunk = Math.min(REPLAY_CHUNK, next - replay.tick, TICKS - replay.tick);
  replay = advance(replay, chunk, content).state;
}
if (JSON.stringify(replay) !== JSON.stringify(state))
  fail('the replay in chunks gave another town');

const perSecond = Math.round(TICKS / Math.max(Number(stepping) / 1e9, 1e-9));
console.log(
  `pass 1: ticks=${state.tick} commands=${script.length} refused=${refused} ` +
    `kinds_built=${builtKinds.size} buildings=${state.buildings.length} peak_buildings=${peakBuildings} ` +
    `peak_residents=${peakResidents} peak_queue=${peakQueue} carried=${TYPES.map((t) => `${t}:${done(t)}`).join(',')} ` +
    `largest_save_bytes=${largest} ticks_per_s=${perSecond}`,
);
if (perSecond < MIN_TICKS_PER_S) fail(`${perSecond} ticks per second is under ${MIN_TICKS_PER_S}`);

// Pass 2: the scripted player (its rules are in the spec's build notes, S5). Each tick its
// commands are decided in order, each on the town the ones before it left, and only sent when
// they would be carried out.
const BAND = { from: 1200, to: 2200 };
const ORDER = ['woodcutter', 'cottage', 'mine', 'workshop'];
const RECOVER_TICKS = 2000;
const NIGHT = 480;

function scripted(s: State, ordered: { next: number }): Command[] {
  const sent: Command[] = [];
  let town = s;
  const send = (command: Command) => {
    if (refusal(town, command, content) !== null) return;
    town = apply(town, [command], content).state;
    sent.push(command);
  };
  const of = (kind: string) => town.buildings.filter((b) => b.kind === kind && b.tier > 0);
  send({ type: 'upgradeHall' });
  if (ordered.next < ORDER.length) {
    const before = town.buildings.length;
    send({ type: 'build', kind: ORDER[ordered.next] });
    if (town.buildings.length > before) ordered.next += 1;
  }
  const stock = town.stock;
  for (const mine of of('mine')) {
    const want = stock.stone < 190 ? 'stone' : stock.ore < 60 && stock.tools < 45 ? 'ore' : 'stone';
    if (mine.method !== want) send({ type: 'setMethod', buildingId: mine.id, method: want });
  }
  for (const shop of of('workshop')) {
    if (shop.method !== 'forge' && town.stock.ore >= 10) {
      send({ type: 'setMethod', buildingId: shop.id, method: 'forge' });
    }
  }
  for (const hut of of('forager')) {
    if (hut.tier === 1 && town.stock.tools >= 5) send({ type: 'upgrade', buildingId: hut.id });
    if (hut.tier >= 2 && hut.method === 'gather') {
      send({ type: 'setMethod', buildingId: hut.id, method: 'snares' });
    }
  }
  const heads = town.residents.length;
  if (bedsOf(town, content) === heads && town.stock.food >= 2 * heads) {
    const cottages = of('cottage');
    const lowest = cottages.reduce<State['buildings'][number] | undefined>(
      (low, b) => (!low || b.tier < low.tier ? b : low),
      undefined,
    );
    if (lowest) send({ type: 'upgrade', buildingId: lowest.id });
  }
  for (const camp of of('woodcutter')) {
    const slots = slotsOf(content, camp);
    if (town.stock.wood >= 195 && camp.open !== 1) {
      send({ type: 'setOpen', buildingId: camp.id, count: 1 });
    } else if (town.stock.wood < 100 && camp.open !== slots) {
      send({ type: 'setOpen', buildingId: camp.id, count: slots });
    }
  }
  return sent;
}

state = newGame(1, content);
const ordered = { next: 0 };
let villageTick = -1;
let at20: State | null = null;
let sentCount = 0;
let upgrades = 0;
let mostLeft = 0;
while (villageTick < 0 && state.tick < BAND.to + 1000) {
  const commands = scripted(state, ordered);
  sentCount += commands.length;
  upgrades += commands.filter((c) => c.type === 'upgrade').length;
  const result = step(state, commands, content);
  for (const event of result.events) {
    if (event.type === 'rejected') fail(`the scripted bot sent a refused ${event.command.type}`);
    if (event.type === 'left') mostLeft += 1;
  }
  state = result.state;
  check(state);
  if (at20 === null && state.residents.length >= 20) at20 = state;
  if (state.hallTier === 2) villageTick = state.tick;
}
console.log(
  `pass 2: village_tick=${villageTick} commands=${sentCount} residents=${state.residents.length} ` +
    `left=${mostLeft} twentieth_at=${at20?.tick ?? -1} upgrades=${upgrades}`,
);
if (upgrades === 0) fail('the scripted town never upgraded a building');
if (villageTick < BAND.from || villageTick > BAND.to) {
  fail(
    `the scripted bot reached the Village at tick ${villageTick}, outside ${BAND.from} to ${BAND.to}`,
  );
}
if (at20 === null) fail('the scripted town never reached 20 residents');

// Pass 3: the town at its 20th resident, with no food and no food workers for a night.
const food = (s: State) => s.buildings.filter((b) => b.kind === 'forager' || b.kind === 'farm');
state = { ...at20, stock: { ...at20.stock, food: 0 } };
const reopen = food(state).map((b): Command => ({
  type: 'setOpen',
  buildingId: b.id,
  count: slotsOf(content, b),
}));
state = apply(
  state,
  food(state).map((b): Command => ({ type: 'setOpen', buildingId: b.id, count: 0 })),
  content,
).state;
const night = advance(state, NIGHT, content);
state = night.state;
check(state);
const lost = night.summary.left.length;
if (lost > 3 || lost < 1) fail(`${lost} left in a hungry night, not 1 to 3`);
state = apply(state, reopen, content).state;
const fedAt = state.tick;
while (state.residents.length < 20 && state.tick - fedAt < RECOVER_TICKS) {
  state = step(state, [], content).state;
  check(state);
}
console.log(
  `pass 3: start_tick=${at20.tick} left_in_night=${lost} ` +
    `back_to_20_after=${state.residents.length >= 20 ? state.tick - fedAt : -1}`,
);
if (state.residents.length < 20) {
  fail(`${state.residents.length} residents ${RECOVER_TICKS} ticks after food returned`);
}
