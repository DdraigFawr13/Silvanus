import { content } from '@silvanus/content';
import { capsOf, goalOf, goalProgress, kindOf, rewardPreview } from '@silvanus/sim';
import type { Command, Goal, State } from '@silvanus/sim';
import { amountsText, resourceName } from './format';

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

// The board on the Town tab (M2e): the goals on offer. The trader and trips join in S2 and S3.
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
      </div>
    </>
  );
}
