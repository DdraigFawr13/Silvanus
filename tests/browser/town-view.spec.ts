import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// The town map (M2c S1, J1 and J8) on Morgan's phone: 412 CSS px wide at dpr 2.625, so the spec's maths
// holds (1408 x 888 art px; the window shows 1082 art px of the width at 1x).
const DPR = 2.625;
test.use({ viewport: { width: 412, height: 915 }, deviceScaleFactor: DPR });
const HALL = { x: 897, y: 186 }; // the Hall piece's centre, art px

// The window's scroll and the art point at its centre, once the map has drawn.
async function view(page: Page) {
  await expect(page.getByTestId('town-view')).toBeVisible();
  const canvas = page.getByTestId('town-view').locator('canvas[data-zoom]');
  await expect(canvas).toHaveCount(1);
  return page.evaluate(() => {
    const box = document.querySelector<HTMLElement>('[data-testid=town-scroll]')!;
    const zoom = Number(box.querySelector('canvas')!.dataset.zoom);
    const dpr = devicePixelRatio;
    return {
      zoom,
      left: box.scrollLeft,
      top: box.scrollTop,
      maxLeft: box.scrollWidth - box.clientWidth,
      maxTop: box.scrollHeight - box.clientHeight,
      centre: {
        x: ((box.scrollLeft + box.clientWidth / 2) * dpr) / zoom,
        y: ((box.scrollTop + box.clientHeight / 2) * dpr) / zoom,
      },
    };
  });
}

test('the map opens on the Hall', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  const map = page.getByTestId('town-view');
  await expect(map.getByTestId('town-scroll')).toHaveCount(1);
  await expect(map.locator('canvas')).toHaveCount(1);
  await expect(map.getByTestId('zoom-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(map.getByTestId('zoom-2')).toHaveAttribute('aria-pressed', 'false');
  await expect(map.getByTestId('zoom-3')).toHaveAttribute('aria-pressed', 'false');
  const at = await view(page);
  // the Hall's centre (x 897) is past the 867 a centred view allows, so the scroll stops at the right edge
  expect(at.left).toBeCloseTo(at.maxLeft, 0);
  expect(Math.abs((at.left * DPR) / 1 - 326)).toBeLessThanOrEqual(1);
  expect(at.top).toBe(0);
  expect(at.maxTop).toBe(0);
  expect(HALL.x - at.centre.x).toBeGreaterThan(20); // clamped: the Hall sits right of centre
});

test('zoom keeps the centre and the pixels crisp', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  const before = await view(page);
  await page.getByTestId('zoom-2').click();
  const canvas = page.getByTestId('town-view').locator('canvas');
  await expect(canvas).toHaveAttribute('data-zoom', '2');
  await expect(page.getByTestId('zoom-2')).toHaveAttribute('aria-pressed', 'true');
  const after = await view(page);
  expect(Math.abs(after.centre.x - before.centre.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.centre.y - before.centre.y)).toBeLessThanOrEqual(1);
  await expect(canvas).toHaveAttribute('data-smoothing', 'false');
  const pixels = await page.evaluate(() => {
    const box = document.querySelector<HTMLElement>('[data-testid=town-scroll]')!;
    const c = box.querySelector('canvas')!;
    const css = c.getBoundingClientRect().width;
    // an art pixel's corner: device x and y where (scroll + x) is a multiple of the zoom (2)
    const sx = Math.round(box.scrollLeft * devicePixelRatio);
    const sy = Math.round(box.scrollTop * devicePixelRatio);
    const blocks: number[][] = [];
    for (const [px, py] of [
      [301, 203],
      [520, 401],
      [777, 612],
    ]) {
      const x = px + ((sx + px) % 2);
      const y = py + ((sy + py) % 2);
      const d = c.getContext('2d')!.getImageData(x, y, 2, 2).data;
      blocks.push([0, 4, 8, 12].map((i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]));
    }
    return { width: c.width, expected: Math.round(css * devicePixelRatio), blocks };
  });
  expect(pixels.width).toBe(pixels.expected);
  for (const block of pixels.blocks) expect(new Set(block).size).toBe(1);
});

