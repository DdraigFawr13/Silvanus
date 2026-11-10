import { describe, expect, test } from 'vitest';
import { findBanned, stripComments } from '../../../scripts/check-sim-purity.mjs';

const words = (text: string) => findBanned(text).map((hit) => hit.word);

describe('purity check', () => {
  test('the purity check catches globalThis and string comments', () => {
    // a banned word reached through the global object, or after any dot
    expect(words('const t = globalThis.Date.now();')).toEqual(['Date', 'globalThis']);
    expect(words('const t = self.performance.now();')).toEqual(['performance']);
    expect(words('const id = crypto.randomUUID();')).toEqual(['crypto']);
    expect(words('const f = new Intl.NumberFormat();')).toEqual(['Intl']);
    // `//` inside a string is not a comment, so the code after the string is still read
    expect(words(`const u = 'http://x'; const r = Math.random();`)).toEqual(['Math.random']);
    expect(words('const u = "a // b"; setTimeout(f, 1);')).toEqual(['setTimeout']);
    expect(words('const u = `a /* b`; const d = new Date(); // */')).toEqual(['Date']);
    // an escaped quote does not end the string
    expect(words(`const u = 'it\\'s // fine'; window.close();`)).toEqual(['window']);
    // the line of each hit is reported
    expect(findBanned('const a = 1;\n/* two\nlines */ const b = Date.now();')).toEqual([
      { line: 3, word: 'Date' },
    ]);
  });

  test('clean code and real comments pass', () => {
    expect(findBanned('const update = 1; const candidate = update + 1;')).toEqual([]);
    expect(findBanned('// Date.now() would break replays\nconst a = 1;')).toEqual([]);
    expect(findBanned('/* Math.random()\n setTimeout */ const a = Math.imul(2, 3);')).toEqual([]);
    expect(findBanned('const mandate = 1; const myDate = 2; const $Date = 3;')).toEqual([]);
    // text inside a string is still checked as code
    expect(words(`const label = 'Date';`)).toEqual(['Date']);
  });

  test('comment stripping keeps strings and line numbers', () => {
    expect(stripComments(`a = 'x // y'; // z`)).toBe(`a = 'x // y';     `);
    expect(stripComments('a /* b\nc */ d')).toBe('a     \n     d');
  });
});
