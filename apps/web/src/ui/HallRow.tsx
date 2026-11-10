import { content } from '@silvanus/content';
import { hallOf, jobCost, refusal, shortfall } from '@silvanus/sim';
import type { Command, State } from '@silvanus/sim';
import { useState } from 'react';
import { amountsText, duration, needsText, reasonText } from './format';

const UPGRADE: Command = { type: 'upgradeHall' };

// The Hall: its tier and residents, and the way to the next tier: what it gives and costs, the
// button, what is still missing, or the job once it is under way (S5).
export function HallRow({ state, send }: { state: State; send: (command: Command) => void }) {
  const [confirming, setConfirming] = useState(false);
  const hall = hallOf(state, content);
  const next = content.hall.tiers[state.hallTier];
  const at = state.queue.findIndex((job) => job.target === 'hall');
  const why = refusal(state, UPGRADE, content);
  const cost = jobCost(state, UPGRADE, content);
  // Everything still missing, not only the first refusal: residents, then stock.
  const missing: string[] = [];
  if (next && why === 'tooFew') missing.push(`Needs ${next.needResidents} residents`);
  if (why === 'tooFew' || why === 'noStock') {
    const stock = shortfall(state.stock, cost);
    if (Object.keys(stock).length > 0) missing.push(needsText(stock));
  } else if (why !== null && why !== 'busy' && why !== 'notAllowed') {
    missing.push(reasonText(why));
  }

  return (
    <div className="panel" data-testid="hall">
      <div className="row-top">
        <span className="name">The Hall</span>
        <span className="tier">Tier {state.hallTier}</span>
      </div>
      <div className="line2">
        {hall.name} · Residents {state.residents.length} / {hall.residents} · {hall.lots} lots
      </div>
      {next && at === 0 && (
        <div className="line2" data-testid="village-job">
          Becoming a {next.name}, {duration(state.queue[0].ticksLeft)} left
        </div>
      )}
      {next && at > 0 && (
        <div className="line2" data-testid="village-job">
          {next.name} waiting in the work queue
        </div>
      )}
      {next && at < 0 && (
        <>
          <div className="line2">
            {next.name}: {next.lots} lots, room for {next.residents}
          </div>
          <div className="line2">
            {amountsText(next.cost)} · {duration(next.ticks)}
          </div>
          {confirming && why === null ? (
            <div className="confirm" data-testid="village-confirm">
              <p>
                Upgrade to {next.name}? It costs {amountsText(cost)} now and takes{' '}
                {duration(next.ticks)}. Once the work starts it cannot be stopped.
              </p>
              <div className="btns">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    send(UPGRADE);
                    setConfirming(false);
                  }}
                >
                  Upgrade
                </button>
                <button type="button" className="btn second" onClick={() => setConfirming(false)}>
                  Not yet
                </button>
              </div>
            </div>
          ) : (
            <div className="btns">
              <button
                type="button"
                className="btn"
                data-testid="village"
                disabled={why !== null}
                onClick={() => setConfirming(true)}
              >
                Upgrade to {next.name}
              </button>
            </div>
          )}
          {missing.map((line) => (
            <span className="why" data-testid="village-why" key={line}>
              {line}
            </span>
          ))}
        </>
      )}
    </div>
  );
}
