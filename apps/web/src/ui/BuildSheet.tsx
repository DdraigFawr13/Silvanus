import { content } from '@silvanus/content';
import { jobCost, refusal, shortfall } from '@silvanus/sim';
import type { BuildingKind, Command, State } from '@silvanus/sim';
import { Sheet } from './Sheet';
import { amountsText, duration, needsText, reasonText } from './format';

// What a kind is for, read from the content.
function roleText(kind: BuildingKind): string {
  const tier = kind.tiers[0];
  if (tier.beds > 0) return `Beds ${tier.beds}`;
  if (kind.storage) return "Raises every store's cap";
  const made = new Set<string>();
  for (const method of content.methods) {
    if (method.building !== kind.id) continue;
    for (const id of Object.keys(method.makes)) {
      made.add((content.resources.find((r) => r.id === id)?.name ?? id).toLowerCase());
    }
  }
  if (made.size > 0) return `Makes ${[...made].join(' or ')}`;
  return `Work for ${tier.slots}`;
}

// Every building kind with its cost and time. A kind the town cannot start now stays in place,
// off, with what is missing.
export function BuildSheet({
  state,
  onBuild,
  onClose,
}: {
  state: State;
  onBuild: (command: Command) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Build on this lot" onClose={onClose} testId="build-sheet">
      {content.buildings.map((kind) => {
        const command: Command = { type: 'build', kind: kind.id };
        const cost = jobCost(state, command, content);
        const reason = refusal(state, command, content);
        const free = kind.freeWhenNone && Object.keys(cost).length === 0;
        return (
          <button
            type="button"
            key={kind.id}
            className="choice"
            data-testid={`build-${kind.id}`}
            disabled={reason !== null}
            onClick={() => onBuild(command)}
          >
            <span className="grow">
              <span className="cname">{kind.name}</span>
              <span className="cost">
                {roleText(kind)} ·{' '}
                {free ? <span className="free">Free: the town has none</span> : amountsText(cost)} ·{' '}
                {duration(kind.tiers[0].ticks)}
              </span>
              {reason !== null && (
                <span className="why">
                  {reason === 'noStock'
                    ? needsText(shortfall(state.stock, cost))
                    : reasonText(reason)}
                </span>
              )}
            </span>
            <span className="go">Build</span>
          </button>
        );
      })}
    </Sheet>
  );
}
