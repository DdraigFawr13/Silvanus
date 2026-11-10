import { defineConfig, devices } from '@playwright/test';

const chromium = process.env.PLAYWRIGHT_CHROMIUM_PATH;

// Browser checks run before a PR is marked ready, not in CI (spec, "Scripts").
export default defineConfig({
  testDir: 'tests/browser',
  workers: 1,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 180_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  // Service workers are blocked unless a test allows them: one would answer `/seed.html` itself.
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromium ? { executablePath: chromium } : {},
      },
    },
  ],
});
