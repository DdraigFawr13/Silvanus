import { content } from '@silvanus/content';
import { jobCost, kindOf, refusal, shortfall, slotsOf } from '@silvanus/sim';
import type { Building, Command, State } from '@silvanus/sim';
import { useState } from 'react';
import { Sheet } from './Sheet';
import { amountsText, duration, needsText, reasonText } from './format';
import { Methods, boughtAny } from './Methods';

// One built lot: its methods, its open slots, its workers, its upgrade and clearing it.
export function BuildingSheet({
  state,
  building,
  send,
  onClose,
}: {
  state: State;
  building: Building;
  send: (command: Command) => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const kind = kindOf(content, building.kind)!;
  const slots = slotsOf(content, building);
  const workers = state.residents.filter((r) => r.jobId === building.id);
  const setOpen = (count: number): Command => ({
    type: 'setOpen',
    buildingId: building.id,
    count,
  });
  const fewer = refusal(state, setOpen(building.open - 1), content);
  const more = refusal(state, setOpen(building.open + 1), content);

  const next = kind.tiers[building.tier];
  const upgrade: Command = { type: 'upgrade', buildingId: building.id };
  const upgradeCost = jobCost(state, upgrade, content);
  const upgradeWhy = refusal(state, upgrade, content);
  const clear: Command = { type: 'clear', buildingId: building.id };
  const clearWhy = refusal(state, clear, content);

  return (
    <Sheet
      title={
        <>
          {kind.name} <span className="tier">Tier {building.tier}</span>
        </>
      }
      onClose={onClose}
      testId="building-sheet"
    >
      {next && (
        <>
          <h3 className="sheet-sec">Upgrade to tier {building.tier + 1}</h3>
          <p className="sub">
            {amountsText(next.cost)} · {duration(next.ticks)} ·{' '}
            {next.beds > 0
              ? `Beds ${next.beds}`
              : next.slots > 0
                ? `${next.slots} worker slots`
                : ''}
          </p>
          <button
            type="button"
            className="btn"
            data-testid="upgrade"
            disabled={upgradeWhy !== null}
            onClick={() => send(upgrade)}
          >
            Upgrade
          </button>
          {upgradeWhy !== null && (
            <p className="why">
              {upgradeWhy === 'noStock'
                ? needsText(shortfall(state.stock, upgradeCost))
                : reasonText(upgradeWhy)}
            </p>
          )}
        </>
      )}
      {building.method !== null && <Methods state={state} building={building} send={send} />}
      {slots > 0 && (
        <>
          <h3 className="sheet-sec">Open slots</h3>
          <div className="field">
            <div className="stepper">
              <button
                type="button"
                aria-label="Fewer open slots"
                disabled={fewer !== null}
                onClick={() => send(setOpen(building.open - 1))}
              >
                −
              </button>
              <span className="n" data-testid="open-slots">
                {building.open}
              </span>
              <button
                type="button"
                aria-label="More open slots"
                disabled={more !== null}
                onClick={() => send(setOpen(building.open + 1))}
              >
                +
              </button>
            </div>
            <span className="sub">of {slots} at this tier</span>
          </div>
          <h3 className="sheet-sec" data-testid="sheet-workers">
            Workers {workers.length} / {building.open}
          </h3>
          <p className="names">
            {workers.length > 0 ? workers.map((r) => r.name).join(', ') : 'Nobody works here.'}
          </p>
        </>
      )}
      <h3 className="sheet-sec">Clear the lot</h3>
      {confirming ? (
        <div className="confirm" data-testid="clear-confirm">
          <p>
            Clear the {kind.name}? Nothing is refunded
            {workers.length > 0
              ? ` and its ${workers.length} ${workers.length === 1 ? 'worker loses their job' : 'workers lose their jobs'}`
              : ''}
            {boughtAny(building) ? ', and the methods it bought are lost' : ''}.
          </p>
          <div className="btns">
            <button
              type="button"
              className="btn"
              data-testid="clear-yes"
              onClick={() => send(clear)}
            >
              Clear it
            </button>
            <button type="button" className="btn second" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="sub">
            {boughtAny(building)
              ? 'Removes the building and the methods it bought. Nothing is refunded.'
              : 'Removes the building. Nothing is refunded.'}
          </p>
          <button
            type="button"
            className="btn second"
            data-testid="clear"
            disabled={clearWhy !== null}
            onClick={() => setConfirming(true)}
          >
            Clear lot
          </button>
          {clearWhy !== null && <p className="why">{reasonText(clearWhy)}</p>}
        </>
      )}
    </Sheet>
  );
}
