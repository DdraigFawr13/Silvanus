// Fails when packages/sim/src or packages/content/src use a banned word (D-002).
// Whole words in code, with // and /* */ comments removed.
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
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = BANNED.map((word) => ({
  word,
  re: new RegExp(`(?<![\\w$.])${escape(word)}(?![\\w$])`),
}));

// Blank comments (keeping newlines so line numbers hold); strings are left as code.
export function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));
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
