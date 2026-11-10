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
  for (const method of content.methods) {
    amounts(`method ${method.id}'s output`, method.makes);
    amounts(`method ${method.id}'s input`, method.uses);
    if (Object.keys(method.uses).length === 0) continue;
    const fallback = content.methods.find((m) => m.id === method.fallback);
    if (!fallback || fallback.building !== method.building) {
      faults.push(`method ${method.id} has no fallback`);
    }
  }
  return faults;
}
