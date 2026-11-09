import type { Content, State } from './types';

export function newGame(seed: number, content: Content): State {
  return {
    contentVersion: content.version,
    seed,
    tick: 0,
    rng: {},
    stock: { food: 0 },
    foragers: 1,
    residents: [],
  };
}
