import { content } from '@silvanus/content';
import { kindOf } from '@silvanus/sim';
import type { Building, Resident, State } from '@silvanus/sim';

// Display helpers for residents: what the People tab and the resident sheet read. No rule.

export const jobOf = (state: State, resident: Resident): Building | null =>
  resident.jobId === null ? null : (state.buildings.find((b) => b.id === resident.jobId) ?? null);

export function tradeOf(state: State, resident: Resident): string {
  const job = jobOf(state, resident);
  return (job && kindOf(content, job.kind)!.trade) ?? 'No trade';
}

// The resident's highest skill; ties go to the skill listed first in content.
export function topSkill(resident: Resident): { name: string; value: number } {
  let best = content.skills[0];
  for (const skill of content.skills) {
    if ((resident.skills[skill.id] ?? 0) > (resident.skills[best.id] ?? 0)) best = skill;
  }
  return { name: best.name, value: resident.skills[best.id] ?? 0 };
}

export const peopleName = (resident: Resident) =>
  content.peoples.find((p) => p.id === resident.people)?.name ?? resident.people;

// Morale's colour: ember under 30, moss from 70.
export const moraleClass = (morale: number) => (morale < 30 ? 'w' : morale >= 70 ? 'ok' : '');
