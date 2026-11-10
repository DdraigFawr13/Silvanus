// Types for check-sim-purity.mjs, so packages/sim/test/purity.test.ts can import it.
export function stripComments(text: string): string;
export function findBanned(text: string): { line: number; word: string }[];
