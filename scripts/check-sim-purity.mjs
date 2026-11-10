// Fails when packages/sim/src or packages/content/src use a banned word (D-002).
// Whole words in code, with // and /* */ comments removed. A word after a dot counts too, so
// `globalThis.Date` and `self.performance` are caught.
import fs from 'node:fs';
import path from 'node:path';

const DIRS = ['packages/sim/src', 'packages/content/src'];
const BANNED = [
  'Date',
  'performance',
  'Math.random',
  'setTimeout',
  'setInterval',
  'window',
  'document',
  'Math.sin',
  'Math.cos',
  'Math.tan',
  'Math.pow',
  'Math.log',
  'Math.exp',
  'Math.sqrt',
  'globalThis',
  'crypto',
  'Intl',
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = BANNED.map((word) => ({
  word,
  re: new RegExp(`(?<![\\w$])${escape(word)}(?![\\w$])`),
}));

// Blank comments (keeping newlines so line numbers hold); strings are left as code. A scanner,
// so `//` or `/*` inside a '…', "…" or `…` string is not taken for a comment. A template
// string's `${…}` parts are read as string text, and a regex literal holding a quote is not
// understood; neither appears in the engine.
export function stripComments(text) {
  let out = '';
  let quote = null;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const two = text.slice(i, i + 2);
    if (quote !== null) {
      if (ch === '\\') {
        out += two;
        i += 2;
        continue;
      }
      // a quote or double-quote string cannot run past its line
      if (ch === quote || (ch === '\n' && quote !== '`')) quote = null;
      out += ch;
      i++;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      i++;
    } else if (two === '//' || two === '/*') {
      const close = two === '//' ? text.indexOf('\n', i) : text.indexOf('*/', i + 2);
      const end = close === -1 ? text.length : two === '//' ? close : close + 2;
      out += text.slice(i, end).replace(/[^\n]/g, ' ');
      i = end;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

export function findBanned(text) {
  const hits = [];
  stripComments(text)
    .split('\n')
    .forEach((line, i) => {
      for (const { word, re } of patterns) if (re.test(line)) hits.push({ line: i + 1, word });
    });
  return hits;
}

function* files(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) yield full;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let failed = 0;
  let count = 0;
  for (const dir of DIRS) {
    for (const file of files(dir)) {
      count++;
      for (const { line, word } of findBanned(fs.readFileSync(file, 'utf8'))) {
        console.error(`purity: ${file}:${line} uses banned "${word}"`);
        failed++;
      }
    }
  }
  if (failed) process.exit(1);
  console.log(`purity: ${count} files clean`);
}
