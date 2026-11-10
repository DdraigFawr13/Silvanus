import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function commit(): string {
  const fromHost = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromHost) return fromHost.slice(0, 7);
  try {
    const out = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim().slice(0, 7) || 'dev';
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  plugins: [
    react(),
    // No update prompt in M0: a new version takes over once every window of the app has closed.
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Silvanus',
        short_name: 'Silvanus',
        display: 'standalone',
        start_url: '/',
        background_color: '#1c2526',
        theme_color: '#1c2526',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,webmanifest}'] },
    }),
  ],
  define: { __COMMIT__: JSON.stringify(commit()) },
  worker: { format: 'es' },
});
