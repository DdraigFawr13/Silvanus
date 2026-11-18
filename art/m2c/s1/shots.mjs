// M2c S1 mock-up (2026-11-18): screenshots of the real Town tab with the proposed map window placed at its top,
// drawn from render.py's maps. Usage: node art/m2c/s1/shots.mjs <dir with day1/village .json and map_*.png> <base url>
// Phone maths: 412 x 915 CSS px at dpr 2.625 (the spec's numbers). Not game code.
import fs from 'node:fs';
import { chromium } from 'playwright';
const [dir, base] = process.argv.slice(2);
const DPR = 2.625, W = 1408, H = 888, HALL = { x: 897, y: 186 };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
async function shot(town, zoom, width, file, full = false) {
  const ctx = await browser.newContext({ viewport: { width, height: 915 }, deviceScaleFactor: DPR, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const rec = JSON.parse(fs.readFileSync(`${dir}/${town}.json`)); rec.anchorMs = Date.now();
  await page.route('**/seed.html', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>seed</title>' }));
  await page.goto(base + '/seed.html');
  await page.evaluate((raw) => new Promise((res, rej) => { const o = indexedDB.open('silvanus-test', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('saves'); o.onerror = () => rej(o.error);
    o.onsuccess = () => { const tx = o.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(raw, 'main'); tx.oncomplete = () => { o.result.close(); res(); }; }; }), rec);
  await page.goto(base + '/?tickMs=60000');
  await page.getByTestId('hall').waitFor();
  const png = 'data:image/png;base64,' + fs.readFileSync(`${dir}/map_${town}.png`).toString('base64');
  await page.evaluate(({ png, zoom, DPR, W, H, HALL }) => {
    const css = (a) => (a * zoom) / DPR; // art px to CSS px at this zoom step
    const view = document.createElement('div');
    view.setAttribute('data-testid', 'town-view');
    view.style.cssText = 'margin:-10px -14px 0;';
    const scroll = document.createElement('div');
    const winH = H / DPR; // as tall as the whole map at 1x (888 device px)
    scroll.style.cssText = `height:${winH}px;overflow:auto;scrollbar-width:none;background:var(--bg);border-bottom:1px solid var(--line)`;
    const img = new Image(); img.src = png;
    img.style.cssText = `display:block;width:${css(W)}px;height:${css(H)}px;image-rendering:pixelated;max-width:none`;
    scroll.append(img);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:6px 14px 0;margin-bottom:10px';
    const lab = document.createElement('span'); lab.textContent = 'Zoom'; lab.style.cssText = 'color:var(--muted);font-size:0.875rem;margin-right:auto';
    const seg = document.createElement('div');
    seg.style.cssText = 'display:flex;border:1px solid var(--line-strong);border-radius:var(--r);overflow:hidden;background:var(--panel)';
    for (const z of [1, 2, 3]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = z + '×';
      b.setAttribute('aria-pressed', String(z === zoom));
      b.style.cssText = `min-width:52px;height:44px;border:0;font-weight:700;font-size:0.9375rem;${z === zoom ? 'background:var(--line-strong);color:var(--head)' : 'background:none;color:var(--muted)'}`;
      seg.append(b); }
    row.append(lab, seg); view.append(scroll, row);
    const hall = document.querySelector('[data-testid=hall]'); hall.parentElement.insertBefore(view, hall);
    return new Promise((res) => img.decode().then(() => {
      const cx = css(HALL.x) - scroll.clientWidth / 2, cy = css(HALL.y) - winH / 2;
      scroll.scrollLeft = Math.max(0, Math.min(cx, scroll.scrollWidth - scroll.clientWidth));
      scroll.scrollTop = Math.max(0, Math.min(cy, scroll.scrollHeight - scroll.clientHeight));
      res();
    }));
  }, { png, zoom, DPR, W, H, HALL });
  const noSideScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await page.screenshot({ path: file, fullPage: full });
  console.log(file, 'no page side scroll:', noSideScroll);
  await ctx.close();
}
for (const town of ['day1', 'village']) for (const z of [1, 2, 3]) await shot(town, z, 412, `${dir}/shot_${town}_${z}x.png`);
await shot('day1', 1, 360, `${dir}/shot_day1_1x_360.png`);
await shot('village', 1, 412, `${dir}/shot_village_full.png`, true);
await browser.close();
