import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
  plugins: [react()],
  define: { __COMMIT__: JSON.stringify(commit()) },
  worker: { format: 'es' },
});
