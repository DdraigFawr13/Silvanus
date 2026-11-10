import { content } from '@silvanus/content';
import { hallOf, kindOf, methodOf, slotsOf } from '@silvanus/sim';
import type { Building, Command, Job, State } from '@silvanus/sim';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { BuildSheet } from './BuildSheet';
import { BuildingSheet } from './BuildingSheet';
import { dateText, duration } from './format';

const LOG_SHOWN = 20;

function jobName(state: State, job: Job): string {
  if (job.target === 'hall') return `The Hall to tier ${job.toTier}`;
  const building = state.buildings.find((b) => b.id === job.target);
  const name = building ? kindOf(content, building.kind)!.name : '';
  return job.toTier === 1 ? name : `${name} to tier ${job.toTier}`;
}

// The second line of a built lot: its method, its workers or beds, and an upgrade if one waits.
function lotLine(state: State, building: Building): ReactNode {
  const kind = kindOf(content, building.kind)!;
  const parts: ReactNode[] = [];
  const method = methodOf(content, building.method);
  if (method) parts.push(method.name);
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

type Open = { type: 'build' } | { type: 'building'; id: number } | null;

// The Hall, the work queue, the lots, the log, and at the foot the save block (passed in).
export function TownTab({
  state,
  send,
  children,
}: {
  state: State;
  send: (command: Command) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<Open>(null);
  const hall = hallOf(state, content);
  const emptyLots = Math.max(0, hall.lots - state.buildings.length);
  const shown = open?.type === 'building' ? state.buildings.find((b) => b.id === open.id) : null;
  const log = state.log.slice(-LOG_SHOWN).reverse();

  return (
    <>
      <div className="panel" data-testid="hall">
        <div className="row-top">
          <span className="name">The Hall</span>
          <span className="tier">Tier {state.hallTier}</span>
        </div>
        <div className="line2">
          Residents {state.residents.length} / {hall.residents}
        </div>
      </div>

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
                onClick={() => send({ type: 'cancelJob', index })}
              >
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>

      <h2 className="sec">Lots</h2>
      <div data-testid="lots">
        {state.buildings.map((building) => {
          const kind = kindOf(content, building.kind)!;
          if (building.tier === 0) {
            const first = state.queue[0]?.target === building.id;
            return (
              <div className="panel lot" key={building.id} data-testid="lot">
                <div className="grow">
                  <div className="row-top">
                    <span className="name">{kind.name}</span>
                  </div>
                  <div className="line2">
                    {first
                      ? `Building, ${duration(state.queue[0].ticksLeft)} left`
                      : 'Waiting in the work queue'}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <button
              type="button"
              className="panel lot"
              key={building.id}
              data-testid="lot"
              onClick={() => setOpen({ type: 'building', id: building.id })}
            >
              <span className="grow">
                <span className="row-top">
                  <span className="name">{kind.name}</span>
                  <span className="tier">Tier {building.tier}</span>
                </span>
                <span className="line2">{lotLine(state, building)}</span>
              </span>
              <span className="go">›</span>
            </button>
          );
        })}
        {Array.from({ length: emptyLots }, (_, i) => (
          <button
            type="button"
            className="panel lot empty"
            key={`empty-${i}`}
            data-testid="lot"
            onClick={() => setOpen({ type: 'build' })}
          >
            <span className="grow">
              <span className="name">Empty lot</span>
            </span>
            <span className="go">Build ›</span>
          </button>
        ))}
      </div>

      <h2 className="sec">Log</h2>
      <div className="panel" data-testid="log">
        {log.length === 0 ? (
          <div className="line2">Nothing has happened yet.</div>
        ) : (
          <ul className="log">
            {log.map((line, i) => (
              <li key={`${line.tick}-${state.log.length - i}`}>
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
    </>
  );
}
