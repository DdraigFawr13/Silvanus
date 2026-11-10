import { draw } from './rng';
import type { Content, Resident, State } from './types';

import { YEAR_TICKS } from './calendar';

// "Dvall" + "li" is "Dvalli": a letter tripled across the join becomes a double.
function join(start: string, end: string): string {
  const name = start + end;
  let out = '';
  for (const letter of name) {
    const low = letter.toLowerCase();
    const n = out.length;
    if (n >= 2 && out[n - 1].toLowerCase() === low && out[n - 2].toLowerCase() === low) continue;
    out += letter;
  }
  return out;
}

// Makes one settler from the `arrivals` stream and adds them to the draft. The draws come in a
// fixed order: people, name start, name end, each skill, then two traits.
export function addSettler(s: State, content: Content): Resident {
  const roll = (n: number) => {
    const result = draw(s.rng, 'arrivals', s.seed, n);
    s.rng = result.rng;
    return result.value;
  };
  const people = content.peoples[roll(content.peoples.length)];
  const table = content.names[people.id];
  const start = table.starts[roll(table.starts.length)];
  let name = join(start, table.ends[roll(table.ends.length)]);
  // a name already in the town draws a new ending, up to 5 times, then is kept
  for (let i = 0; i < 5 && s.residents.some((r) => r.name === name); i++) {
    name = join(start, table.ends[roll(table.ends.length)]);
  }
  const skills: Record<string, number> = {};
  for (const skill of content.skills) {
    skills[skill.id] = 20 + roll(31) + (people.leans.includes(skill.id) ? 10 : 0);
  }
  const first = roll(content.traits.length);
  const rest = roll(content.traits.length - 1);
  const second = rest >= first ? rest + 1 : rest;
  const resident: Resident = {
    id: s.nextId++,
    name,
    people: people.id,
    // age 20 on arrival, an assumption until M4a sets ages
    bornTick: s.tick - 20 * YEAR_TICKS,
    motherId: null,
    fatherId: null,
    spouseId: null,
    householdId: null,
    skills,
    traits: [content.traits[first].id, content.traits[second].id],
    morale: 50,
    reasons: [],
    jobId: null,
    pinnedTo: null,
    workDays: 0,
    arrivedTick: s.tick,
  };
  s.residents.push(resident);
  return resident;
}
