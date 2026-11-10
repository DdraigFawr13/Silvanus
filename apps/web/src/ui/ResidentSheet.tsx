import { content } from '@silvanus/content';
import { kindOf, pinPreview, refusal, slotsOf } from '@silvanus/sim';
import type { Building, Command, Resident, State } from '@silvanus/sim';
import { useState } from 'react';
import { Sheet } from './Sheet';
import { ageOf, reasonLabel, reasonsText, signed, theList } from './format';
import { jobOf, moraleClass, peopleName, tradeOf } from './people';

const nameOf = (building: Building) => kindOf(content, building.kind)!.name;

// One resident: their work and pin, their morale and its reasons, skills and traits.
export function ResidentSheet({
  state,
  resident,
  send,
  onClose,
}: {
  state: State;
  resident: Resident;
  send: (command: Command) => void;
  onClose: () => void;
}) {
  // the list of places to pin to, then the one chosen, which waits for "Pin"
  const [listing, setListing] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const job = jobOf(state, resident);
  const pin = state.buildings.find((b) => b.id === resident.pinnedTo) ?? null;
  const people = peopleName(resident);
  // every built workplace a pin can name, in lot order
  const places = state.buildings.filter((b) => b.tier > 0 && slotsOf(content, b) > 0);
  const target = state.buildings.find((b) => b.id === chosen) ?? null;
  const unpin: Command = { type: 'pin', residentId: resident.id, buildingId: null };

  return (
    <Sheet title={resident.name} onClose={onClose} testId="resident-sheet">
      <p className="sub">
        {/^[aeiou]/i.test(people) ? 'An' : 'A'} {people}, {ageOf(state.tick, resident.bornTick)}{' '}
        years old
      </p>

      <h3 className="sheet-sec">Work</h3>
      <p data-testid="resident-job">
        {job ? `${tradeOf(state, resident)} at the ${nameOf(job)}` : 'No work'}
      </p>
      <p className="sub" data-testid="resident-pin">
        {pin ? `Pinned to the ${nameOf(pin)}` : 'Not pinned'}
      </p>
      {pin && pin.id !== resident.jobId && (
        <p className="sub w">No free slot at the {nameOf(pin)}: works elsewhere until one opens.</p>
      )}
      <div className="btns">
        <button
          type="button"
          className="btn second"
          data-testid="pin-to"
          aria-expanded={listing}
          onClick={() => {
            setListing(!listing);
            setChosen(null);
          }}
        >
          Pin to…
        </button>
        {pin && (
          <button
            type="button"
            className="btn second"
            data-testid="unpin"
            onClick={() => send(unpin)}
          >
            Unpin
          </button>
        )}
      </div>
      {listing && target === null && (
        <div className="panel" data-testid="pin-list">
          {places.length === 0 && <p className="sub">No workplace is built yet.</p>}
          {places.map((b) => {
            const why = refusal(
              state,
              { type: 'pin', residentId: resident.id, buildingId: b.id },
              content,
            );
            const here = state.residents.filter((r) => r.jobId === b.id).length;
            return (
              <button
                type="button"
                className="choice"
                key={b.id}
                data-testid="pin-choice"
                disabled={why !== null}
                onClick={() => setChosen(b.id)}
              >
                <span className="grow">
                  <span className="cname">
                    {nameOf(b)} <span className="tier">Tier {b.tier}</span>
                  </span>
                  <span className="cost">
                    {why === 'same'
                      ? 'Pinned here now'
                      : reasonsText(
                          pinPreview(state, resident.id, b.id, content),
                          'Nothing for or against',
                        )}
                  </span>
                  <span className="cost">
                    Workers {here} / {b.open}
                    {b.id === resident.jobId ? ' · works here now' : ''}
                  </span>
                </span>
                {why === null && <span className="go">›</span>}
              </button>
            );
          })}
        </div>
      )}
      {target && (
        <PinConfirm
          state={state}
          resident={resident}
          target={target}
          onPin={() => {
            send({ type: 'pin', residentId: resident.id, buildingId: target.id });
            setChosen(null);
            setListing(false);
          }}
          onCancel={() => setChosen(null)}
        />
      )}

      <h3 className="sheet-sec">Morale</h3>
      <p className={`big ${moraleClass(resident.morale)}`}>{resident.morale}</p>
      {resident.reasons.length === 0 ? (
        <p className="sub">Morale is weighed at the start of each game day.</p>
      ) : (
        <>
          <dl className="pairs">
            {resident.reasons.map((r) => (
              <div key={r.id} data-testid="reason">
                <dt>{reasonLabel(r.id)}</dt>
                <dd className={r.amount < 0 ? 'w' : 'ok'}>{signed(r.amount)}</dd>
              </div>
            ))}
          </dl>
          <p className="sub">
            Morale moves up to {content.rules.moraleStep} a day toward 50 plus these.
          </p>
        </>
      )}

      <h3 className="sheet-sec">Skills</h3>
      <dl className="pairs">
        {content.skills.map((skill) => (
          <div key={skill.id} data-testid="skill">
            <dt>{skill.name}</dt>
            <dd>{resident.skills[skill.id] ?? 0}</dd>
          </div>
        ))}
      </dl>

      <h3 className="sheet-sec">Traits</h3>
      {resident.traits.map((id) => {
        const trait = content.traits.find((t) => t.id === id)!;
        const names = (ids: string[]) => theList(ids.map((k) => kindOf(content, k)!.name));
        const likes = trait.likes.length > 0 ? `Likes ${names(trait.likes)}` : '';
        const dislikes = trait.dislikes.length > 0 ? `dislikes ${names(trait.dislikes)}` : '';
        return (
          <div className="trait" key={id} data-testid="trait">
            <span className="cname">{trait.name}</span>
            <span className="cost">{[likes, dislikes].filter(Boolean).join('; ')}</span>
          </div>
        );
      })}
    </Sheet>
  );
}

function PinConfirm({
  state,
  resident,
  target,
  onPin,
  onCancel,
}: {
  state: State;
  resident: Resident;
  target: Building;
  onPin: () => void;
  onCancel: () => void;
}) {
  const reasons = pinPreview(state, resident.id, target.id, content);
  const total = reasons.reduce((sum, r) => sum + r.amount, 0);
  return (
    <div className="confirm quiet" data-testid="pin-confirm">
      <p>
        Pin {resident.name} to the {nameOf(target)}?
      </p>
      {reasons.length === 0 ? (
        <p className="sub">The work brings nothing for or against their morale.</p>
      ) : (
        <dl className="pairs">
          {reasons.map((r) => (
            <div key={r.id}>
              <dt>{reasonLabel(r.id)}</dt>
              <dd className={r.amount < 0 ? 'w' : 'ok'}>{signed(r.amount)}</dd>
            </div>
          ))}
          <div className="total">
            <dt>From this work</dt>
            <dd className={total < 0 ? 'w' : total > 0 ? 'ok' : ''}>{signed(total)}</dd>
          </div>
        </dl>
      )}
      {target.open === 0 && (
        <p className="sub w">
          It has no open slots: {resident.name} will not work there until one opens.
        </p>
      )}
      <div className="btns">
        <button type="button" className="btn" data-testid="pin" onClick={onPin}>
          Pin
        </button>
        <button type="button" className="btn second" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
