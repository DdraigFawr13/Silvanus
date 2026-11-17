import { content } from '@silvanus/content';
import { onTrip } from '@silvanus/sim';
import type { Command, Resident, State } from '@silvanus/sim';
import { useState } from 'react';
import { Sheet } from './Sheet';
import { topSkill, tradeOf } from './people';
import { andList } from './format';

// The forage trip's picker (M2e S3): one tick row per resident not on a trip, those with no
// work first, then by name. Send is on at exactly the trip's size.
export function TripSheet({
  state,
  onSend,
  onClose,
}: {
  state: State;
  onSend: (command: Command) => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<number[]>([]);
  const size = content.trips.size;
  const list = state.residents
    .filter((r) => !onTrip(state, r.id))
    .sort(
      (a, b) =>
        Number(a.jobId !== null) - Number(b.jobId !== null) ||
        a.name.localeCompare(b.name) ||
        a.id - b.id,
    );
  // a chosen resident who has left the town drops out of the choice
  const picked = chosen.filter((id) => list.some((r) => r.id === id));
  const names = picked.map((id) => list.find((r) => r.id === id)!.name);
  const toggle = (resident: Resident) =>
    setChosen((now) =>
      now.includes(resident.id) ? now.filter((id) => id !== resident.id) : [...now, resident.id],
    );
  return (
    <Sheet title="Forage trip" onClose={onClose} testId="trip-sheet">
      <div className="trip-head">
        <div className="grow">
          <p className="sub">
            Two go to the forest edge for a day. They leave their jobs; anyone with no work may step
            in.
          </p>
          {names.length > 0 && (
            <p className="trip-names" data-testid="trip-chosen">
              {andList(names)}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn"
          disabled={picked.length !== size}
          onClick={() => onSend({ type: 'sendTrip', residentIds: picked })}
        >
          Send
        </button>
      </div>
      {list.map((r) => {
        const on = picked.includes(r.id);
        const best = topSkill(r);
        return (
          <button
            type="button"
            key={r.id}
            className="trip-pick"
            role="checkbox"
            aria-checked={on}
            data-testid="trip-pick"
            onClick={() => toggle(r)}
          >
            <span className="grow">
              <span className="trip-name">{r.name}</span>
              <span className="line2">
                {tradeOf(state, r)} · {best.name} {best.value}
              </span>
            </span>
            <span className={on ? 'box on' : 'box'} aria-hidden="true">
              {on ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </Sheet>
  );
}
