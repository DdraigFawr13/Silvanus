import { content } from '@silvanus/content';
import { boostOf, jobCost, kindOf, methodOf, refusal, shortfall, slotsOf } from '@silvanus/sim';
import type { Building, Command, Job, Plot, State } from '@silvanus/sim';
import { Component, Suspense, lazy, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { MAP_H, ZOOM_ROW_CSS } from '../town/size';
import { dismissSummary, subscribe, summary } from '../store';
import { AwayCard } from './AwayCard';
import { Board } from './Board';
import { BuildSheet, lotGainText, plotName } from './BuildSheet';
import { BuildingSheet } from './BuildingSheet';
import { HallRow } from './HallRow';
import { amountsText, dateText, duration, firstBuildText, needsText } from './format';

const LOG_SHOWN = 20;

function jobName(state: State, job: Job): string {
  if (job.target === 'hall') return `The Hall to ${content.hall.tiers[job.toTier - 1].name}`;
  // no clearing job exists before M2d S2
  if (job.target === 'tangle') return 'Clearing the Tangle';
  const building = state.buildings.find((b) => b.id === job.target);
  const name = building ? kindOf(content, building.kind)!.name : '';
  return job.toTier === 1 ? name : `${name} to tier ${job.toTier}`;
}

// The second line of a built lot: its plot (and what the plot adds), its method, its workers or
// beds, and an upgrade if one waits.
function lotLine(state: State, building: Building): ReactNode {
  const kind = kindOf(content, building.kind)!;
  const parts: ReactNode[] = [];
  const plot = state.plots[building.plot];
  const boost = boostOf(state, building, content);
  parts.push(
    boost > 0 ? (
      <span className="good">
        {plotName(plot)} +{boost}%
      </span>
    ) : (
      plotName(plot)
    ),
  );
  const method = methodOf(content, building.method);
  if (method) parts.push(method.name);
  if (building.retoolLeft > 0) parts.push(`Retooling, ${duration(building.retoolLeft)} left`);
  else if (method && building.short) {
    parts.push(<span className="w">Short: {methodOf(content, method.fallback)!.name}</span>);
  }
  const slots = slotsOf(content, building);
  if (slots > 0) {
    const workers = state.residents.filter((r) => r.jobId === building.id).length;
    const text = `Workers ${workers} / ${building.open}`;
    // open slots that nobody fills are worth a look
    parts.push(workers === 0 && building.open > 0 ? <span className="w">{text}</span> : text);
  }
  const tier = kind.tiers[building.tier - 1];
  if (tier.beds > 0) parts.push(`Beds ${tier.beds}`);
  if (kind.storage) parts.push('Storage');
  const at = state.queue.findIndex((job) => job.target === building.id);
  if (at === 0) parts.push(`Upgrading, ${duration(state.queue[0].ticksLeft)} left`);
  else if (at > 0) parts.push('Upgrade waiting');
  return parts.map((part, i) => (
    <span key={i}>
      {i > 0 && ' · '}
      {part}
    </span>
  ));
}

// The third line of a lot that can grow: what its next tier costs, or what is missing (D-039).
function nextTierLine(state: State, building: Building): ReactNode {
  const upgrade: Command = { type: 'upgrade', buildingId: building.id };
  const cost = jobCost(state, upgrade, content);
  const tier = `Tier ${building.tier + 1}`;
  if (refusal(state, upgrade, content) === 'noStock') {
    return <span className="w">{`${tier}: ${needsText(shortfall(state.stock, cost))}`}</span>;
  }
  return `${tier}: ${amountsText(cost)}`;
}

// The map's place while its chunk loads: the window (the whole map's height at 1x) and the zoom row.
const mapHeight = () => MAP_H / (window.devicePixelRatio || 1) + ZOOM_ROW_CSS;

// Set when the map's chunk failed to load in this page.
let chunkFailed = false;

// If the map's code or art fails to load, the rest of the tab still works (M2c J8).
class MapBoundary extends Component<
  { onRetry: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="town-view-error" data-testid="town-view-error">
        <p>The map could not load.</p>
        <button type="button" className="btn second" onClick={this.props.onRetry}>
          Retry
        </button>
      </div>
    );
  }
}

