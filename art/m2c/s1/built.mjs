// M2c S1 (2026-11-18): screenshots of the built Town tab on a production build, beside the approved mock-up.
// Usage: node art/m2c/s1/built.mjs <dir with day1/village .json> <base url> <out dir>. Not game code.
import fs from 'node:fs';
import { chromium } from 'playwright';
const [dir, base, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
async function shot(town, zoom, width, name) {
  const ctx = await browser.newContext({ viewport: { width, height: 915 }, deviceScaleFactor: 2.625, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const rec = JSON.parse(fs.readFileSync(`${dir}/${town}.json`)); rec.anchorMs = Date.now();
  await page.route('**/seed.html', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>seed</title>' }));
  await page.goto(base + '/seed.html');
  await page.evaluate((raw) => new Promise((res, rej) => { const o = indexedDB.open('silvanus-test', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('saves'); o.onerror = () => rej(o.error);
    o.onsuccess = () => { const tx = o.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(raw, 'main'); tx.oncomplete = () => { o.result.close(); res(); }; }; }), rec);
  await page.goto(base + '/?tickMs=60000');
  await page.locator('canvas[data-zoom]').waitFor();
  if (zoom > 1) { await page.getByTestId(`zoom-${zoom}`).click(); await page.locator(`canvas[data-zoom="${zoom}"]`).waitFor(); }
  const side = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const png = `${out}/${name}.png`;
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width, height: 480 } });
  console.log(name, 'page side scroll px:', side);
  await ctx.close();
}
await shot('day1', 1, 412, 'day1_1x_412');
await shot('village', 1, 412, 'village_1x_412');
await shot('village', 3, 412, 'village_3x_412');
await shot('day1', 1, 360, 'day1_1x_360');
await browser.close();
