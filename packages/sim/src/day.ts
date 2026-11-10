import type { Building, Content, Event, Resident, State } from './types';
import { bedsOf, kindOf } from './util';

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
// (GAME-02). A building with no worker slots brings nothing.
export function pinPreview(
  state: State,
  residentId: number,
  buildingId: number,
  content: Content,
): Term[] {
  const resident = state.residents.find((r) => r.id === residentId);
  const building = state.buildings.find((b) => b.id === buildingId);
  if (!resident || !building) return [];
  const kind = kindOf(content, building.kind)!;
  if (kind.tiers.every((tier) => tier.slots === 0)) return [];
  return jobTerms(resident, building, content);
}

// Rule 3, the start of a game day: eating, skills, then morale. Leaving and arrival join it in
// S5, and so does the tavern's term.
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
  for (const resident of s.residents) {
    const job = resident.jobId === null ? undefined : byId.get(resident.jobId);
    const terms: Term[] = [];
    if (food !== 0) terms.push({ id: 'food', amount: food });
    if (job) terms.push(...jobTerms(resident, job, content));
    else terms.push({ id: 'idle', amount: -10 });
    if (crowded) terms.push({ id: 'crowded', amount: -15 });
    const target = Math.max(0, Math.min(100, 50 + terms.reduce((sum, t) => sum + t.amount, 0)));
    const stepBy = content.rules.moraleStep;
    resident.morale += Math.max(-stepBy, Math.min(stepBy, target - resident.morale));
    // a new array: the input state's resident keeps its own
    resident.reasons = terms;
  }
}
