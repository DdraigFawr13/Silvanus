import { content } from '@silvanus/content';
import { jobCost, kindOf, plotBoost, plotsFor, refusal, shortfall } from '@silvanus/sim';
import type { BuildingKind, Command, Plot, State } from '@silvanus/sim';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sheet } from './Sheet';
import { amountsText, andList, duration, needsText, reasonText, theList } from './format';

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

const groundName = (id: string) => content.grounds.find((g) => g.id === id)?.name ?? id;
const featureOf = (plot: Plot) => content.features.find((f) => f.id === plot.feature);
const kindName = (id: string) => kindOf(content, id)?.name ?? id;
const pct = `+${content.rules.boostPct}%`;

// A plot's name: "Forest edge", "Plain" for a town lot; "Forest site" for a site.
export function plotName(plot: Plot): string {
  if (plot.ground !== null) return `${groundName(plot.ground)} site`;
  return featureOf(plot)?.name ?? 'Plain';
}

// What a town lot adds, for the Town tab's empty lot: "Forest edge: Workshop +25%".
export function lotGainText(plot: Plot): string {
  const feature = featureOf(plot);
  if (!feature) return 'Plain';
  if (feature.boosts.length === 0) return `${feature.name}: nothing gains here yet`;
  return `${feature.name}: ${feature.boosts.map(kindName).join(', ')} ${pct}`;
}

// The build list's "where" line: the kind's type of plot, how many are free, and which add to it.
function whereLine(state: State, kind: BuildingKind): { text: string; good?: string } | null {
  const free = plotsFor(state, kind.id, content);
  if (free.length === 0) return null;
  if (kind.site !== undefined)
    return { text: `${groundName(kind.site)} site · ${free.length} free` };
  const gains = new Map<string, number>();
  for (const plot of free) {
    if (plotBoost(content, plot, kind.id) === 0) continue;
    const name = featureOf(plot)!.name.toLowerCase();
    gains.set(name, (gains.get(name) ?? 0) + 1);
  }
  const text = `Town lot · ${free.length} free`;
  if (gains.size === 0) return { text: `${text}, no lot adds to it` };
  const on = [...gains].map(([name, n]) => `${name} (${n})`).join(', ');
  return { text, good: `${pct} on ${on}` };
}

const noPlotText = (kind: BuildingKind) =>
  kind.site !== undefined
    ? `No free ${groundName(kind.site).toLowerCase()} site`
    : 'No free town lot';

// Why a build is off, in words.
function whyText(state: State, command: Command): string | null {
  const reason = refusal(state, command, content);
  if (reason === null) return null;
  if (reason === 'noStock')
    return needsText(shortfall(state.stock, jobCost(state, command, content)));
  return reasonText(reason);
}

function KindRow({
  state,
  kind,
  command,
  why,
  extra,
  onPick,
}: {
  state: State;
  kind: BuildingKind;
  command: Command;
  why: string | null;
  extra: ReactNode;
  onPick: () => void;
}) {
  const cost = jobCost(state, command, content);
  const free = kind.freeWhenNone && Object.keys(cost).length === 0;
  return (
    <button
      type="button"
      className="choice"
      data-testid={`build-${kind.id}`}
      disabled={why !== null}
      onClick={onPick}
    >
      <span className="grow">
        <span className="cname">{kind.name}</span>
        <span className="cost">
          {roleText(kind)} ·{' '}
          {free ? <span className="free">Free: the town has none</span> : amountsText(cost)} ·{' '}
          {duration(kind.tiers[0].ticks)}
        </span>
        {extra}
        {why !== null && <span className="why">{why}</span>}
      </span>
      <span className="go">Build</span>
    </button>
  );
}

