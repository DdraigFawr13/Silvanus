// Fails when the first load's JavaScript is over 120,000 bytes gzipped (WEB-06, audit F12):
// the entry script named in apps/web/dist/index.html, every modulepreload link in it, and the
// worker bundle (dist/assets/worker-*), which the page starts at once.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST = 'apps/web/dist';
const LIMIT = 120_000;

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
const files = new Set();
for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
  if (attr(tag, 'type') === 'module' && attr(tag, 'src')) files.add(attr(tag, 'src'));
}
if (files.size === 0) {
  console.error('bundle: no <script type="module" src> in dist/index.html');
  process.exit(1);
}
for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
  if (attr(tag, 'rel') === 'modulepreload' && attr(tag, 'href')) files.add(attr(tag, 'href'));
}
for (const name of fs.readdirSync(path.join(DIST, 'assets'))) {
  if (name.startsWith('worker-')) files.add(`/assets/${name}`);
}

let total = 0;
for (const name of files) {
  const file = path.join(DIST, name.replace(/^\//, ''));
  const size = zlib.gzipSync(fs.readFileSync(file)).length;
  total += size;
  console.log(`bundle: ${file} is ${size} bytes gzipped`);
}
if (total > LIMIT) {
  console.error(`bundle: first load is ${total} bytes gzipped, over ${LIMIT}`);
  process.exit(1);
}
console.log(`bundle: first load is ${total} bytes gzipped (limit ${LIMIT})`);
