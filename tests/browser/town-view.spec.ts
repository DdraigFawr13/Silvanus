import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { apply, newGame } from '@silvanus/sim';
import { content, lot, seedRecord, townRecord } from './helpers';

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
    const dpr = devicePixelRatio;
    // three bands two device rows tall, across the whole canvas, each starting on an art pixel's
    // corner: (scroll + x) a multiple of the zoom (2)
    const sx = Math.round(box.scrollLeft * dpr);
    const sy = Math.round(box.scrollTop * dpr);
    const x0 = sx % 2 ? 1 : 0;
    let blocks = 0;
    let mixed = 0;
    let edges = 0;
    for (const py of [203, 401, 612]) {
      const y = py + ((sy + py) % 2);
      const w = c.width - x0 - ((c.width - x0) % 2);
      const d = c.getContext('2d')!.getImageData(x0, y, w, 2).data;
      const at = (x: number, row: number) => {
        const i = (row * w + x) * 4;
        return (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      };
      for (let x = 0; x < w; x += 2) {
        const block = new Set([at(x, 0), at(x + 1, 0), at(x, 1), at(x + 1, 1)]);
        blocks++;
        if (block.size > 1) mixed++;
        if (x > 0 && at(x, 0) !== at(x - 1, 0)) edges++;
      }
    }
    return {
      width: c.width,
      cssTimesDpr: c.getBoundingClientRect().width * dpr,
      window: box.clientWidth * dpr,
      blocks,
      mixed,
      edges,
    };
  });
  // the backing size is the CSS size times dpr (the browser does not scale it) and covers the window
  expect(Math.abs(pixels.width - pixels.cssTimesDpr)).toBeLessThan(0.01);
  expect(pixels.width).toBeGreaterThanOrEqual(pixels.window);
  // every art pixel is a 2 x 2 block of one colour, and the bands are not flat (many colour edges)
  expect(pixels.blocks).toBeGreaterThan(1500);
  expect(pixels.mixed).toBe(0);
  expect(pixels.edges).toBeGreaterThan(300);
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

test('Retry loads the map after its code failed to load', async ({ page }) => {
  await page.route('**/assets/TownView-*.js', (route) => route.abort());
  await page.goto('/?tickMs=60000');
  const error = page.getByTestId('town-view-error');
  await expect(error).toContainText('The map could not load.');
  await page.unrouteAll();
  await error.getByRole('button', { name: 'Retry' }).click();
  await view(page);
  await expect(error).toHaveCount(0);
});

// M2c S2 (J2, J3): every lot and the Hall on the map is a button.

