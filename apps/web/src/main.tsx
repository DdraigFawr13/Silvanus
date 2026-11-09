import { content } from '@silvanus/content';
import { newGame } from '@silvanus/sim';
import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, Notice, Refused } from './App';
import { tickMsFrom } from './clock';
import './app.css';
import { load, save } from './saves';
import type { WorkerIn } from './worker';

// The seed is the one value taken from outside the engine (GAME-01), before the first render.
const seed = crypto.getRandomValues(new Uint32Array(1))[0];
const root = createRoot(document.getElementById('root')!);
const show = (node: ReactNode) => root.render(<StrictMode>{node}</StrictMode>);

// Only one window runs the town. The lock is held until the page closes.
function holdLock(): Promise<boolean> {
  if (!navigator.locks) return Promise.resolve(true);
  return new Promise((resolve) => {
    navigator.locks
      .request('silvanus-main', { ifAvailable: true }, (lock) => {
        resolve(lock !== null);
        return lock === null ? undefined : new Promise<never>(() => {});
      })
      // Where the browser refuses the request, run as the only window, as when locks are missing.
      .catch(() => resolve(true));
  });
}

async function start() {
  show(<main>Loading…</main>);
  if (!(await holdLock())) {
    show(<Notice message="Silvanus is open in another window." />);
    return;
  }
  const loaded = await load();
  // A save the app cannot read starts no game and is never written over (GAME-05).
  if (loaded.kind === 'tooNew') {
    show(<Refused message="This save is from a newer version of the game." raw={loaded.raw} />);
    return;
  }
  if (loaded.kind === 'damaged') {
    show(<Refused message="This save is damaged." raw={loaded.raw} />);
    return;
  }
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const first: WorkerIn =
    loaded.kind === 'ok'
      ? { type: 'load', state: loaded.record.state, anchorMs: loaded.record.anchorMs }
      : { type: 'load', state: newGame(seed, content), anchorMs: Date.now() };
  show(
    <App
      worker={worker}
      first={first}
      loadedTick={loaded.kind === 'ok' ? loaded.record.state.tick : null}
      tickMs={tickMsFrom(window.location.search)}
      save={loaded.kind === 'unavailable' ? null : save}
    />,
  );
}

void start();
