import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// The Version line: `SILVANUS_VERSION` as given when it is set (the update test builds two
// versions with it), else the host's commit, else the local one.
function commit(): string {
  const given = process.env.SILVANUS_VERSION;
  if (given) return given;
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
    // A new version waits; `main.tsx` shows "Update ready" and its Reload button takes it.
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Silvanus',
        short_name: 'Silvanus',
        display: 'standalone',
        id: '/',
        start_url: '/',
        background_color: '#1c2526',
        theme_color: '#1c2526',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // the same image: its letter sits inside the middle 60%, which a maskable crop keeps
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,webmanifest}'] },
    }),
  ],
  define: { __COMMIT__: JSON.stringify(commit()) },
  worker: { format: 'es' },
});
