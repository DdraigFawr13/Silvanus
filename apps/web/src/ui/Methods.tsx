import { content } from '@silvanus/content';
import {
  freeMethods,
  kindOf,
  methodOf,
  perDay,
  refusal,
  shortInput,
  shortfall,
} from '@silvanus/sim';
import type { Building, Command, State } from '@silvanus/sim';
import { useState } from 'react';
import { amountsText, duration, needsText, perDayText, resourceName } from './format';

// The building sheet's methods: what each makes and uses, which is in use, which are owned and
// what the rest cost (D-034). Choosing one asks first in the sheet, since even a free switch
// stops work.
export function Methods({
  state,
  building,
  send,
}: {
  state: State;
  building: Building;
  send: (command: Command) => void;
}) {
  const [asking, setAsking] = useState<string | null>(null);
  const kind = kindOf(content, building.kind)!;
  const current = methodOf(content, building.method)!;
  const setup = duration(content.rules.retoolTicks);
  const quick = duration(content.rules.switchTicks);
  const missing = building.short ? shortInput(state, building, content) : null;

  return (
    <>
      <h3 className="sheet-sec">Method</h3>
      <p className="sub">
        Each line is per worker, each game day. A method this building has not used before is bought
        once and takes {setup} to set up. Switching to one it owns is free and takes {quick}.
      </p>
      {building.retoolLeft > 0 && (
        <p className="sub" data-testid="retooling">
          Retooling, {duration(building.retoolLeft)} left
        </p>
      )}
      {building.short && (
        <p className="sub w">
          Short of {missing ? resourceName(missing) : 'an input'}: running{' '}
          {methodOf(content, current.fallback)!.name}
        </p>
      )}
      {content.methods
        .filter((method) => method.building === building.kind)
        .map((method) => {
          const rate = perDay(content, method.id);
          const command: Command = {
            type: 'setMethod',
            buildingId: building.id,
            method: method.id,
          };
          const why = refusal(state, command, content);
          const owned = building.owned.includes(method.id);
          const price = amountsText(method.cost);
          const inUse = method.id === building.method;
          const locked = why === 'notAllowed';
          let label = '';
          if (inUse) {
            label = building.short
              ? 'In use, short'
              : building.retoolLeft > 0
                ? 'In use, retooling'
                : 'In use';
          }
          return (
            <div key={method.id}>
              <div className={locked ? 'mrow off' : 'mrow'} data-testid={`method-${method.id}`}>
                <span className="grow">
                  <span className="mname">{method.name}</span>
                  <span className="rate">
                    Makes {perDayText(rate.makes)}
                    {Object.keys(rate.uses).length > 0 && ` · Uses ${perDayText(rate.uses)}`}
                  </span>
                  {!owned && <span className="rate">Costs {price}</span>}
                  {owned && !inUse && <span className="rate">Owned</span>}
                  {why === 'noStock' && (
                    <span className="why">{needsText(shortfall(state.stock, method.cost))}</span>
                  )}
                </span>
                {inUse ? (
                  <span
                    className={
                      building.short ? 'state w' : building.retoolLeft > 0 ? 'state lock' : 'state'
                    }
                  >
                    {label}
                  </span>
                ) : locked ? (
                  <span className="state lock">Tier {method.tier}</span>
                ) : (
                  <button
                    type="button"
                    className="btn second"
                    disabled={why !== null}
                    onClick={() => setAsking(method.id)}
                  >
                    {owned ? 'Switch' : 'Buy'}
                  </button>
                )}
              </div>
              {asking === method.id && !inUse && (
                <div className="confirm quiet" data-testid="method-confirm">
                  <p>
                    {owned
                      ? `Switch the ${kind.name} to ${method.name}? It makes nothing for ${quick} while it retools.`
                      : `Buy ${method.name} for the ${kind.name} for ${price}? It makes nothing for ${setup} while it is set up. After that the ${kind.name} owns it: switching to it is free and takes ${quick}.`}
                  </p>
                  <div className="btns">
                    <button
                      type="button"
                      className="btn"
                      disabled={why !== null}
                      onClick={() => {
                        send(command);
                        setAsking(null);
                      }}
                    >
                      {owned ? 'Switch' : 'Buy and switch'}
                    </button>
                    <button type="button" className="btn second" onClick={() => setAsking(null)}>
                      Keep {current.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}

// Whether clearing this building would lose methods it bought.
export const boughtAny = (building: Building) =>
  building.owned.length > freeMethods(content, building.kind).length;
