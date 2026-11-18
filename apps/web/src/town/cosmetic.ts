// The view's own random numbers (D-037): never a game stream and never the platform random function (GAME-01). A small seeded generator
// (mulberry32) for walk phases and smoke drift, seeded from the town's seed and an id.
export function cosmetic(seed: number, id: number): () => number {
  let a = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(id | 0, 0x85ebca6b)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
