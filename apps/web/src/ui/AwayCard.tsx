import { content } from '@silvanus/content';
import { kindOf } from '@silvanus/sim';
import type { State, Summary } from '@silvanus/sim';
import { amountsText, cyclesText, duration } from './format';

// What happened while the page was closed: shown after a catch-up of AWAY_MIN_TICKS or more,
// until it is dismissed or the next such catch-up replaces it (J13).
export function AwayCard({
  state,
  summary,
  onDismiss,
}: {
  state: State;
  summary: Summary;
  onDismiss: () => void;
}) {
  const made = Object.fromEntries(Object.entries(summary.made).filter(([, n]) => n > 0));
  const short = Object.entries(summary.shortCycles).map(([id, cycles]) => {
    const building = state.buildings.find((b) => b.id === Number(id));
    const name = building ? kindOf(content, building.kind)!.name : 'A cleared building';
    return `${name}, for ${cyclesText(cycles)}`;
  });
  return (
    <div className="panel away" data-testid="away">
      <div className="row-top">
        <span className="name">While you were away</span>
      </div>
      <div className="line2">{duration(summary.ticks)} passed.</div>
      <dl className="away-list">
        <dt>Made</dt>
        <dd data-testid="away-made">
          {Object.keys(made).length > 0 ? amountsText(made) : 'Nothing'}
        </dd>
        {summary.arrived.length > 0 && (
          <>
            <dt>Arrived</dt>
            <dd data-testid="away-arrived">{summary.arrived.join(', ')}</dd>
          </>
        )}
        {summary.left.length > 0 && (
          <>
            <dt>Left</dt>
            <dd className="w" data-testid="away-left">
              {summary.left.join(', ')}
            </dd>
          </>
        )}
        {summary.finished.length > 0 && (
          <>
            <dt>Finished</dt>
            <dd data-testid="away-finished">{summary.finished.join('; ')}</dd>
          </>
        )}
        {short.length > 0 && (
          <>
            <dt>Ran short</dt>
            <dd className="w" data-testid="away-short">
              {short.join('; ')}
            </dd>
          </>
        )}
      </dl>
      <button type="button" className="btn second" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
