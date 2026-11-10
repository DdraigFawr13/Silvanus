import type { Amounts, BuildingKind, Content, Method } from '@silvanus/sim';
import { names } from './names';

// Every number here is a starting value for the playtest (D-030); the spec's "Content" section
// says where each came from. Rates are hundredths of a unit per worker per production cycle.

type Tier = [cost: Amounts, ticks: number, slots: number, beds: number];
const kind = (
  id: string,
  name: string,
  trade: string | null,
  skill: string | null,
  tiers: Tier[],
  extra: Partial<BuildingKind> = {},
): BuildingKind => ({
  id,
  name,
  trade,
  skill,
  tiers: tiers.map(([cost, ticks, slots, beds]) => ({ cost, ticks, slots, beds })),
  ...extra,
});

const method = (
  building: string,
  id: string,
  name: string,
  tier: number,
  makes: Amounts,
  uses: Amounts = {},
  fallback: string | null = null,
  cost: Amounts = {},
): Method => ({ id, building, name, tier, makes, uses, fallback, cost });

export const content: Content = {
  version: 2,
  town: 'Ashwick',
  cycleTicks: 4,
  resources: [
    { id: 'food', name: 'Food', cap: 200, start: 40 },
    { id: 'wood', name: 'Wood', cap: 200, start: 60 },
    { id: 'stone', name: 'Stone', cap: 200, start: 0 },
    { id: 'ore', name: 'Ore', cap: 100, start: 0 },
    { id: 'tools', name: 'Tools', cap: 50, start: 0 },
  ],
  hall: {
    tiers: [
      {
        name: 'Hamlet',
        lots: 6,
        residents: 25,
        catchUpCap: 480,
        cost: {},
        ticks: 0,
        needResidents: 0,
      },
      {
        name: 'Village',
        lots: 10,
        residents: 60,
        catchUpCap: 960,
        cost: { wood: 180, stone: 180, tools: 45 },
        ticks: 96,
        needResidents: 20,
      },
    ],
  },
  buildings: [
    kind('cottage', 'Cottage', null, null, [
      [{ wood: 30 }, 12, 0, 8],
      [{ wood: 50, stone: 20 }, 24, 0, 12],
      [{ wood: 80, stone: 50, tools: 10 }, 48, 0, 16],
    ]),
    kind('forager', "Forager's hut", 'Forager', 'husbandry', [
      [{ wood: 20 }, 8, 4, 0],
      [{ wood: 40, tools: 5 }, 24, 6, 0],
      [{ wood: 60, stone: 30, tools: 10 }, 48, 8, 0],
    ]),
    kind('farm', 'Farm', 'Farmer', 'husbandry', [
      [{ wood: 50, tools: 5 }, 24, 4, 0],
      [{ wood: 60, stone: 30, tools: 10 }, 36, 6, 0],
      [{ wood: 90, stone: 60, tools: 20 }, 48, 8, 0],
    ]),
    kind(
      'woodcutter',
      "Woodcutter's camp",
      'Woodcutter',
      'woodcraft',
      [
        [{ wood: 25 }, 8, 4, 0],
        [{ wood: 40, tools: 5 }, 24, 6, 0],
        [{ wood: 70, stone: 30, tools: 15 }, 48, 8, 0],
      ],
      { freeWhenNone: true },
    ),
    kind('mine', 'Mine', 'Miner', 'mining', [
      [{ wood: 40 }, 24, 4, 0],
      [{ wood: 60, tools: 10 }, 36, 6, 0],
      [{ wood: 90, stone: 40, tools: 20 }, 48, 8, 0],
    ]),
    kind('workshop', 'Workshop', 'Toolwright', 'crafting', [
      [{ wood: 40, stone: 20 }, 24, 4, 0],
      [{ wood: 60, stone: 40 }, 36, 6, 0],
      [{ wood: 90, stone: 60, tools: 20 }, 48, 8, 0],
    ]),
    kind(
      'storehouse',
      'Storehouse',
      null,
      null,
      [
        [{ wood: 40, stone: 20 }, 24, 0, 0],
        [{ wood: 70, stone: 50 }, 36, 0, 0],
        [{ wood: 100, stone: 80, tools: 10 }, 48, 0, 0],
      ],
      { storage: true },
    ),
    kind(
      'tavern',
      'Tavern',
      'Innkeeper',
      null,
      [
        [{ wood: 50, stone: 30 }, 24, 1, 0],
        [{ wood: 70, stone: 50, tools: 5 }, 36, 2, 0],
        [{ wood: 100, stone: 80, tools: 15 }, 48, 3, 0],
      ],
      { cheers: true },
    ),
  ],
  methods: [
    method('forager', 'gather', 'Gather', 1, { food: 50 }),
    method('forager', 'snares', 'Snares and baskets', 2, { food: 80 }, { tools: 2 }, 'gather', {
      wood: 20,
      tools: 5,
    }),
    method('forager', 'smoke', 'Smokehouse', 3, { food: 110 }, { tools: 2, wood: 10 }, 'gather', {
      wood: 50,
      stone: 20,
      tools: 10,
    }),
    method('farm', 'plots', 'Hand plots', 1, { food: 70 }),
    method('farm', 'ploughs', 'Iron ploughs', 2, { food: 120 }, { tools: 4 }, 'plots', {
      wood: 30,
      tools: 10,
    }),
    method('farm', 'rotation', 'Crop rotation', 3, { food: 160 }, { tools: 6 }, 'plots', {
      wood: 60,
      stone: 30,
      tools: 15,
    }),
    method('woodcutter', 'axes', 'Hand axes', 1, { wood: 40 }),
    method('woodcutter', 'sawpit', 'Saw pit', 2, { wood: 70 }, { tools: 3 }, 'axes', {
      wood: 30,
      tools: 5,
    }),
    method('woodcutter', 'coppice', 'Managed coppice', 3, { wood: 100 }, { tools: 4 }, 'axes', {
      wood: 60,
      stone: 20,
      tools: 15,
    }),
    method('mine', 'ore', 'Dig ore', 1, { ore: 30 }),
    method('mine', 'stone', 'Quarry stone', 1, { stone: 40 }),
    method('mine', 'shafts', 'Timbered shafts', 2, { ore: 55 }, { wood: 10 }, 'ore', {
      wood: 40,
      tools: 5,
    }),
    method('mine', 'cutstone', 'Cut-stone quarry', 2, { stone: 70 }, { tools: 3 }, 'stone', {
      wood: 30,
      tools: 10,
    }),
    method('workshop', 'mend', 'Mend and make do', 1, { tools: 5 }),
    method('workshop', 'forge', 'Forge tools', 1, { tools: 25 }, { ore: 25, wood: 10 }, 'mend', {
      wood: 20,
      stone: 10,
    }),
    method(
      'workshop',
      'hammer',
      'Water-wheel hammer',
      2,
      { tools: 45 },
      { ore: 40, wood: 15 },
      'mend',
      { wood: 40, stone: 30, tools: 10 },
    ),
  ],
  skills: [
    { id: 'husbandry', name: 'Husbandry' },
    { id: 'woodcraft', name: 'Woodcraft' },
    { id: 'mining', name: 'Mining' },
    { id: 'crafting', name: 'Crafting' },
  ],
  peoples: [
    { id: 'human', name: 'human', leans: ['husbandry', 'woodcraft'] },
    { id: 'dwarf', name: 'dwarf', leans: ['mining', 'crafting'] },
  ],
  traits: [
    { id: 'greenFingered', name: 'Green-fingered', likes: ['farm', 'forager'], dislikes: [] },
    { id: 'woodwise', name: 'Woodwise', likes: ['woodcutter'], dislikes: [] },
    { id: 'deepDelver', name: 'Deep-delver', likes: ['mine'], dislikes: ['farm'] },
    { id: 'deft', name: 'Deft', likes: ['workshop'], dislikes: [] },
    { id: 'sociable', name: 'Sociable', likes: ['tavern'], dislikes: ['mine'] },
    {
      id: 'hearthBound',
      name: 'Hearth-bound',
      likes: ['workshop', 'tavern'],
      dislikes: ['forager'],
    },
  ],
  rules: {
    eatPerDay: 1,
    arrivalFoodPerHead: 2,
    skillDays: 3,
    retoolTicks: 24,
    switchTicks: 4,
    queueMax: 3,
    leaveBelow: 15,
    leaveFloor: 8,
    moraleStep: 5,
    tavernPerWorker: 4,
    tavernMax: 12,
    logMax: 100,
    founders: 8,
  },
  names,
};
