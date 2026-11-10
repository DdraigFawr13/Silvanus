import { content } from '@silvanus/content';
import { hallOf } from '@silvanus/sim';
import type { Command, Resident, State } from '@silvanus/sim';
import { useState } from 'react';
import { ResidentSheet } from './ResidentSheet';
import { jobOf, moraleClass, peopleName, topSkill, tradeOf } from './people';

type Sort = 'name' | 'morale' | 'skill';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'morale', label: 'Morale' },
  { id: 'skill', label: 'Top skill' },
];

const byName = (a: Resident, b: Resident) => a.name.localeCompare(b.name) || a.id - b.id;
// Name A to Z; morale lowest first, so trouble comes to the top; top skill highest first.
const ORDER: Record<Sort, (a: Resident, b: Resident) => number> = {
  name: byName,
  morale: (a, b) => a.morale - b.morale || byName(a, b),
  skill: (a, b) => topSkill(b).value - topSkill(a).value || byName(a, b),
};

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Who lives in the town: filter by trade, sort, and open a resident's sheet.
export function PeopleTab({ state, send }: { state: State; send: (command: Command) => void }) {
  // 'all', 'idle', or a building kind id (its trade)
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<Sort>('name');
  const [open, setOpen] = useState<number | null>(null);

  const kindOfJob = (resident: Resident) => jobOf(state, resident)?.kind ?? null;
  // a chip per trade that someone has, in the content's building order
  const trades = content.buildings.filter(
    (kind) => kind.trade !== null && state.residents.some((r) => kindOfJob(r) === kind.id),
  );
  // a trade chip whose last worker went falls back to All
  const shown = filter === 'all' || filter === 'idle' || trades.some((k) => k.id === filter);
  const active = shown ? filter : 'all';
  const list = state.residents
    .filter((r) =>
      active === 'all' ? true : active === 'idle' ? r.jobId === null : kindOfJob(r) === active,
    )
    .sort(ORDER[sort]);
  const idle = state.residents.filter((r) => r.jobId === null).length;
  const resident = state.residents.find((r) => r.id === open) ?? null;

  const chip = (id: string, label: string) => (
    <button
      type="button"
      key={id}
      className={active === id ? 'chip on' : 'chip'}
      aria-pressed={active === id}
      data-testid={`chip-${id}`}
      onClick={() => setFilter(id)}
    >
      {label}
    </button>
  );

  return (
    <>
      <h2 className="sec">Residents</h2>
      <p className="sub" data-testid="people-count">
        {state.residents.length} of {hallOf(state, content).residents} · {idle} with no work
      </p>
      <div className="chips" role="group" aria-label="Show">
        {chip('all', 'All')}
        {chip('idle', 'Idle')}
        {trades.map((kind) => chip(kind.id, kind.trade!))}
      </div>
      <div className="sorts" role="group" aria-label="Sort by">
        <span className="sub">Sort</span>
        {SORTS.map((s) => (
          <button
            type="button"
            key={s.id}
            className={sort === s.id ? 'chip on' : 'chip'}
            aria-pressed={sort === s.id}
            data-testid={`sort-${s.id}`}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="sub">Nobody here.</p>}
      {list.map((r) => {
        const best = topSkill(r);
        const job = jobOf(state, r);
        return (
          <button
            type="button"
            className="panel lot"
            key={r.id}
            data-testid="person"
            onClick={() => setOpen(r.id)}
          >
            <span className="grow">
              <span className="row-top">
                <span className="name">{r.name}</span>
                <span className={`mor ${moraleClass(r.morale)}`}>
                  Morale <b data-testid="morale">{r.morale}</b>
                </span>
              </span>
              <span className="line2">
                {cap(peopleName(r))} ·{' '}
                {job ? tradeOf(state, r) : <span className="w">No trade</span>} · {best.name}{' '}
                {best.value}
                {r.pinnedTo !== null && ' · Pinned'}
              </span>
            </span>
            <span className="go">›</span>
          </button>
        );
      })}
      {resident && (
        <ResidentSheet
          state={state}
          resident={resident}
          send={send}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
