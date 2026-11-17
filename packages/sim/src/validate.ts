import type { Amounts, Content } from './types';

// One message per fault in the content, [] when it is sound. The worker runs it on load.
export function validateContent(content: Content): string[] {
  const faults: string[] = [];
  const resources = new Set(content.resources.map((r) => r.id));
  const baseCap = new Map(content.resources.map((r) => [r.id, r.cap]));
  const positive = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n > 0;
  const amounts = (what: string, list: Amounts) => {
    for (const [id, amount] of Object.entries(list)) {
      if (!resources.has(id)) faults.push(`${what} names an unknown resource, ${id}`);
      if (!positive(amount)) faults.push(`${what} has a zero or negative number for ${id}`);
    }
  };
  for (const resource of content.resources) {
    if (!positive(resource.cap))
      faults.push(`${resource.id} has a zero or negative number for its cap`);
  }
  for (const [name, value] of Object.entries(content.rules)) {
    if (!positive(value)) faults.push(`rule ${name} is a zero or negative number`);
  }
  for (const kind of content.buildings) {
    kind.tiers.forEach((tier, i) => {
      const what = `${kind.id} tier ${i + 1}`;
      if (!positive(tier.ticks)) faults.push(`${what} has no ticks`);
      amounts(`${what}'s cost`, tier.cost);
    });
  }
  content.hall.tiers.forEach((tier, i) => {
    amounts(`Hall tier ${i + 1}'s cost`, tier.cost);
    if (i > 0 && !positive(tier.ticks)) faults.push(`Hall tier ${i + 1} has no ticks`);
    for (const [id, amount] of Object.entries(tier.cost)) {
      if (amount > (baseCap.get(id) ?? 0)) {
        faults.push(`Hall tier ${i + 1} costs more ${id} than a base store holds`);
      }
    }
  });
  // a new building starts on its kind's first method, so it must own it from the start
  for (const kind of content.buildings) {
    const first = content.methods.find((m) => m.building === kind.id);
    if (first && Object.keys(first.cost).length > 0) {
      faults.push(`${kind.id} starts on ${first.id}, which has a price`);
    }
  }
  for (const method of content.methods) {
    amounts(`method ${method.id}'s output`, method.makes);
    amounts(`method ${method.id}'s input`, method.uses);
    amounts(`method ${method.id}'s price`, method.cost);
    for (const [id, amount] of Object.entries(method.cost)) {
      if (amount > (baseCap.get(id) ?? 0)) {
        faults.push(`method ${method.id} costs more ${id} than a base store holds`);
      }
    }
    // D-034: the methods with no inputs are the ones every building owns, free
    const free = Object.keys(method.cost).length === 0;
    const basic = Object.keys(method.uses).length === 0;
    if (free !== basic) {
      faults.push(
        `method ${method.id} ${basic ? 'has no inputs but a price' : 'has inputs but no price'}`,
      );
    }
    if (basic) continue;
    const fallback = content.methods.find((m) => m.id === method.fallback);
    if (!fallback || fallback.building !== method.building) {
      faults.push(`method ${method.id} has no fallback`);
    } else if (Object.keys(fallback.cost).length > 0) {
      // a building must own the method it falls back to (D-034)
      faults.push(`method ${method.id} falls back to ${fallback.id}, which has a price`);
    }
  }
  // References between entries, so a content edit fails here and not in the worker (M1 audit F8).
  const skills = new Set(content.skills.map((k) => k.id));
  const kinds = new Set(content.buildings.map((b) => b.id));
  for (const kind of content.buildings) {
    if (kind.skill !== null && !skills.has(kind.skill)) {
      faults.push(`${kind.id} names an unknown skill, ${kind.skill}`);
    }
  }
  for (const trait of content.traits) {
    for (const id of [...trait.likes, ...trait.dislikes]) {
      if (!kinds.has(id)) faults.push(`trait ${trait.id} names an unknown building, ${id}`);
    }
  }
  for (const method of content.methods) {
    if (!kinds.has(method.building)) {
      faults.push(`method ${method.id} belongs to an unknown building, ${method.building}`);
    }
  }
  for (const people of content.peoples) {
    if (!content.names[people.id]) faults.push(`people ${people.id} has no names table`);
    for (const id of people.leans) {
      if (!skills.has(id)) faults.push(`people ${people.id} leans to an unknown skill, ${id}`);
    }
  }
  for (const resource of content.resources) {
    if (resource.start > resource.cap) faults.push(`${resource.id} starts above its cap`);
  }
  // goods' values (D-053), the goals (D-049) and the forage trips (D-051)
  for (const resource of content.resources) {
    if (!positive(resource.value)) faults.push(`${resource.id} has no value`);
  }
  const goalIds = new Set<string>();
  for (const goal of content.goals) {
    const what = `goal ${goal.id}`;
    if (goalIds.has(goal.id)) faults.push(`${what} is listed twice`);
    goalIds.add(goal.id);
    if (!positive(goal.hall) || goal.hall > content.hall.tiers.length) {
      faults.push(`${what} names no Hall tier`);
    }
    if (!positive(goal.reward)) faults.push(`${what} has a zero or negative reward`);
    const when = goal.when;
    if (when.type === 'make') {
      if (!resources.has(when.resource)) {
        faults.push(`${what} names an unknown resource, ${when.resource}`);
      } else if (when.amount > baseCap.get(when.resource)!) {
        faults.push(`${what} asks for more ${when.resource} than a base store holds`);
      }
      if (!positive(when.amount)) faults.push(`${what} has a zero or negative amount`);
    } else if (when.type === 'building') {
      const kind = content.buildings.find((b) => b.id === when.kind);
      if (!kind) faults.push(`${what} names an unknown building, ${when.kind}`);
      else if (!positive(when.tier) || when.tier > kind.tiers.length) {
        faults.push(`${what} names a tier ${when.kind} does not have`);
      }
    } else if (!positive(when.count)) {
      faults.push(`${what} has a zero or negative count`);
    }
  }
  if (content.goals.filter((g) => g.hall === 1).length < content.rules.goalsOffered) {
    faults.push(`there must be at least ${content.rules.goalsOffered} goals at Hall tier 1`);
  }
  const { trips } = content;
  for (const [name, n] of Object.entries({
    size: trips.size,
    ticks: trips.ticks,
    draws: trips.draws,
  })) {
    if (!positive(n)) faults.push(`trips ${name} is a zero or negative number`);
  }
  if (trips.finds.length === 0) faults.push('trips have no finds');
  for (const find of trips.finds) {
    if (!resources.has(find.resource)) {
      faults.push(`a trip find names an unknown resource, ${find.resource}`);
    }
    if (!positive(find.min) || !positive(find.max) || find.min > find.max) {
      faults.push(`the trip find of ${find.resource} needs 1 <= min <= max`);
    }
  }
  // a settler draws two different traits
  if (content.traits.length < 2) faults.push('there must be at least 2 traits');
  // ids the engine reads by name: eating, and the founders' buildings (D-025)
  if (!resources.has('food')) faults.push('the engine needs a resource with id food');
  for (const id of ['cottage', 'forager']) {
    if (!kinds.has(id)) faults.push(`the engine needs a building kind with id ${id}`);
  }
  return faults;
}