type Open = { type: 'build'; plot?: number } | { type: 'building'; id: number } | null;

// The away card, the Hall, the board, the work queue, the lots, the log, and at the foot the save block
// (passed in).
export function TownTab({
  state,
  send,
  children,
  hidden = false,
}: {
  state: State;
  send: (command: Command) => void;
  children: ReactNode;
  // kept mounted under the People tab, so its open sheet and the save block's state stay
  hidden?: boolean;
}) {
  const [open, setOpen] = useState<Open>(null);
  // a new lazy component for each attempt, so Retry after failed art loads the view again
  const [attempt, setAttempt] = useState(0);
  const TownView = useMemo(
    () =>
      lazy(() =>
        import('../town/TownView').catch((error: unknown) => {
          chunkFailed = true;
          throw error;
        }),
      ),
    [attempt],
  );
  // Chromium keeps a failed dynamic import in its module map, so importing the same chunk again
  // fails again: after a failed chunk, Retry reloads the page (the town is saved on `pagehide`).
  const retry = () => (chunkFailed ? window.location.reload() : setAttempt((n) => n + 1));
  const away = useSyncExternalStore(subscribe, summary);
  // the map's Hall answers by bringing the Hall row into view (M2c J3), clear of the sticky stock bar
  const showHall = () =>
    document.querySelector('[data-testid=hall]')?.scrollIntoView({ block: 'center' });
  const lots = state.plots.filter((p) => p.open && p.ground === null);
  const sites = state.plots.filter((p) => p.open && p.ground !== null);
  const shown = open?.type === 'building' ? state.buildings.find((b) => b.id === open.id) : null;
  // Each line's key is its own content, with a count for lines that repeat, so a row keeps its
  // key when older lines fall off the log.
  const seen = new Map<string, number>();
  const log = state.log
    .slice(-LOG_SHOWN)
    .map((line) => {
      const base = `${line.tick}:${line.text}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { ...line, key: `${base}:${n}` };
    })
    .reverse();

  return (
    <div hidden={hidden}>
      {away && <AwayCard state={state} summary={away} onDismiss={dismissSummary} />}
      <MapBoundary key={attempt} onRetry={retry}>
        <Suspense fallback={<div className="town-view-wait" style={{ height: mapHeight() }} />}>
          <TownView
            state={state}
            hidden={hidden}
            open={open?.type === 'building' ? open.id : null}
            onBuilding={(id) => setOpen({ type: 'building', id })}
            onBuild={(plot) => setOpen({ type: 'build', plot })}
            onHall={showHall}
          />
        </Suspense>
      </MapBoundary>
      <HallRow state={state} send={send} />
      <Board state={state} send={send} />

      <h2 className="sec">Work queue</h2>
      <div className="panel" data-testid="queue">
        {state.queue.length === 0 && <div className="line2">Nothing is being built.</div>}
        {state.queue.map((job, index) => (
          <div className="qrow" key={`${job.target}-${job.toTier}`}>
            <div className="grow">
              <div className="qname">{jobName(state, job)}</div>
              <div className="line2">
                {index === 0
                  ? `Under way, ${duration(job.ticksLeft)} left`
                  : `Waiting, takes ${duration(job.ticksLeft)}`}
              </div>
            </div>
            {index > 0 && (
              <button
                type="button"
                className="btn second"
                aria-label={`Cancel ${jobName(state, job)}`}
                onClick={() => send({ type: 'cancelJob', index })}
              >
                Cancel
              </button>
            )}
          </div>
        ))}
        {state.queue.length > 1 && (
          <div className="line2" data-testid="cancel-note">
            Cancelling a waiting job refunds its cost, up to what the stores hold.
          </div>
        )}
      </div>

      <h2 className="sec">Lots</h2>
      <div className="btns head-btns">
        <button
          type="button"
          className="btn second"
          data-testid="build"
          onClick={() => setOpen({ type: 'build' })}
        >
          Build
        </button>
      </div>
      <div data-testid="lots">
        {lots.map((plot) => (
          <PlotRow key={plot.id} state={state} plot={plot} testId="lot" setOpen={setOpen} />
        ))}
      </div>

      <h2 className="sec">Sites</h2>
      <div data-testid="sites">
        {sites.map((plot) => (
          <PlotRow key={plot.id} state={state} plot={plot} testId="site" setOpen={setOpen} />
        ))}
      </div>

      <h2 className="sec">Log</h2>
      <div className="panel" data-testid="log">
        {log.length === 0 ? (
          <div className="line2">Nothing has happened yet.</div>
        ) : (
          <ul className="log">
            {log.map((line) => (
              <li key={line.key}>
                <span className="when">{dateText(line.tick)}</span>
                <span className="what">{line.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="sec">Save and app</h2>
      <div className="panel foot">{children}</div>

      {open?.type === 'build' && (
        <BuildSheet
          state={state}
          plot={open.plot}
          onClose={() => setOpen(null)}
          onBuild={(command) => {
            send(command);
            setOpen(null);
          }}
        />
      )}
      {shown && (
        <BuildingSheet state={state} building={shown} send={send} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

// One open plot: the building on it (being built, or built with its upgrade), or an empty lot or
// site that opens the build sheet with the plot chosen.
function PlotRow({
  state,
  plot,
  testId,
  setOpen,
}: {
  state: State;
  plot: Plot;
  testId: string;
  setOpen: (open: Open) => void;
}) {
  const building = state.buildings.find((b) => b.plot === plot.id);
  if (!building) {
    const kinds = content.buildings.filter((k) => k.site === plot.ground).map((k) => k.name);
    // a site no kind stands on yet (the river until the Fisher's hut, M2d S3): nothing to build
    if (plot.ground !== null && kinds.length === 0) {
      return (
        <div className="panel lot empty" data-testid={testId}>
          <div className="grow">
            <div className="name">Empty {plotName(plot).toLowerCase()}</div>
            <div className="line2">No building stands here yet</div>
          </div>
        </div>
      );
    }
    return (
      <button
        type="button"
        className="panel lot empty"
        data-testid={testId}
        onClick={() => setOpen({ type: 'build', plot: plot.id })}
      >
        <span className="grow">
          <span className="name">
            {plot.ground === null ? 'Empty lot' : `Empty ${plotName(plot).toLowerCase()}`}
          </span>
          <span className="line2">
            {plot.ground === null ? lotGainText(plot) : `For a ${kinds.join(' or a ')}`}
          </span>
        </span>
        <span className="go">Build ›</span>
      </button>
    );
  }
  const kind = kindOf(content, building.kind)!;
  if (building.tier === 0) {
    return (
      <div className="panel lot" data-testid={testId}>
        <div className="grow">
          <div className="row-top">
            <span className="name">{kind.name}</span>
          </div>
          <div className="line2">
            {plotName(plot)} · {firstBuildText(state, building.id)}
          </div>
        </div>
      </div>
    );
  }
  const upgrade: Command = { type: 'upgrade', buildingId: building.id };
  const canGrow =
    kind.tiers[building.tier] !== undefined &&
    !state.queue.some((job) => job.target === building.id);
  const openSheet = () => setOpen({ type: 'building', id: building.id });
  return (
    <div className="panel lot" data-testid={testId}>
      <button type="button" className="lot-main" data-testid="lot-open" onClick={openSheet}>
        <span className="grow">
          <span className="row-top">
            <span className="name">{kind.name}</span>
            <span className="tier">Tier {building.tier}</span>
          </span>
          <span className="line2">{lotLine(state, building)}</span>
          {canGrow && <span className="line2">{nextTierLine(state, building)}</span>}
        </span>
        {!canGrow && <span className="go">›</span>}
      </button>
      {canGrow && (
        <button
          type="button"
          className={refusal(state, upgrade, content) === null ? 'btn' : 'btn second'}
          aria-label={`Upgrade ${kind.name}`}
          onClick={openSheet}
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
