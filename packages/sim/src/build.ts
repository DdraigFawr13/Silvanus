import type { Amounts, Command, Content, Event, Reason, State } from './types';
import { addLog, capsOf, covers, hallOf, kindOf, slotsOf } from './util';

const isWhole = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);
const hasJob = (state: State, target: 'hall' | number) =>
  state.queue.some((job) => job.target === target);

// What a build or an upgrade takes from stock now. A `freeWhenNone` kind is free while the town
// has none, counting ones still being built. {} for other commands and for unknown targets.
export function jobCost(state: State, command: Command, content: Content): Amounts {
  if (command.type === 'build') {
    const kind = kindOf(content, command.kind);
    if (!kind) return {};
    if (kind.freeWhenNone && !state.buildings.some((b) => b.kind === kind.id)) return {};
    return kind.tiers[0].cost;
  }
  if (command.type === 'upgrade') {
    const building = state.buildings.find((b) => b.id === command.buildingId);
    if (!building) return {};
    return kindOf(content, building.kind)!.tiers[building.tier]?.cost ?? {};
  }
  return {};
}

// Why a command would be refused, or null when it would be carried out. `apply` runs this same
// check, and the screens call it to say why a control is off (GAME-02). The first failure in
// this order gives the reason: unknown, the target's state (notReady, busy, range), same,
// notAllowed, noLot, queueFull, tooFew, noStock.
export function refusal(state: State, command: Command, content: Content): Reason | null {
  const queueFull = state.queue.length >= 1 + content.rules.queueMax;
  const building =
    'buildingId' in command && command.buildingId !== null
      ? state.buildings.find((b) => b.id === command.buildingId)
      : undefined;
  switch (command.type) {
    case 'build': {
      if (!kindOf(content, command.kind)) return 'unknown';
      if (state.buildings.length >= hallOf(state, content).lots) return 'noLot';
      if (queueFull) return 'queueFull';
      return covers(state.stock, jobCost(state, command, content)) ? null : 'noStock';
    }
    case 'upgrade': {
      if (!building) return 'unknown';
      if (building.tier === 0) return 'notReady';
      if (hasJob(state, building.id)) return 'busy';
      if (building.tier >= kindOf(content, building.kind)!.tiers.length) return 'range';
      if (queueFull) return 'queueFull';
      return covers(state.stock, jobCost(state, command, content)) ? null : 'noStock';
    }
    case 'upgradeHall':
      // arrives in S5
      return 'notAllowed';
    case 'cancelJob':
      return isWhole(command.index) && command.index >= 1 && command.index < state.queue.length
        ? null
        : 'range';
    case 'clear': {
      if (!building) return 'unknown';
      if (building.tier === 0) return 'notReady';
      return hasJob(state, building.id) ? 'busy' : null;
    }
    case 'setMethod': {
      if (!building) return 'unknown';
      if (building.tier === 0) return 'notReady';
      // arrives in S3
      return building.method === command.method ? 'same' : 'notAllowed';
    }
    case 'setOpen': {
      if (!building) return 'unknown';
      if (building.tier === 0) return 'notReady';
      if (!isWhole(command.count) || command.count < 0) return 'range';
      if (command.count > slotsOf(content, building)) return 'range';
      return command.count === building.open ? 'same' : null;
    }
    case 'pin': {
      const resident = state.residents.find((r) => r.id === command.residentId);
      if (!resident) return 'unknown';
      if (command.buildingId !== null) {
        if (!building) return 'unknown';
        if (building.tier === 0) return 'notReady';
        if (slotsOf(content, building) === 0) return 'range';
      }
      return resident.pinnedTo === command.buildingId ? 'same' : null;
    }
    default: {
      const never: never = command;
      void never;
      return 'unknown';
    }
  }
}

function pay(s: State, cost: Amounts): void {
  for (const [id, amount] of Object.entries(cost)) s.stock[id] -= amount;
}

// Stock above a cap is cut to it at once and counted as lost (a Storehouse was cleared).
function cutToCaps(s: State, content: Content, events: Event[]): void {
  const caps = capsOf(s, content);
  for (const resource of content.resources) {
    const over = s.stock[resource.id] - caps[resource.id];
    if (over <= 0) continue;
    s.stock[resource.id] = caps[resource.id];
    events.push({ type: 'capLost', resource: resource.id, amount: over });
    const text = `${over} ${resource.name.toLowerCase()} was lost when storage shrank.`;
    addLog(s, content, 'capLost', text);
  }
}

