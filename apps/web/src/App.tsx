import { content } from '@silvanus/content';
import { calendar } from '@silvanus/sim';
import { useEffect, useRef, useState } from 'react';
import { CATCH_UP_CAP, due } from './clock';
import { SCHEMA, exportText } from './saves';
import type { SaveRecord } from './saves';
import type { Snapshot, WorkerIn } from './worker';

type CaughtUp = { ticks: number; produced: number; lost: number };

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function Notice({ message }: { message: string }) {
  return (
    <main>
      <h1>Silvanus</h1>
      <p data-testid="notice">{message}</p>
    </main>
  );
}

// A save the app could not read: no game starts; the stored record can be taken out as a file.
export function Refused({ message, raw }: { message: string; raw: unknown }) {
  return (
    <main>
      <h1>Silvanus</h1>
      <p data-testid="notice">{message}</p>
      <button
        type="button"
        data-testid="export"
        onClick={() => download('silvanus-save-unreadable.json', exportText(raw))}
      >
        Export
      </button>
    </main>
  );
}

type Props = {
  worker: Worker;
  // the `load` message that starts the worker; sent once this page is listening
  first: WorkerIn;
  tickMs: number;
  // null when saving is not available in this browser
  save: ((record: SaveRecord) => Promise<void>) | null;
};

export function App({ worker, first, tickMs, save }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [caughtUp, setCaughtUp] = useState<CaughtUp | null>(null);
  // The anchor of the last snapshot received, and whether an advance is waiting for its snapshot.
  const anchorRef = useRef<number | null>(null);
  const waitingRef = useRef(false);
  // The standby copy: the state and anchor of the latest snapshot.
  const standbyRef = useRef<SaveRecord | null>(null);
  const [savedTick, setSavedTick] = useState<number | null>(null);

  useEffect(() => {
    const send = (message: WorkerIn) => worker.postMessage(message);
    const persist = () => {
      const record = standbyRef.current;
      if (record === null || save === null) return;
      // A failed write leaves "Saved at tick" behind; the next save tries again.
      save(record).then(
        () => setSavedTick(record.state.tick),
        () => {},
      );
    };
    const onMessage = (event: MessageEvent<Snapshot>) => {
      const next = event.data;
      anchorRef.current = next.anchorMs;
      if (next.ticks > 0) waitingRef.current = false;
      if (next.ticks > 1) {
        setCaughtUp({ ticks: next.ticks, produced: next.produced, lost: next.lost });
      }
      standbyRef.current = { schema: SCHEMA, anchorMs: next.anchorMs, state: next.state };
      setSnapshot(next);
      // Autosave every 10th tick in live play, and once after a catch-up.
      if (next.ticks > 1 || (next.ticks === 1 && next.state.tick % 10 === 0)) persist();
    };
    const check = () => {
      if (waitingRef.current || anchorRef.current === null) return;
      const result = due(Date.now(), anchorRef.current, tickMs, CATCH_UP_CAP);
      if (result.ticks === 0) {
        anchorRef.current = result.anchorMs;
        return;
      }
      waitingRef.current = true;
      send({ type: 'advance', ticks: result.ticks, anchorMs: result.anchorMs });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
      else persist();
    };
    worker.addEventListener('message', onMessage);
    send(first);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', persist);
    const timer = window.setInterval(check, 1000);
    return () => {
      worker.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', persist);
      window.clearInterval(timer);
    };
  }, [worker, first, tickMs, save]);

  if (snapshot === null) return <main>Loading…</main>;

  const { state } = snapshot;
  const when = calendar(state.tick);
  const setForagers = (count: number) =>
    worker.postMessage({ type: 'command', command: { type: 'setForagers', count } } as WorkerIn);

  return (
    <main>
      <h1>Silvanus</h1>
      {save === null && (
        <p data-testid="notice">
          Saving is not available in this browser. The town will not be kept.
        </p>
      )}
      <p>
        Year {when.year}, season {when.season + 1}, day {when.day}, hour {when.hour}
      </p>
      <p>
        Tick <span data-testid="tick">{state.tick}</span>
      </p>
      {savedTick === null ? (
        <p>Not saved yet</p>
      ) : (
        <p>
          Saved at tick <span data-testid="saved-tick">{savedTick}</span>
        </p>
      )}
      <p>
        Food <span data-testid="food">{state.stock.food}</span> / {content.resources.food.cap}
      </p>
      <div className="row">
        <span>Foragers</span>
        <button
          type="button"
          aria-label="Fewer foragers"
          disabled={state.foragers <= 0}
          onClick={() => setForagers(state.foragers - 1)}
        >
          −
        </button>
        <span data-testid="foragers">{state.foragers}</span>
        <button
          type="button"
          aria-label="More foragers"
          disabled={state.foragers >= content.camp.maxForagers}
          onClick={() => setForagers(state.foragers + 1)}
        >
          +
        </button>
      </div>
      {caughtUp && (
        <p>
          Caught up <span data-testid="caught-up">{caughtUp.ticks}</span> ticks: +
          {caughtUp.produced} food, {caughtUp.lost} lost.
        </p>
      )}
      <p>
        Version <span data-testid="version">{__COMMIT__}</span>
      </p>
    </main>
  );
}
