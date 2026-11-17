import { content } from '@silvanus/content';
import {
  capsOf,
  goalOf,
  goalProgress,
  kindOf,
  refusal,
  rewardPreview,
  shortfall,
} from '@silvanus/sim';
import type { Command, Goal, State } from '@silvanus/sim';
import { amountsText, duration, needsText, resourceName } from './format';

// "Make 80 wood", "Build a Mine", "A Cottage at tier 2", "12 residents"
function conditionText(goal: Goal): string {
  const when = goal.when;
  if (when.type === 'make') return `Make ${when.amount} ${resourceName(when.resource)}`;
  if (when.type === 'residents') return `${when.count} residents`;
  const name = kindOf(content, when.kind)?.name ?? when.kind;
  const a = /^[AEIOU]/.test(name) ? 'an' : 'a';
  return when.tier === 1
    ? `Build ${a} ${name}`
    : `${a === 'an' ? 'An' : 'A'} ${name} at tier ${when.tier}`;
}

// The active goal's progress: "12 of 80 wood", "8 of 12 residents"; a building goal says "Not
// yet". A make goal whose store is full says so, since its production has stopped.
function progressText(state: State, goal: Goal): string {
  const when = goal.when;
  if (when.type === 'make' && state.stock[when.resource] >= capsOf(state, content)[when.resource]) {
    return `Stores full: use some ${resourceName(when.resource)} to go on`;
  }
  const progress = goalProgress(state, content);
  if (!progress) return 'Not yet';
  const unit = when.type === 'make' ? resourceName(when.resource) : 'residents';
  return `${progress.have} of ${progress.need} ${unit}`;
}

// The board on the Town tab (M2e): the goals on offer, the trader's offers and goods on the way.
// Trips join in S3.
export function Board({ state, send }: { state: State; send: (command: Command) => void }) {
  const board = state.board;
  return (
    <>
      <h2 className="sec">Board</h2>
      <div data-testid="board">
        {board.goals.length === 0 && (
          <div className="panel" data-testid="no-goals">
            <div className="row-top">
              <span className="name">Goals</span>
              <span className="kind">Goal</span>
            </div>
            <div className="line2">No goals until the town grows</div>
          </div>
        )}
        {board.goals.map((id) => {
          const goal = goalOf(content, id);
          if (!goal) return null;
          const active = board.active === id;
          const worth = amountsText(rewardPreview(state, id, content));
          return (
            <div className="panel" data-testid="goal" key={id}>
              <div className="row-top">
                <span className="name">{goal.name}</span>
                <span className="kind">Goal</span>
              </div>
              <div className="line2">{conditionText(goal)}</div>
              {active && (
                <div className="line2 progress" data-testid="goal-progress">
                  {progressText(state, goal)}
                </div>
              )}
              <div className="line2">
                {worth === ''
                  ? 'The stores are full: it would pay nothing now'
                  : `Worth about ${worth}`}
              </div>
              {!active && (
                <div className="btns">
                  <button
                    type="button"
                    className={board.active === null ? 'btn' : 'btn second'}
                    aria-label={`Pick ${goal.name}`}
                    onClick={() => send({ type: 'pickGoal', id })}
                  >
                    {board.active === null ? 'Pick' : 'Pick instead'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {board.offers.map((offer) => {
          const give = { [offer.give.resource]: offer.give.amount };
          const accept: Command = { type: 'acceptOffer', id: offer.id };
          const can = refusal(state, accept, content) === null;
          const title = `${amountsText({ [offer.get.resource]: offer.get.amount })} for ${amountsText(give)}`;
          return (
            <div className="panel" data-testid="offer" key={offer.id}>
              <div className="row-top">
                <span className="name">{title}</span>
                <span className="kind">Trader</span>
              </div>
              <div className="line2">Leaves in {duration(offer.until - state.tick)}</div>
              <div className="btns">
                <button
                  type="button"
                  className={can ? 'btn' : 'btn second'}
                  aria-label={`Accept ${title}`}
                  onClick={() => send(accept)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn second"
                  aria-label={`Decline ${title}`}
                  onClick={() => send({ type: 'declineOffer', id: offer.id })}
                >
                  Decline
                </button>
              </div>
              {!can && <span className="why">{needsText(shortfall(state.stock, give))}</span>}
            </div>
          );
        })}
        {board.deliveries.length > 0 && (
          <div className="panel" data-testid="delivery">
            <div className="row-top">
              <span className="name">On the way</span>
              <span className="kind">Delivery</span>
            </div>
            {board.deliveries.map((d, i) => (
              <div className="line2" key={`${d.at}-${d.resource}-${i}`}>
                {amountsText({ [d.resource]: d.amount })} on the way, {duration(d.at - state.tick)}{' '}
                left
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
