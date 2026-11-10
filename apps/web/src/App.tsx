import { content } from '@silvanus/content';
import { calendar } from '@silvanus/sim';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { CATCH_UP_CAP, due } from './clock';
import { clearNotice, notices, setNotice, subscribe } from './notices';
import { SCHEMA, exportText, importFile, storageAnswer } from './saves';
import type { SaveRecord, StorageAnswer } from './saves';
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

// The notices raised outside the screens (`notices.ts`), each with its button if it has one.
function PageNotices() {
  const list = useSyncExternalStore(subscribe, notices);
  return (
    <>
      {list.map((notice) => (
        <div className="row" key={notice.id} data-testid={`notice-${notice.id}`}>
          <p>{notice.text}</p>
          {notice.action && (
            <button type="button" onClick={notice.action.run}>
              {notice.action.label}
            </button>
          )}
        </div>
      ))}
    </>
  );
}

export function Notice({ message }: { message: string }) {
  return (
    <main>
      <h1>Silvanus</h1>
      <PageNotices />
      <p data-testid="notice">{message}</p>
    </main>
  );
}

// The Export button (passed in), the Import button with its file input, and under them the
// in-page confirm. `replacing` names what Replace would write over: "tick 512" or "the
// unreadable save".
function Import({
  children,
  replacing,
  onReplace,
  onError,
}: {
  children: ReactNode;
  replacing: string;
  onReplace: (record: SaveRecord) => void;
  onError: (message: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<SaveRecord | null>(null);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    onError(null);
    setPending(null);
    try {
      setPending(await importFile(file));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'This file is not a Silvanus save.');
    }
  };
  return (
    <>
      <div className="row">
        {children}
        <button type="button" data-testid="import" onClick={() => input.current?.click()}>
          Import
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json"
          hidden
          data-testid="import-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // cleared, so choosing the same file again is a change
            event.target.value = '';
            void onFile(file);
          }}
        />
      </div>
      {pending && (
        <div data-testid="import-confirm">
          <p>
            Replace {replacing} with tick {pending.state.tick}?
          </p>
          <div className="row">
            <button
              type="button"
              data-testid="replace"
              onClick={() => {
                // the anchor is the moment of the tap, not of choosing the file
                onReplace({ ...pending, anchorMs: Date.now() });
                setPending(null);
              }}
            >
              Replace
            </button>
            <button type="button" data-testid="cancel" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// A save the app could not read: no game starts; the stored record can be taken out as a file,
// or replaced by an imported one.
export function Refused({
  message,
  raw,
  onImport,
}: {
  message: string;
  raw: unknown;
  onImport: (record: SaveRecord) => void;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  return (
    <main>
      <h1>Silvanus</h1>
      <PageNotices />
      <p data-testid="notice">{importError ?? message}</p>
      <Import replacing="the unreadable save" onReplace={onImport} onError={setImportError}>
        <button
          type="button"
          data-testid="export"
          onClick={() => download('silvanus-save-unreadable.json', exportText(raw))}
        >
          Export
        </button>
      </Import>
    </main>
  );
}

type Props = {
  worker: Worker;
  // the `load` message that starts the worker; sent once this page is listening
  first: WorkerIn;
  // the tick of the save this page loaded, or null for a new game
  loadedTick: number | null;
  tickMs: number;
  // null when saving is not available in this browser
  save: ((record: SaveRecord, options?: { keepPrevious?: boolean }) => Promise<void>) | null;
};

export function App({ worker, first, loadedTick, tickMs, save }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [caughtUp, setCaughtUp] = useState<CaughtUp | null>(null);
  // The anchor of the last snapshot received, and whether an advance is waiting for its snapshot.
  const anchorRef = useRef<number | null>(null);
  const waitingRef = useRef(false);
  // The standby copy: the state and anchor of the latest snapshot.
  const standbyRef = useRef<SaveRecord | null>(null);
  const [savedTick, setSavedTick] = useState<number | null>(loadedTick);
  // The anchor of an imported record sent to the worker whose snapshot has not come back yet.
  const importingRef = useRef<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageAnswer | null>(null);

  useEffect(() => {
    let live = true;
    void storageAnswer(navigator.storage).then((answer) => {
      if (live) setStorage(answer);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const send = (message: WorkerIn) => worker.postMessage(message);
    // `imported`: the record is an imported town, which may be at an earlier tick.
    const persist = (imported = false) => {
      const record = standbyRef.current;
      if (record === null || save === null) return;
      // A failed write leaves "Saved at tick" behind; the next save tries again, and two
      // failures in a row raise the "Saving failed" notice (`watchSaves`). An import keeps the
      // town it replaces under `previous`.
      save(record, { keepPrevious: imported }).then(
        // two writes can finish out of order; the line never goes back within one town
        () =>
          setSavedTick((was) =>
            imported ? record.state.tick : Math.max(was ?? 0, record.state.tick),
          ),
        () => {},
      );
    };
    const onHide = () => persist();
    const onMessage = (event: MessageEvent<Snapshot>) => {
      const next = event.data;
      standbyRef.current = { schema: SCHEMA, anchorMs: next.anchorMs, state: next.state };
      setSnapshot(next);
      if (importingRef.current !== null) {
        // Snapshots of the replaced town may still arrive; they are shown but not autosaved,
        // and the clock stays on the imported town's anchor (audit F14).
        if (next.ticks !== 0 || next.anchorMs !== importingRef.current) return;
        importingRef.current = null;
        anchorRef.current = next.anchorMs;
        waitingRef.current = false;
        setCaughtUp(null);
        persist(true);
        return;
      }
      anchorRef.current = next.anchorMs;
      if (next.ticks > 0) waitingRef.current = false;
      if (next.ticks > 1) {
        setCaughtUp({ ticks: next.ticks, produced: next.produced, lost: next.lost });
      }
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
      else onHide();
    };
    // A worker that throws sends no snapshot, so the clock would wait for ever in silence
    // (audit F6). The town as last received can still be taken out as a file.
    const onStopped = () => {
      const record = standbyRef.current;
      setNotice({
        id: 'stopped',
        text: 'The town stopped. Export a save.',
        action: record
          ? {
              label: 'Export',
              run: () => download(`silvanus-save-${record.state.tick}.json`, exportText(record)),
            }
          : undefined,
      });
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onStopped);
    worker.addEventListener('messageerror', onStopped);
    send(first);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    const timer = window.setInterval(check, 1000);
    return () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onStopped);
      worker.removeEventListener('messageerror', onStopped);
      clearNotice('stopped');
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.clearInterval(timer);
    };
  }, [worker, first, tickMs, save]);

  if (snapshot === null) {
    return (
      <main>
        <PageNotices />
        Loading…
      </main>
    );
  }

  const { state } = snapshot;
  const when = calendar(state.tick);
  const post = (message: WorkerIn) => worker.postMessage(message);
  const setForagers = (count: number) =>
    post({ type: 'command', command: { type: 'setForagers', count } });
  const exportSave = () => {
    const record = standbyRef.current;
    if (record) download(`silvanus-save-${record.state.tick}.json`, exportText(record));
  };
  // The imported town is saved when its snapshot comes back from the worker.
  // The clock moves to the imported town at once, and waits for that snapshot: the 1-second
  // timer must not advance the new town on the old town's anchor (audit F14).
  const replaceWith = (record: SaveRecord) => {
    // The running town is stored first, as it stands, so the copy kept under `previous` is
    // the town the player saw and not the last autosave.
    const replaced = standbyRef.current;
    if (replaced && save) save(replaced).catch(() => {});
    importingRef.current = record.anchorMs;
    anchorRef.current = record.anchorMs;
    waitingRef.current = true;
    post({ type: 'load', state: record.state, anchorMs: record.anchorMs });
  };
  const unavailable =
    save === null ? 'Saving is not available in this browser. The town will not be kept.' : null;
  const notice = importError ?? unavailable;

  return (
    <main>
      <h1>Silvanus</h1>
      <PageNotices />
      {notice && <p data-testid="notice">{notice}</p>}
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
      {storage && (
        <p>
          Storage:{' '}
          <span data-testid="storage">
            {storage === 'kept'
              ? 'kept'
              : storage === 'mayClear'
                ? 'the browser may clear this. Export a save.'
                : 'unknown'}
          </span>
        </p>
      )}
      <Import replacing={`tick ${state.tick}`} onReplace={replaceWith} onError={setImportError}>
        <button type="button" data-testid="export" onClick={exportSave}>
          Export
        </button>
      </Import>
      <p>
        Version <span data-testid="version">{__COMMIT__}</span>
      </p>
    </main>
  );
}
