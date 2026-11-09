// Fails when the entry script named in apps/web/dist/index.html is over 80,000 bytes gzipped.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST = 'apps/web/dist';
const LIMIT = 80_000;

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const tag = html.match(/<script\b[^>]*type="module"[^>]*>/);
const src = tag && tag[0].match(/\bsrc="([^"]+)"/);
if (!src) {
  console.error('bundle: no <script type="module" src> in dist/index.html');
  process.exit(1);
}
const file = path.join(DIST, src[1].replace(/^\//, ''));
const size = zlib.gzipSync(fs.readFileSync(file)).length;
if (size > LIMIT) {
  console.error(`bundle: ${file} is ${size} bytes gzipped, over ${LIMIT}`);
  process.exit(1);
}
console.log(`bundle: ${file} is ${size} bytes gzipped (limit ${LIMIT})`);