test('a new town on the map', async ({ page }, testInfo) => {
  await page.goto('/?tickMs=60000');
  await view(page);
  const map = page.getByTestId('town-view');
  await expect(map.getByTestId('map-hall')).toHaveCount(1);
  await expect(map.getByTestId('map-hall')).toHaveAttribute('aria-label', 'Hall, Hamlet');
  // the Cottage, the Forager's hut and 4 empty lots, in lot order
  const labels = await map
    .getByTestId('map-lot')
    .evaluateAll((all) => all.map((b) => b.getAttribute('aria-label')));
  expect(labels).toEqual([
    'Cottage, tier 1',
    "Forager's hut, tier 1",
    ...Array(4).fill('Empty lot, build here'),
  ]);
  // the Hall's button comes first, then the lots
  const order = await map
    .locator('button[data-testid^=map-]')
    .evaluateAll((all) => all.map((b) => b.dataset.testid));
  expect(order).toEqual(['map-hall', ...Array(6).fill('map-lot')]);
  await testInfo.attach('new town at 412 px', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

type Box = { x: number; y: number; width: number; height: number };
const boxes = (buttons: Locator) =>
  buttons.evaluateAll((all) =>
    all.map((b) => {
      const r = b.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
const apart = (a: Box, b: Box) =>
  a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;

async function bigAndApart(page: Page) {
  await page.goto('/?tickMs=60000');
  await view(page);
  const buttons = page.getByTestId('town-view').locator('button[data-testid^=map-]');
  for (const z of [1, 2, 3]) {
    await page.getByTestId(`zoom-${z}`).click();
    await expect(page.getByTestId('town-view').locator('canvas')).toHaveAttribute(
      'data-zoom',
      String(z),
    );
    const all = await boxes(buttons);
    expect(all).toHaveLength(7);
    for (const [i, a] of all.entries()) {
      expect(a.width, `${z}x button ${i}`).toBeGreaterThanOrEqual(44);
      expect(a.height, `${z}x button ${i}`).toBeGreaterThanOrEqual(44);
      for (const [j, b] of all.entries()) {
        if (i < j) expect(apart(a, b), `${z}x buttons ${i} and ${j}`).toBe(true);
      }
    }
  }
}

test('lot buttons are big enough and apart', async ({ page }) => bigAndApart(page));

test.describe('a denser screen', () => {
  // dpr 3: 44 CSS px is 132 art px at 1x, more than the 116 that suit dpr 2.625
  test.use({ deviceScaleFactor: 3 });
  test('lot buttons are big enough and apart at dpr 3', async ({ page }) => {
    await bigAndApart(page);
  });
});

// The canvas's device pixels under a map button's lower half (where a glow lies): their mean red minus
// blue (gold is far redder than blue) and a fingerprint of the colours.
async function under(page: Page, button: Locator) {
  return button.evaluate((b) => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid=town-view] canvas')!;
    const cr = c.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const dpr = devicePixelRatio;
    const x = Math.round((br.x - cr.x) * dpr);
    const y = Math.round((br.y + br.height / 2 - cr.y) * dpr);
    const w = Math.round(br.width * dpr);
    const h = Math.round((br.height / 2) * dpr);
    const d = c.getContext('2d')!.getImageData(x, y, w, h).data;
    let warm = 0;
    let print = 0;
    for (let i = 0; i < d.length; i += 4) {
      warm += d[i] - d[i + 2];
      print = (print * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) % 1_000_000_007;
    }
    return { warm: warm / (d.length / 4), print };
  });
}

test('tapping a lot opens its sheet', async ({ page }) => {
  await page.goto('/?tickMs=60000');
  await view(page);
  const cottage = page.getByRole('button', { name: 'Cottage, tier 1' });
  const shut = await under(page, cottage);
  await cottage.click();
  const sheet = page.getByTestId('building-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Cottage');
  const fromMap = await sheet.innerText();
  // the spot glows gold while the sheet is open
  const lit = await under(page, cottage);
  expect(lit.print).not.toBe(shut.print);
  expect(lit.warm - shut.warm).toBeGreaterThan(5);
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(async () => (await under(page, cottage)).print).toBe(shut.print);
  // the same sheet as the list's row for that building
  await page.getByTestId('lot-open').filter({ hasText: 'Cottage' }).click();
  await expect(sheet).toBeVisible();
  expect(await sheet.innerText()).toBe(fromMap);
  await sheet.getByRole('button', { name: 'Close' }).click();
  // an empty lot opens the build sheet
  await page.getByRole('button', { name: 'Empty lot, build here' }).first().click();
  await expect(page.getByTestId('build-sheet')).toBeVisible();
});

test.describe('a touch screen', () => {
  test.use({ hasTouch: true });
  test('a drag across the map opens nothing', async ({ page }) => {
    await page.goto('/?tickMs=60000');
    await view(page);
    await page.getByTestId('zoom-2').click();
    const cottage = page.getByRole('button', { name: 'Cottage, tier 1' });
    await cottage.scrollIntoViewIfNeeded();
    const box = (await cottage.boundingBox())!;
    const scroll = page.getByTestId('town-scroll');
    const before = await scroll.evaluate((e) => e.scrollLeft);
    // a finger drag that starts on the Cottage and scrolls the map sideways
    const cdp = await page.context().newCDPSession(page);
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + 12 * i, y }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => scroll.evaluate((e) => e.scrollLeft)).toBeLessThan(before - 50);
    await expect(page.getByTestId('building-sheet')).toHaveCount(0);
    await expect(page.getByTestId('build-sheet')).toHaveCount(0);
  });
});

test('tier 0 and the Hall answer', async ({ page }) => {
  // two first builds: the Woodcutter's camp under way, the Mine waiting behind it
  const start = newGame(1, content);
  const rich = { ...start, stock: { ...start.stock, wood: 200, stone: 200, tools: 50 } };
  const state = apply(
    rich,
    [
      { type: 'build', kind: 'woodcutter' },
      { type: 'build', kind: 'mine' },
    ],
    content,
  ).state;
  expect(state.queue).toHaveLength(2);
  await seedRecord(page, townRecord({ state }));
  // the note's 3 s run on the page's fake clock
  await page.clock.install();
  await page.goto('/?tickMs=60000');
  await view(page);
  const camp = page.getByRole('button', { name: "Woodcutter's camp, being built" });
  const mine = page.getByRole('button', { name: 'Mine, being built' });
  const note = page.getByTestId('map-note');
  await expect(note).toHaveCount(0);
  await camp.click();
  // the list's own text for that lot
  const campLine = await lot(page, "Woodcutter's camp").locator('.line2').textContent();
  expect(campLine).toMatch(/^Building, .* left$/);
  await expect(note).toHaveText(campLine!);
  await expect(page.getByTestId('building-sheet')).toHaveCount(0);
  // another tap replaces it, and its 3 s start again
  await page.clock.runFor(2000);
  await mine.click();
  await expect(note).toHaveText('Waiting in the work queue');
  await expect(note).toHaveCount(1);
  await page.clock.runFor(2900);
  await expect(note).toHaveCount(1);
  await page.clock.runFor(200);
  await expect(note).toHaveCount(0);
  // near the window's top edge the note shows below its lot, inside the window
  await page.getByTestId('zoom-3').click();
  await expect(page.getByTestId('town-view').locator('canvas')).toHaveAttribute('data-zoom', '3');
  const scroll = page.getByTestId('town-scroll');
  await camp.evaluate((b: HTMLElement) => {
    const box = b.closest<HTMLElement>('[data-testid=town-scroll]')!;
    box.scrollTop = b.offsetTop + 4;
    box.scrollLeft = b.offsetLeft + b.offsetWidth / 2 - box.clientWidth / 2;
  });
  await camp.dispatchEvent('click');
  await expect(note).toBeVisible();
  const [n, w] = [(await note.boundingBox())!, (await scroll.boundingBox())!];
  expect(n.y).toBeGreaterThanOrEqual(w.y);
  expect(n.y + n.height).toBeLessThanOrEqual(w.y + w.height);
  expect(n.x).toBeGreaterThanOrEqual(w.x);
  expect(n.x + n.width).toBeLessThanOrEqual(w.x + w.width);
  // the Hall brings its row into view: on a short screen the row starts below the map
  await page.getByTestId('zoom-1').click();
  await page.setViewportSize({ width: 412, height: 480 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByTestId('hall')).not.toBeInViewport();
  await page.getByTestId('map-hall').click();
  await expect(page.getByTestId('hall')).toBeInViewport({ ratio: 1 });
});
