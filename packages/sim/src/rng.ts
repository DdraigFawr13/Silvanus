import type { RngState, StreamName } from './types';

// One mulberry32 step. The state stored is the one after the addition.
export function nextU32(state: number): { value: number; state: number } {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(s ^ (s >>> 15), s | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: (t ^ (t >>> 14)) >>> 0, state: s };
}

// 32-bit FNV-1a hash of the name's character codes.
function hashName(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Whole number in [0, n). The small bias of `% n` is accepted.
export function draw(
  rng: RngState,
  stream: StreamName,
  seed: number,
  n: number,
): { value: number; rng: RngState } {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`draw: n must be a whole number of 1 or more, got ${n}`);
  }
  const start = stream in rng ? rng[stream] : (hashName(stream) ^ (seed >>> 0)) >>> 0;
  const next = nextU32(start);
  return { value: next.value % n, rng: { ...rng, [stream]: next.state } };
}