// The build sheet (M2d S0 mock-up). From the Build button: every kind, where it can stand and
// which free lots add to it; choosing one with more than one free plot opens the lot picker.
// From an empty lot or site (`plot`): only the kinds that stand there, those it adds to first.
export function BuildSheet({
  state,
  plot,
  onBuild,
  onClose,
}: {
  state: State;
  plot?: number;
  onBuild: (command: Command) => void;
  onClose: () => void;
}) {
  const [picking, setPicking] = useState<string | null>(null);
  const chosen = plot === undefined ? undefined : state.plots[plot];

  if (chosen) {
    const kinds = content.buildings.filter((k) => (k.site ?? null) === chosen.ground);
    const gains = (k: BuildingKind) => plotBoost(content, chosen, k.id) > 0;
    const ordered = [...kinds.filter(gains), ...kinds.filter((k) => !gains(k))];
    const feature = featureOf(chosen);
    const title =
      chosen.ground !== null
        ? `Build on the ${plotName(chosen).toLowerCase()}`
        : feature
          ? `Build on the ${feature.name.toLowerCase()}`
          : 'Build on a plain lot';
    const boosted = kinds.filter(gains).map((k) => k.name);
    const intro =
      chosen.ground !== null
        ? null
        : !feature
          ? 'A plain lot: no building gains here.'
          : boosted.length === 0
            ? `${feature.name}: nothing gains here yet.`
            : `${feature.name}: ${theList(boosted)} ${boosted.length === 1 ? 'makes' : 'make'} ${content.rules.boostPct}% more here.`;
    return (
      <Sheet title={title} onClose={onClose} testId="build-sheet">
        {intro && <p className="sheet-intro">{intro}</p>}
        {ordered.map((kind) => {
          const command: Command = { type: 'build', kind: kind.id, plot: chosen.id };
          return (
            <KindRow
              key={kind.id}
              state={state}
              kind={kind}
              command={command}
              why={whyText(state, command)}
              extra={gains(kind) && <span className="cost good">{pct} here</span>}
              onPick={() => onBuild(command)}
            />
          );
        })}
      </Sheet>
    );
  }

  const kind = picking === null ? undefined : kindOf(content, picking);
  // the picker needs a free plot; with none left it shows the list, whose row says why
  const pickable = kind ? plotsFor(state, kind.id, content) : [];
  if (kind && pickable.length > 0) {
    const free = pickable;
    const first: Command = { type: 'build', kind: kind.id, plot: free[0]?.id ?? -1 };
    return (
      <Sheet title={`Where to build the ${kind.name}`} onClose={onClose} testId="build-sheet">
        <p className="sheet-intro">
          {amountsText(jobCost(state, first, content))} · {duration(kind.tiers[0].ticks)}. A lot's
          feature adds {content.rules.boostPct}% to what the buildings it names make.
        </p>
        <div data-testid="lot-picker">
          {free.map((p) => {
            const command: Command = { type: 'build', kind: kind.id, plot: p.id };
            const why = whyText(state, command);
            const feature = featureOf(p);
            const gain = plotBoost(content, p, kind.id) > 0;
            const others = feature ? feature.boosts.filter((id) => id !== kind.id) : [];
            const line = gain ? (
              <span className="cost good">
                {kind.name} {pct}
              </span>
            ) : (
              <span className="cost">
                {!feature
                  ? p.ground === null
                    ? 'No gain for any building'
                    : ''
                  : others.length === 0
                    ? 'No gain for any building yet'
                    : `No gain for a ${kind.name} · ${andList(others.map(kindName))} ${pct}`}
              </span>
            );
            return (
              <button
                type="button"
                key={p.id}
                className="choice"
                data-testid="pick-plot"
                disabled={why !== null}
                onClick={() => onBuild(command)}
              >
                <span className="grow">
                  <span className="cname">{plotName(p)}</span>
                  {line}
                  {why !== null && <span className="why">{why}</span>}
                </span>
                <span className="go">Build</span>
              </button>
            );
          })}
        </div>
        <div className="btns">
          <button type="button" className="btn second" onClick={() => setPicking(null)}>
            ‹ Other buildings
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="Build" onClose={onClose} testId="build-sheet">
      {content.buildings.map((k) => {
        const free = plotsFor(state, k.id, content);
        const command: Command = { type: 'build', kind: k.id, plot: free[0]?.id ?? -1 };
        const where = whereLine(state, k);
        const why = free.length === 0 ? noPlotText(k) : whyText(state, command);
        return (
          <KindRow
            key={k.id}
            state={state}
            kind={k}
            command={command}
            why={why}
            extra={
              where && (
                <span className="cost">
                  {where.text}
                  {where.good && (
                    <>
                      {' · '}
                      <span className="free">{where.good}</span>
                    </>
                  )}
                </span>
              )
            }
            // exactly one free plot: no picker (spec J8)
            onPick={() => (free.length === 1 ? onBuild(command) : setPicking(k.id))}
          />
        );
      })}
    </Sheet>
  );
}
