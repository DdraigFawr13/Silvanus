import { content } from '@silvanus/content';
import { capsOf, hallOf } from '@silvanus/sim';
import type { Command } from '@silvanus/sim';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AUTOSAVE_TICKS, CATCH_UP_CAP, due } from './clock';
import { clearNotice, notices, setNotice, subscribe } from './notices';
import { SCHEMA, exportText, importFile, storageAnswer } from './saves';
import type { SaveRecord, StorageAnswer } from './saves';
import { current, dismissSummary, publish, reset, subscribe as subscribeTown } from './store';
import { PeopleTab } from './ui/PeopleTab';
import { TownTab } from './ui/TownTab';
import { dateInline, dateText } from './ui/format';
import { PROTOCOL } from './worker';
import type { Snapshot, WorkerIn } from './worker';

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
        <div
          className={notice.id === 'update' ? 'notice quiet' : 'notice'}
          key={notice.id}
          data-testid={`notice-${notice.id}`}
        >
          <p>{notice.text}</p>
          {notice.action && (
            <button type="button" className="btn" onClick={notice.action.run}>
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
    <main className="plain">
      <h1 className="town-name">Silvanus</h1>
      <PageNotices />
      <p data-testid="notice">{message}</p>
    </main>
  );
}

// The Export button (passed in), the Import button with its file input, and under them the
// in-page confirm. `replacing` names what Replace would write over: "this town" or "the
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
      <div className="btns">
        {children}
        <button
          type="button"
          className="btn second"
          data-testid="import"
          onClick={() => input.current?.click()}
        >
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
        <div className="confirm" data-testid="import-confirm">
          <p>
            Replace {replacing} with the one saved at {dateInline(pending.state.tick)}?
          </p>
          <div className="btns">
            <button
              type="button"
              className="btn"
              data-testid="replace"
              onClick={() => {
                // the anchor is the moment of the tap, not of choosing the file
                onReplace({ ...pending, anchorMs: Date.now() });
                setPending(null);
              }}
            >
              Replace
            </button>
            <button
              type="button"
              className="btn second"
              data-testid="cancel"
              onClick={() => setPending(null)}
            >
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
    <main className="plain">
      <h1 className="town-name">Silvanus</h1>
      <PageNotices />
      <p data-testid="notice">{importError ?? message}</p>
      <Import replacing="the unreadable save" onReplace={onImport} onError={setImportError}>
        <button
          type="button"
          className="btn second"
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
  const snapshot = useSyncExternalStore(subscribeTown, current);
  // The anchor of the last snapshot received, and whether an advance is waiting for its snapshot.
  const anchorRef = useRef<number | null>(null);
  const waitingRef = useRef(false);
  // The longest catch-up, from the Hall's tier in the latest snapshot: a Village's is longer.
  const capRef = useRef(
    first.type === 'load' ? hallOf(first.state, content).catchUpCap : CATCH_UP_CAP,
  );
  // The standby copy: the state and anchor of the latest snapshot.
  const standbyRef = useRef<SaveRecord | null>(null);
  const [savedTick, setSavedTick] = useState<number | null>(loadedTick);
  // The anchor of an imported record sent to the worker whose snapshot has not come back yet.
  const importingRef = useRef<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageAnswer | null>(null);
  // the tab shown; not kept over a reload
  const [tab, setTab] = useState<'town' | 'people'>('town');

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
    reset();
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
      capRef.current = hallOf(next.state, content).catchUpCap;
      // while an import waits, snapshots of the replaced town set no away card
      publish(next, importingRef.current === null);
      if (importingRef.current !== null) {
        // Snapshots of the replaced town may still arrive; they are shown but not autosaved,
        // and the clock stays on the imported town's anchor (audit F14).
        if (next.ticks !== 0 || next.anchorMs !== importingRef.current) return;
        importingRef.current = null;
        anchorRef.current = next.anchorMs;
        waitingRef.current = false;
        persist(true);
        return;
      }
      anchorRef.current = next.anchorMs;
      if (next.ticks > 0) waitingRef.current = false;
      // Autosave every AUTOSAVE_TICKS ticks in live play, and once after a catch-up.
      if (next.ticks > 1 || (next.ticks === 1 && next.state.tick % AUTOSAVE_TICKS === 0)) persist();
    };
    const check = () => {
      if (waitingRef.current || anchorRef.current === null) return;
      const result = due(Date.now(), anchorRef.current, tickMs, capRef.current);
      if (result.ticks === 0) {
        anchorRef.current = result.anchorMs;
        return;
      }
      waitingRef.current = true;
      send({ v: PROTOCOL, type: 'advance', ticks: result.ticks, anchorMs: result.anchorMs });
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
      <main className="plain">
        <PageNotices />
        <p className="loading">Loading…</p>
      </main>
    );
  }

  const { state } = snapshot;
  const post = (message: WorkerIn) => worker.postMessage(message);
  const sendCommand = (command: Command) => post({ v: PROTOCOL, type: 'command', command });
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
    // the card spoke of the town being replaced
    dismissSummary();
    waitingRef.current = true;
    post({ v: PROTOCOL, type: 'load', state: record.state, anchorMs: record.anchorMs });
  };
  const unavailable =
    save === null
      ? 'Saving is not available in this browser, so the town will not be kept. Export a save to keep it.'
      : null;
  const notice = importError ?? unavailable;
  const caps = capsOf(state, content);

  return (
    <div className="app">
      <header className="top">
        <h1 className="town-name">{content.town}</h1>
        <p className="town-sub">
          <b>{hallOf(state, content).name}</b> ·{' '}
          <span data-testid="date" data-tick={state.tick}>
            {dateText(state.tick)}
          </span>
        </p>
        <div className="stock" data-testid="stock">
          {content.resources.map((resource) => {
            const amount = state.stock[resource.id];
            const edge = amount === 0 ? 'empty' : amount >= caps[resource.id] ? 'full' : null;
            return (
              <div
                className={edge ? 'cell warn' : 'cell'}
                key={resource.id}
                data-testid={`stock-${resource.id}`}
              >
                {/* the word says which edge, so the colour is not the only sign (M1 audit F17) */}
                <span className="lab">
                  {resource.name}
                  {edge && <span className="edge"> · {edge}</span>}
                </span>
                <span className="num">
                  {amount} <small>/ {caps[resource.id]}</small>
                </span>
              </div>
            );
          })}
        </div>
      </header>
      <main className="body">
        <PageNotices />
        {notice && (
          <div className="notice">
            <p data-testid="notice">{notice}</p>
          </div>
        )}
        {tab === 'people' && <PeopleTab state={state} send={sendCommand} />}
        <TownTab state={state} send={sendCommand} hidden={tab !== 'town'}>
          {savedTick === null ? (
            <p>Not saved yet</p>
          ) : (
            <p>
              Saved at{' '}
              <span data-testid="saved-at" data-tick={savedTick}>
                {dateInline(savedTick)}
              </span>
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
          <Import replacing="this town" onReplace={replaceWith} onError={setImportError}>
            <button type="button" className="btn second" data-testid="export" onClick={exportSave}>
              Export
            </button>
          </Import>
          <p>
            Version <span data-testid="version">{__COMMIT__}</span>
          </p>
        </TownTab>
      </main>
      <nav className="tabs" aria-label="Tabs">
        {(
          [
            ['town', 'Town'],
            ['people', 'People'],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={tab === id ? 'tab on' : 'tab'}
            aria-pressed={tab === id}
            data-testid={`tab-${id}`}
            onClick={() => {
              setTab(id);
              window.scrollTo(0, 0);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
