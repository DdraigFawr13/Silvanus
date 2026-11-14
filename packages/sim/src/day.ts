import { addSettler } from './people';
import type { Building, Content, Event, Resident, State } from './types';
import { addLog, bedsOf, hallOf, kindOf } from './util';

// At most one resident leaves in rules.leaveGapTicks (D-039, amending D-025's season).

type Term = { id: string; amount: number };

// The reasons a job in `building` gives: `fit` by the building's skill, `likes` and `dislikes`
// by the resident's traits. Nonzero ones only, in that order. The day's morale and the pin
// preview both read it, so the preview is what the day will count.
function jobTerms(resident: Resident, building: Building, content: Content): Term[] {
  const kind = kindOf(content, building.kind)!;
  const terms: Term[] = [];
  if (kind.skill !== null) {
    const skill = resident.skills[kind.skill] ?? 0;
    if (skill >= 60) terms.push({ id: 'fit', amount: 10 });
    else if (skill < 30) terms.push({ id: 'fit', amount: -10 });
  }
  const traits = resident.traits.map((id) => content.traits.find((t) => t.id === id)!);
  if (traits.some((t) => t.likes.includes(kind.id))) terms.push({ id: 'likes', amount: 10 });
  if (traits.some((t) => t.dislikes.includes(kind.id))) terms.push({ id: 'dislikes', amount: -10 });
  return terms;
}

// What a job in a building would bring a resident's morale, for the resident sheet's "Pin to…"
// (GAME-02). A building not yet built, or with no worker slots, brings nothing.
export function pinPreview(
  state: State,
  residentId: number,
  buildingId: number,
  content: Content,
): Term[] {
  const resident = state.residents.find((r) => r.id === residentId);
  const building = state.buildings.find((b) => b.id === buildingId);
  if (!resident || !building || building.tier === 0) return [];
  const kind = kindOf(content, building.kind)!;
  if (kind.tiers.every((tier) => tier.slots === 0)) return [];
  return jobTerms(resident, building, content);
}

// Rule 3, the start of a game day: eating, skills, morale, leaving, then arrival.
export function startDay(s: State, content: Content, events: Event[]): void {
  const count = s.residents.length;
  const need = count * content.rules.eatPerDay;
  const eaten = Math.min(need, s.stock.food);
  s.stock.food -= eaten;
  if (eaten > 0) events.push({ type: 'used', resource: 'food', amount: eaten });
  const fed = eaten === need;

  const byId = new Map(s.buildings.map((b) => [b.id, b]));
  for (const resident of s.residents) {
    const job = resident.jobId === null ? undefined : byId.get(resident.jobId);
    const skill = job ? kindOf(content, job.kind)!.skill : null;
    if (skill === null) continue;
    resident.workDays += 1;
    if (resident.workDays >= content.rules.skillDays) {
      resident.skills[skill] = Math.min(100, (resident.skills[skill] ?? 0) + 1);
      resident.workDays = 0;
    }
  }

  // read after eating
  const food = !fed ? -30 : s.stock.food >= 2 * count ? 10 : s.stock.food < count ? -5 : 0;
  const crowded = count > bedsOf(s, content);
  // workers in a cheering building (the Tavern) on the jobs from before this tick's jobs pass
  const cheering = s.residents.filter((r) => {
    const job = r.jobId === null ? undefined : byId.get(r.jobId);
    return job !== undefined && kindOf(content, job.kind)!.cheers === true;
  }).length;
  const tavern = Math.min(content.rules.tavernMax, cheering * content.rules.tavernPerWorker);
  for (const resident of s.residents) {
    const job = resident.jobId === null ? undefined : byId.get(resident.jobId);
    const terms: Term[] = [];
    if (food !== 0) terms.push({ id: 'food', amount: food });
    if (job) terms.push(...jobTerms(resident, job, content));
    else terms.push({ id: 'idle', amount: -10 });
    if (crowded) terms.push({ id: 'crowded', amount: -15 });
    if (tavern > 0) terms.push({ id: 'tavern', amount: tavern });
    const target = Math.max(0, Math.min(100, 50 + terms.reduce((sum, t) => sum + t.amount, 0)));
    const stepBy = content.rules.moraleStep;
    resident.morale += Math.max(-stepBy, Math.min(stepBy, target - resident.morale));
    // a new array: the input state's resident keeps its own
    resident.reasons = terms;
  }

  const { rules } = content;
  // Leaving: one at most every leaveGapTicks, never from a town of leaveFloor or fewer; the lowest morale
  // goes, ties by the lowest id (residents are kept in id order).
  if (s.residents.length > rules.leaveFloor && s.tick - s.lastLeftTick >= rules.leaveGapTicks) {
    let lowest: Resident | undefined;
    for (const r of s.residents) if (!lowest || r.morale < lowest.morale) lowest = r;
    if (lowest && lowest.morale < rules.leaveBelow) {
      const gone = lowest;
      s.residents = s.residents.filter((r) => r.id !== gone.id);
      s.lastLeftTick = s.tick;
      s.jobsDirty = true;
      events.push({ type: 'left', residentId: gone.id, name: gone.name });
      addLog(s, content, 'left', `${gone.name} has left ${content.town}.`);
    }
  }

  // Arrival: a free bed, room under the Hall's limit and food (after eating) for every head.
  const heads = s.residents.length;
  if (
    bedsOf(s, content) > heads &&
    heads < hallOf(s, content).residents &&
    s.stock.food >= rules.arrivalFoodPerHead * heads
  ) {
    const settler = addSettler(s, content);
    const people = content.peoples.find((p) => p.id === settler.people)!.name;
    s.jobsDirty = true;
    events.push({ type: 'arrived', residentId: settler.id, name: settler.name });
    addLog(s, content, 'arrived', `${settler.name}, a ${people}, has settled in ${content.town}.`);
  }
}
