// Draws the placeholder app icon at 192 and 512 px into apps/web/public.
// Run by hand (`node scripts/make-icons.mjs`); the PNGs are committed.
// The letter S is a hand-written path, not text, so no font is used and the image is the same
// on every machine (audit F18). The stroke stays inside x 32 to 68 and y 23 to 77 of 100, within
// the middle 60% of the square, so the maskable crop (a circle of 80%) keeps all of it.
import { chromium } from '@playwright/test';

const OUT = 'apps/web/public';
const svg = (
  size,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1c2526" />
  <path d="M 64 36 C 64 24, 36 24, 36 37 C 36 50, 64 50, 64 63 C 64 76, 36 76, 36 64"
    fill="none" stroke="#e3e8e2" stroke-width="8" stroke-linecap="round" />
</svg>`;

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg(size)}`);
    await page.screenshot({ path: `${OUT}/icon-${size}.png` });
    await page.close();
    console.log(`icons: wrote ${OUT}/icon-${size}.png`);
  }
} finally {
  await browser.close();
}
