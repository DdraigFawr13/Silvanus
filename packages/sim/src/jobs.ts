import type { Content, State } from './types';
import { kindOf } from './util';

// Rule 4: who works where. Pinned residents first, then the best-scoring pairs of a free
// resident and a building with an open slot. Changes the draft it is given.
export function assignJobs(s: State, content: Content): void {
  const old = new Map<number, number | null>();
  for (const resident of s.residents) {
    old.set(resident.id, resident.jobId);
    resident.jobId = null;
  }
  const left = new Map<number, number>();
  for (const building of s.buildings) {
    if (building.tier > 0 && building.open > 0) left.set(building.id, building.open);
  }
  const take = (resident: State['residents'][number], buildingId: number) => {
    resident.jobId = buildingId;
    left.set(buildingId, left.get(buildingId)! - 1);
  };
  // residents are kept in id order
  for (const resident of s.residents) {
    // a pin that does not fit is kept, and the resident is placed like anyone else this pass
    if (resident.pinnedTo !== null && (left.get(resident.pinnedTo) ?? 0) > 0) {
      take(resident, resident.pinnedTo);
    }
  }
  const pairs: { score: number; resident: State['residents'][number]; lot: number }[] = [];
  for (const resident of s.residents) {
    if (resident.jobId !== null) continue;
    s.buildings.forEach((building, lot) => {
      if ((left.get(building.id) ?? 0) === 0) return;
      const kind = kindOf(content, building.kind)!;
      let score = kind.skill === null ? 0 : (resident.skills[kind.skill] ?? 0);
      for (const id of resident.traits) {
        const trait = content.traits.find((t) => t.id === id);
        if (trait?.likes.includes(kind.id)) score += 15;
        if (trait?.dislikes.includes(kind.id)) score -= 15;
      }
      if (old.get(resident.id) === building.id) score += 10;
      pairs.push({ score, resident, lot });
    });
  }
  pairs.sort((a, b) => b.score - a.score || a.resident.id - b.resident.id || a.lot - b.lot);
  for (const pair of pairs) {
    const building = s.buildings[pair.lot];
    if (pair.resident.jobId === null && left.get(building.id)! > 0)
      take(pair.resident, building.id);
  }
  for (const resident of s.residents) {
    if (resident.jobId !== old.get(resident.id)) resident.workDays = 0;
  }
  s.jobsDirty = false;
}
