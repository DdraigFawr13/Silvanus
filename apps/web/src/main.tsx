import { content } from '@silvanus/content';
import { newGame } from '@silvanus/sim';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { tickMsFrom } from './clock';
import './app.css';
import type { WorkerIn } from './worker';

// The seed is the one value taken from outside the engine (GAME-01).
const seed = crypto.getRandomValues(new Uint32Array(1))[0];
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const load: WorkerIn = { type: 'load', state: newGame(seed, content), anchorMs: Date.now() };
worker.postMessage(load);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App worker={worker} tickMs={tickMsFrom(window.location.search)} />
  </StrictMode>,
);
