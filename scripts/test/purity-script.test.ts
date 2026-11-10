import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// The purity script run as `npm run check` runs it, from a copy in a folder of its own. Here, not in
// packages/sim/test, because the engine's tests have no Node types (D-002).
describe('the purity script', () => {
  // Runs the script from a copy in a folder whose name has a space, as a checkout might.
  function runIn(files: Record<string, string>) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purity check '));
    fs.copyFileSync(path.resolve('scripts/check-sim-purity.mjs'), path.join(root, 'check.mjs'));
    for (const dir of ['packages/sim/src', 'packages/content/src'])
      fs.mkdirSync(path.join(root, dir), { recursive: true });
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, name), text);
    try {
      const out = execFileSync(process.execPath, [path.join(root, 'check.mjs')], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return { code: 0, out };
    } catch (err) {
      const e = err as { status: number; stdout: string; stderr: string };
      return { code: e.status, out: e.stdout + e.stderr };
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  test('the script scans from a path with a space and fails on a banned word (M1 audit F2)', () => {
    const run = runIn({ 'packages/sim/src/a.ts': 'export const r = Math.random();\n' });
    expect(run.out).toContain('uses banned "Math.random"');
    expect(run.code).toBe(1);
  });

  test('the script fails when it finds nothing to scan (M1 audit F2)', () => {
    const run = runIn({});
    expect(run.out).toContain('no files');
    expect(run.code).toBe(1);
  });

  test('the script scans .mts and .cts files', () => {
    const run = runIn({
      'packages/sim/src/a.mts': 'export const t = Date.now();\n',
      'packages/content/src/b.ts': 'export const a = 1;\n',
    });
    expect(run.out).toContain('uses banned "Date"');
    expect(run.code).toBe(1);
  });
});
