import { content } from '@silvanus/content';
import { newGame } from '@silvanus/sim';
import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App, Notice, Refused } from './App';
import { tickMsFrom } from './clock';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-500.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@fontsource/alegreya-sc/latin-700.css';
import './app.css';
import { setNotice, watchSaves } from './notices';
import { load, save as write } from './saves';
import type { SaveRecord } from './saves';
import { PROTOCOL } from './worker';
import type { WorkerIn } from './worker';

// The seed is the one value taken from outside the engine (GAME-01), before the first render.
const seed = crypto.getRandomValues(new Uint32Array(1))[0];
const root = createRoot(document.getElementById('root')!);
const show = (node: ReactNode) => root.render(<StrictMode>{node}</StrictMode>);

// Every save made by this page is counted, so two failures in a row are shown (audit F2).
const counted = watchSaves(write);

// When a save that should have kept the record it replaces fails (an import, or the first save
// after an upgrade), the record is still under `main`. Later saves go on asking to keep it
// until one lands, so an autosave never writes over it unkept (GAME-05).
let keepOwed = false;
const save: typeof counted = (record, options = {}) => {
  const keepPrevious = options.keepPrevious === true || keepOwed;
  return counted(record, { keepPrevious }).then(
    () => {
      keepOwed = false;
    },
    (error: unknown) => {
      // only a failure leaves a copy owed: a save that follows a good one must not keep again,
      // or it would put the new town over the kept record
      if (keepPrevious) keepOwed = true;
      throw error;
    },
  );
};

// A new version waits until the player takes it: "Update ready" with a Reload button, on every
// screen (audit F3). The browser looks for a new version when the app is opened; an installed
// app brought back from the recents list is not opened again, so it is asked to look then too.
const updateApp = registerSW({
  onNeedRefresh: () =>
    setNotice({
      id: 'update',
      text: 'Update ready',
      action: { label: 'Reload', run: () => void updateApp(true).catch(() => {}) },
    }),
  onRegisteredSW: (_url, registration) => {
    if (!registration) return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => {});
    });
  },
});

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
  show(
    <main className="plain">
      <p className="loading">Loading…</p>
    </main>,
  );
  if (!(await holdLock())) {
    show(<Notice message="Silvanus is open in another window. Close it, then reload this page." />);
    return;
  }
  const loaded = await load();
  const canSave = loaded.kind !== 'unavailable';
  // `record` null starts a new game; `saved` says the record is what the database holds.
  const run = (record: SaveRecord | null, saved: boolean) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    const first: WorkerIn = record
      ? { v: PROTOCOL, type: 'load', state: record.state, anchorMs: record.anchorMs }
      : { v: PROTOCOL, type: 'load', state: newGame(seed, content), anchorMs: Date.now() };
    show(
      <App
        worker={worker}
        first={first}
        loadedTick={record && saved ? record.state.tick : null}
        tickMs={tickMsFrom(window.location.search)}
        save={canSave ? save : null}
      />,
    );
  };
  // A save the app cannot read starts no game and is never written over (GAME-05), until the
  // player replaces it with an imported one. A failed write still starts the imported town; its
  // autosave tries again.
  const onImport = (record: SaveRecord) =>
    save(record, { keepPrevious: true }).then(
      () => run(record, true),
      () => run(record, false),
    );
  if (loaded.kind === 'tooNew' || loaded.kind === 'damaged') {
    const message =
      loaded.kind === 'tooNew'
        ? 'This save is from a newer version of the game. Export keeps a copy of it; Import replaces it with another save.'
        : 'This save is damaged. Export keeps a copy of it; Import replaces it with another save.';
    show(<Refused message={message} raw={loaded.raw} onImport={onImport} />);
    return;
  }
  if (loaded.kind === 'ok' && loaded.upgradedFrom !== undefined) {
    // An older save was upgraded: schema 1 held a counter and became a new town; schema 2 gained
    // owned methods. The old record is still under `main`: this first save moves it to `previous`
    // and stores the upgraded town.
    const record = loaded.record;
    void save(record, { keepPrevious: true }).then(
      () => run(record, true),
      () => run(record, false),
    );
    return;
  }
  run(loaded.kind === 'ok' ? loaded.record : null, true);
}

void start();
