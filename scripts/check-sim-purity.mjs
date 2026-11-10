// Fails when packages/sim/src or packages/content/src use a banned word (D-002).
// Whole words in code, with // and /* */ comments removed. A word after a dot counts too, so
// `globalThis.Date` and `self.performance` are caught.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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
  'Math.asin',
  'Math.acos',
  'Math.atan',
  'Math.atan2',
  'Math.sinh',
  'Math.cosh',
  'Math.tanh',
  'Math.hypot',
  'Math.cbrt',
  'Math.log2',
  'Math.log10',
  'Math.log1p',
  'Math.expm1',
  'Math.fround',
  'globalThis',
  'crypto',
  'Intl',
  // no runtime network or storage in the engine (D-003), and no code from text
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'navigator',
  'eval',
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = [
  ...BANNED.map((word) => ({
    word,
    re: new RegExp(`(?<![\\w$])${escape(word)}(?![\\w$])`),
  })),
  // Math reached around the word list: `Math['random']` or `const { random } = Math`
  { word: 'Math[', re: /(?<![\w$])Math\s*\[/ },
  { word: '= Math', re: /=\s*Math\s*(?:[;,)}]|$)/ },
];

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
    else if (/\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(entry.name)) yield full;
  }
}

// Compared as URLs, so a checkout path with a space or a symlinked folder still runs the scan.
const invoked = process.argv[1] ? pathToFileURL(fs.realpathSync(process.argv[1])).href : '';
if (import.meta.url === invoked) {
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
  if (count === 0) {
    console.error(`purity: no files found in ${DIRS.join(', ')}`);
    process.exit(1);
  }
  if (failed) process.exit(1);
  console.log(`purity: ${count} files clean`);
}
