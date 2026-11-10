import type { Content, Event, State } from './types';
import { capsOf, methodOf } from './util';

// Until S4 every worker works at 100 percent; then skill and morale set it.
const EFFECT = 100;

// Rule 5: one production cycle, buildings in lot order. Rates are hundredths of a unit per
// worker; what is made and not yet whole waits in `carry`, in ten-thousandths.
export function produce(s: State, content: Content, events: Event[]): void {
  const caps = capsOf(s, content);
  for (const building of s.buildings) {
    const method = methodOf(content, building.method);
    if (building.tier === 0 || !method || building.retoolLeft > 0) continue;
    let workers = 0;
    for (const resident of s.residents) if (resident.jobId === building.id) workers += 1;
    if (workers === 0) continue;
    const makes = Object.entries(method.makes);
    // full stores: nothing is taken, made or lost
    if (makes.every(([id]) => s.stock[id] >= caps[id])) continue;
    for (const [id, rate] of makes) {
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