// Carries out a command that `refusal` has passed. Changes the draft it is given.
export function carryOut(s: State, command: Command, content: Content, events: Event[]): void {
  switch (command.type) {
    case 'build': {
      const kind = kindOf(content, command.kind)!;
      const cost = jobCost(s, command, content);
      pay(s, cost);
      const id = s.nextId++;
      const first = content.methods.find((method) => method.building === kind.id);
      s.buildings.push({
        id,
        kind: kind.id,
        tier: 0,
        method: first ? first.id : null,
        open: 0,
        retoolLeft: 0,
        carry: {},
        debt: {},
        short: false,
      });
      s.queue.push({ target: id, toTier: 1, ticksLeft: kind.tiers[0].ticks, cost });
      s.jobsDirty = true;
      return;
    }
    case 'upgrade': {
      const building = s.buildings.find((b) => b.id === command.buildingId)!;
      const cost = jobCost(s, command, content);
      pay(s, cost);
      const ticks = kindOf(content, building.kind)!.tiers[building.tier].ticks;
      s.queue.push({ target: building.id, toTier: building.tier + 1, ticksLeft: ticks, cost });
      return;
    }
    case 'cancelJob': {
      const [job] = s.queue.splice(command.index, 1);
      const caps = capsOf(s, content);
      for (const [id, amount] of Object.entries(job.cost)) {
        const back = Math.min(amount, caps[id] - s.stock[id]);
        s.stock[id] += back;
        if (amount > back) events.push({ type: 'lost', resource: id, amount: amount - back });
      }
      if (job.toTier === 1 && job.target !== 'hall') {
        s.buildings = s.buildings.filter((b) => b.id !== job.target);
      }
      return;
    }
    case 'clear': {
      const building = s.buildings.find((b) => b.id === command.buildingId)!;
      const kind = kindOf(content, building.kind)!;
      s.buildings = s.buildings.filter((b) => b.id !== building.id);
      for (const resident of s.residents) {
        if (resident.jobId === building.id) resident.jobId = null;
        if (resident.pinnedTo === building.id) resident.pinnedTo = null;
      }
      events.push({ type: 'cleared', kind: kind.id, tier: building.tier });
      addLog(s, content, 'cleared', `The ${kind.name} was cleared from its lot.`);
      cutToCaps(s, content, events);
      s.jobsDirty = true;
      return;
    }
    case 'setOpen': {
      s.buildings.find((b) => b.id === command.buildingId)!.open = command.count;
      s.jobsDirty = true;
      return;
    }
    case 'pin': {
      s.residents.find((r) => r.id === command.residentId)!.pinnedTo = command.buildingId;
      s.jobsDirty = true;
      return;
    }
    case 'setMethod':
    case 'upgradeHall':
      // refused in this slice; `refusal` never lets them through
      return;
    default: {
      const never: never = command;
      void never;
    }
  }
}

// Rule 2: the job at the front of the queue loses one tick; at 0 its target takes the new tier.
export function construct(s: State, content: Content, events: Event[]): void {
  const job = s.queue[0];
  if (!job) return;
  job.ticksLeft -= 1;
  if (job.ticksLeft > 0) return;
  s.queue.shift();
  s.jobsDirty = true;
  if (job.target === 'hall') {
    s.hallTier = job.toTier;
    return;
  }
  const building = s.buildings.find((b) => b.id === job.target)!;
  const kind = kindOf(content, building.kind)!;
  const before = slotsOf(content, building);
  building.tier = job.toTier;
  const slots = slotsOf(content, building);
  if (job.toTier === 1) {
    building.open = slots;
    events.push({ type: 'built', kind: kind.id, tier: 1 });
    addLog(s, content, 'built', `The ${kind.name} is built.`);
  } else {
    building.open += slots - before;
    events.push({ type: 'upgraded', kind: kind.id, tier: job.toTier });
    addLog(s, content, 'upgraded', `The ${kind.name} is now tier ${job.toTier}.`);
  }
}
