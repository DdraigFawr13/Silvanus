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
  test('network, eval and the other float Math calls are banned (M1 audit F2)', () => {
    expect(words('const r = fetch(url);')).toEqual(['fetch']);
    expect(words('const x = new XMLHttpRequest();')).toEqual(['XMLHttpRequest']);
    expect(words('localStorage.setItem(k, v);')).toEqual(['localStorage']);
    expect(words('const o = navigator.onLine;')).toEqual(['navigator']);
    expect(words('eval(code);')).toEqual(['eval']);
    expect(words('const d = Math.hypot(a, b) + Math.atan2(a, b) + Math.cbrt(a);')).toEqual([
      'Math.atan2',
      'Math.hypot',
      'Math.cbrt',
    ]);
    // Math reached by brackets or taken apart still counts
    expect(words("const r = Math['random']();")).toEqual(['Math[']);
    expect(words('const { random } = Math;')).toEqual(['= Math']);
    // integer Math stays allowed
    expect(findBanned('const a = Math.imul(2, 3) + Math.floor(a / 2) + Math.max(a, b);')).toEqual(
      [],
    );
  });
});
