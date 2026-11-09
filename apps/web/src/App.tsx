import { content } from '@silvanus/content';
import { calendar } from '@silvanus/sim';
import { useEffect, useRef, useState } from 'react';
import { CATCH_UP_CAP, due } from './clock';
import type { Snapshot, WorkerIn } from './worker';

type CaughtUp = { ticks: number; produced: number; lost: number };

export function App({ worker, tickMs }: { worker: Worker; tickMs: number }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [caughtUp, setCaughtUp] = useState<CaughtUp | null>(null);
  // The anchor of the last snapshot received, and whether an advance is waiting for its snapshot.
  const anchorRef = useRef<number | null>(null);
  const waitingRef = useRef(false);

  useEffect(() => {
    const send = (message: WorkerIn) => worker.postMessage(message);
    const onMessage = (event: MessageEvent<Snapshot>) => {
      const next = event.data;
      anchorRef.current = next.anchorMs;
      if (next.ticks > 0) waitingRef.current = false;
      if (next.ticks > 1) {
        setCaughtUp({ ticks: next.ticks, produced: next.produced, lost: next.lost });
      }
      setSnapshot(next);
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
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    worker.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, 1000);
    return () => {
      worker.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [worker, tickMs]);

  if (snapshot === null) return <main>Loading…</main>;

  const { state } = snapshot;
  const when = calendar(state.tick);
  const setForagers = (count: number) =>
    worker.postMessage({ type: 'command', command: { type: 'setForagers', count } } as WorkerIn);

  return (
    <main>
      <h1>Silvanus</h1>
      <p>
        Year {when.year}, season {when.season + 1}, day {when.day}, hour {when.hour}
      </p>
      <p>
        Tick <span data-testid="tick">{state.tick}</span>
      </p>
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