test('the map keeps its place across tabs', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  await view(page);
  await page.getByTestId('zoom-3').click();
  await expect(page.getByTestId('town-view').locator('canvas')).toHaveAttribute('data-zoom', '3');
  await page.getByTestId('town-scroll').evaluate((box) => box.scrollBy(-150, 60));
  const before = await view(page);
  expect(before.left).toBeLessThan(before.maxLeft - 100);
  await page.getByTestId('tab-people').click();
  await expect(page.getByTestId('town-view')).toBeHidden();
  await page.getByTestId('tab-town').click();
  const after = await view(page);
  expect(after.zoom).toBe(3);
  expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
});

test('no page scroll at 412 and 360', async ({ page }) => {
  for (const width of [412, 360]) {
    await page.setViewportSize({ width, height: 915 });
    await page.goto('/?tickMs=60000');
    await view(page);
    const sizes = await page.evaluate(() => {
      const box = document.querySelector<HTMLElement>('[data-testid=town-scroll]')!;
      return {
        page: document.documentElement.scrollWidth - innerWidth,
        sideways: box.scrollWidth - box.clientWidth,
        down: box.scrollHeight - box.clientHeight,
        overflowY: getComputedStyle(box).overflowY,
      };
    });
    expect(sizes.page, `${width} px`).toBeLessThanOrEqual(0);
    expect(sizes.sideways, `${width} px`).toBeGreaterThan(0);
    // at 1x the map is exactly the window's height and does not take vertical swipes
    expect(sizes.down, `${width} px`).toBe(0);
    expect(sizes.overflowY).toBe('hidden');
  }
});

test('a failed map leaves the tab working', async ({ page }) => {
  for (const part of ['**/assets/TownView-*.js', '**/assets/ground-*.webp']) {
    await page.unrouteAll();
    await page.route(part, (route) => route.abort());
    await page.goto('/?tickMs=60000');
    const error = page.getByTestId('town-view-error');
    await expect(error, part).toContainText('The map could not load.');
    await expect(error.getByRole('button', { name: 'Retry' })).toBeVisible();
    // the rest of the tab works
    await expect(page.getByTestId('hall')).toContainText('Hamlet');
    await expect(page.getByTestId('board')).toBeVisible();
    await page.getByTestId('lot').filter({ hasText: 'Empty lot' }).first().click();
    await expect(page.getByTestId('build-sheet')).toBeVisible();
  }
  // with the network back, Retry loads the map
  await page.unrouteAll();
  await page.keyboard.press('Escape');
  await page.goto('/?tickMs=60000');
  await page.route('**/assets/ground-*.webp', (route) => route.abort());
  await page.reload();
  await expect(page.getByTestId('town-view-error')).toBeVisible();
  await page.unrouteAll();
  await page.getByTestId('town-view-error').getByRole('button', { name: 'Retry' }).click();
  await view(page);
});

test.describe('installed', () => {
  test.use({ serviceWorkers: 'allow' });

  test('the map draws offline', async ({ page, context }) => {
    await page.goto('/?tickMs=60000');
    await view(page);
    await expect
      .poll(() =>
        page.evaluate(
          async () => (await navigator.serviceWorker.getRegistration())?.active?.state ?? 'none',
        ),
      )
      .toBe('activated');
    await context.setOffline(true);
    await page.reload();
    await view(page);
    const pixel = await page.evaluate(({ x, y }) => {
      const box = document.querySelector<HTMLElement>('[data-testid=town-scroll]')!;
      const c = box.querySelector('canvas')!;
      const zoom = Number(c.dataset.zoom);
      const dx = Math.round(x * zoom - box.scrollLeft * devicePixelRatio);
      const dy = Math.round(y * zoom - box.scrollTop * devicePixelRatio);
      return [...c.getContext('2d')!.getImageData(dx, dy, 1, 1).data];
    }, HALL);
    // not --bg (#162120) and not blank: the map drew from the precache
    expect(pixel[3]).toBe(255);
    expect(pixel.slice(0, 3)).not.toEqual([0x16, 0x21, 0x20]);
  });
});
