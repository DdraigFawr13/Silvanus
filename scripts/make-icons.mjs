// Draws the placeholder app icon at 192 and 512 px into apps/web/public.
// Run by hand (`node scripts/make-icons.mjs`); the PNGs are committed.
import { chromium } from '@playwright/test';

const OUT = 'apps/web/public';
const svg = (
  size,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1c2526" />
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
    font-family="Georgia, serif" font-size="84" fill="#e3e8e2">S</text>
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
