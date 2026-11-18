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

// The town view (M2c J8): its code is a chunk of its own, loaded after the first screen, and its art is
// precached. Workbox skips any file over 2,097,152 bytes by default, so a bigger file would silently not
// be precached.
const PRECACHE_MAX = 2_097_152;
const assets = fs.readdirSync(path.join(DIST, 'assets'));
const sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
let bad = false;
const chunk = assets.find((name) => name.startsWith('TownView-') && name.endsWith('.js'));
if (!chunk) {
  console.error('bundle: no TownView-*.js chunk in dist/assets');
  bad = true;
} else if (html.includes(chunk) || files.has(`/assets/${chunk}`)) {
  console.error(`bundle: ${chunk} is in index.html, so it loads with the first screen`);
  bad = true;
} else {
  console.log(`bundle: ${chunk} loads after the first screen`);
}
for (const [prefix, ext] of [
  ['ground-', '.webp'],
  ['pieces-', '.png'],
]) {
  const name = assets.find((n) => n.startsWith(prefix) && n.endsWith(ext));
  if (!name) {
    console.error(`bundle: no ${prefix}*${ext} in dist/assets`);
    bad = true;
    continue;
  }
  const size = fs.statSync(path.join(DIST, 'assets', name)).size;
  if (!sw.includes(name)) {
    console.error(`bundle: ${name} is not in the service worker's precache list`);
    bad = true;
  } else if (size > PRECACHE_MAX) {
    console.error(`bundle: ${name} is ${size} bytes, over Workbox's ${PRECACHE_MAX}`);
    bad = true;
  } else {
    console.log(`bundle: ${name} (${size} bytes) is precached`);
  }
}
if (bad) process.exit(1);
