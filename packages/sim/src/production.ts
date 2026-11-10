import type { Building, Content, Event, State } from './types';
import { DAY_TICKS, addLog, capsOf, kindOf, methodOf } from './util';

// Until S4 every worker works at 100 percent; then skill and morale set it.
const EFFECT = 100;

const workersIn = (s: State, building: Building) =>
  s.residents.filter((resident) => resident.jobId === building.id).length;

// What one worker on a method makes and uses in a game day, in hundredths of a unit. For the
// building sheet, so the screen computes no rate itself (GAME-02).
export function perDay(
  content: Content,
  methodId: string,
): { makes: Record<string, number>; uses: Record<string, number> } {
  const method = methodOf(content, methodId)!;
  const cycles = DAY_TICKS / content.cycleTicks;
  const scale = (amounts: Record<string, number>) =>
    Object.fromEntries(Object.entries(amounts).map(([id, rate]) => [id, rate * cycles]));
  return { makes: scale(method.makes), uses: scale(method.uses) };
}

// The first input, in the method's listed order, that the stock cannot pay for this cycle;
// null when every input can be paid. Production and the building sheet share it.
export function shortInput(s: State, building: Building, content: Content): string | null {
  const method = methodOf(content, building.method);
  if (!method) return null;
  const workers = workersIn(s, building);
  for (const [id, rate] of Object.entries(method.uses)) {
    if (s.stock[id] * 100 < (building.debt[id] ?? 0) + rate * workers) return id;
  }
  return null;
}

// Rule 5: one production cycle, buildings in lot order. Rates are hundredths of a unit per
// worker; what is made and not yet whole waits in `carry`, in ten-thousandths, and what is owed
// and not yet a whole unit waits in `debt`, in hundredths. A method short of an input runs its
// fallback for the cycle and owes nothing.
export function produce(s: State, content: Content, events: Event[]): void {
  const caps = capsOf(s, content);
  for (const building of s.buildings) {
    const chosen = methodOf(content, building.method);
    if (building.tier === 0 || !chosen || building.retoolLeft > 0) continue;
    const workers = workersIn(s, building);
    if (workers === 0) continue;
    // full stores: nothing is taken, made or lost, and `short` stays as it was
    if (Object.keys(chosen.makes).every((id) => s.stock[id] >= caps[id])) continue;

    let ran = chosen;
    const missing = shortInput(s, building, content);
    if (missing !== null) {
      ran = methodOf(content, chosen.fallback)!;
      if (!building.short) {
        const kind = kindOf(content, building.kind)!;
        const resource = content.resources.find((r) => r.id === missing)!.name.toLowerCase();
        events.push({ type: 'short', buildingId: building.id, resource: missing });
        addLog(
          s,
          content,
          'short',
          `The ${kind.name} ran short of ${resource} and fell back to ${ran.name}.`,
        );
      }
      building.short = true;
      events.push({ type: 'fellBack', buildingId: building.id });
    } else {
      for (const [id, rate] of Object.entries(chosen.uses)) {
        const owed = (building.debt[id] ?? 0) + rate * workers;
        const whole = Math.floor(owed / 100);
        s.stock[id] -= whole;
        building.debt[id] = owed % 100;
        if (whole > 0) events.push({ type: 'used', resource: id, amount: whole });
      }
      building.short = false;
    }

    for (const [id, rate] of Object.entries(ran.makes)) {
      const carried = (building.carry[id] ?? 0) + rate * EFFECT * workers;
      const whole = Math.floor(carried / 10000);
      building.carry[id] = carried % 10000;
      if (whole === 0) continue;
      const kept = Math.min(whole, caps[id] - s.stock[id]);
      s.stock[id] += kept;
      if (kept > 0) events.push({ type: 'made', resource: id, amount: kept });
      if (whole > kept) events.push({ type: 'lost', resource: id, amount: whole - kept });
    }
  }
}
