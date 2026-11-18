import type { Amounts, BuildingKind, Content, Goal, GoalWhen, Method } from '@silvanus/sim';
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

const goal = (id: string, name: string, hall: number, when: GoalWhen, reward: number): Goal => ({
  id,
  name,
  hall,
  when,
  reward,
});
const make = (resource: string, amount: number): GoalWhen => ({ type: 'make', resource, amount });
const building = (kind: string, tier: number): GoalWhen => ({ type: 'building', kind, tier });
const residents = (count: number): GoalWhen => ({ type: 'residents', count });

export const content: Content = {
  version: 5,
  town: 'Ashwick',
  cycleTicks: 4,
  resources: [
    { id: 'food', name: 'Food', cap: 200, start: 40, value: 4 },
    { id: 'wood', name: 'Wood', cap: 200, start: 60, value: 5 },
    { id: 'stone', name: 'Stone', cap: 200, start: 0, value: 5 },
    { id: 'ore', name: 'Ore', cap: 100, start: 0, value: 7 },
    { id: 'tools', name: 'Tools', cap: 50, start: 0, value: 15 },
  ],
  hall: {
    tiers: [
      {
        name: 'Hamlet',
        lots: 6,
        residents: 25,
        catchUpCap: 1920,
        cost: {},
        ticks: 0,
        needResidents: 0,
      },
      {
        name: 'Village',
        lots: 10,
        residents: 60,
        catchUpCap: 3840,
        // M2e: a full Hamlet and full base stores, so the board's goods keep the Village at
        // 6 to 10 real hours on soak pass 2 (D-036; Morgan chose this 2026-11-17)
        cost: { wood: 200, stone: 200, tools: 50 },
        ticks: 96,
        needResidents: 25,
      },
    ],
  },
  // Plots (D-058, spec "Content"): 16 town lots (6 at the Hamlet, 4 more at the Village, 6 at
  // the Town), 3 sites for each ground. Boosts added in S3 for the new kinds are not here yet.
  grounds: [
    { id: 'forest', name: 'Forest' },
    { id: 'mountain', name: 'Mountain' },
    { id: 'fields', name: 'Fields' },
    { id: 'woods', name: 'Woods' },
    { id: 'river', name: 'River' },
  ],
  townLots: [6, 4, 6],
  features: [
    { id: 'soil', name: 'Good soil', count: 3, boosts: [] },
    { id: 'river', name: 'Riverside', count: 3, boosts: [] },
    { id: 'rock', name: 'Rock outcrop', count: 3, boosts: ['workshop'] },
    { id: 'edge', name: 'Forest edge', count: 3, boosts: ['workshop'] },
  ],
  plainLots: 4,
  buildings: [
    kind('cottage', 'Cottage', null, null, [
      [{ wood: 30 }, 12, 0, 8],
      [{ wood: 50, stone: 20 }, 24, 0, 12],
      [{ wood: 80, stone: 50, tools: 10 }, 48, 0, 16],
    ]),
    kind(
      'forager',
      "Forager's hut",
      'Forager',
      'husbandry',
      [
        [{ wood: 20 }, 8, 4, 0],
        [{ wood: 40, tools: 5 }, 24, 6, 0],
        [{ wood: 60, stone: 30, tools: 10 }, 48, 8, 0],
      ],
      { site: 'woods' },
    ),
    kind(
      'farm',
      'Farm',
      'Farmer',
      'husbandry',
      [
        [{ wood: 50, tools: 5 }, 24, 4, 0],
        [{ wood: 60, stone: 30, tools: 10 }, 36, 6, 0],
        [{ wood: 90, stone: 60, tools: 20 }, 48, 8, 0],
      ],
      { site: 'fields' },
    ),
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
      { freeWhenNone: true, site: 'forest' },
    ),
    kind(
      'mine',
      'Mine',
      'Miner',
      'mining',
      [
        [{ wood: 40 }, 24, 4, 0],
        [{ wood: 60, tools: 10 }, 36, 6, 0],
        [{ wood: 90, stone: 40, tools: 20 }, 48, 8, 0],
      ],
      { site: 'mountain' },
    ),
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
    leaveGapTicks: 672,
    moraleStep: 5,
    tavernPerWorker: 4,
    tavernMax: 12,
    logMax: 100,
    founders: 8,
    rewardPct: 100,
    goalsOffered: 3,
    offerEveryTicks: 240,
    offersMax: 3,
    firstOfferTick: 12,
    deliveryTicks: 24,
    tradeSharePct: 20,
    tradeGetBelowPct: 80,
    offerExtraTicks: 240,
    boostPct: 25,
  },
  names,
  // Rewards are values (D-053) of about a real hour of the town's work, measured on soak pass 2's
  // town: 941 to 1,999 an hour at the Hamlet, 2,113 to 2,453 at the Village (spec, "Content").
  goals: [
    goal('stockpile', 'Lay in timber', 1, make('wood', 80), 1000),
    goal('quarry', 'Open the quarry', 1, building('mine', 1), 1200),
    goal('forge', 'Light the forge', 1, building('workshop', 1), 1300),
    goal('harvest', 'A good harvest', 1, make('food', 120), 1100),
    goal('twelve', 'Twelve hearths', 1, residents(12), 1200),
    goal('snug', 'Snug cottages', 1, building('cottage', 2), 1200),
    // added in S1 so soak pass 2 offers three goals at every check-in (spec, "Slices")
    goal('masonry', 'Stone for walls', 1, make('stone', 80), 1000),
    goal('orevein', 'Follow the ore', 1, make('ore', 30), 1100),
    goal('toolrack', 'Tools for every hand', 1, make('tools', 15), 1200),
    goal('firstfield', 'Break the first field', 1, building('farm', 1), 1200),
    goal('alehouse', 'Raise a tavern', 1, building('tavern', 1), 1300),
    goal('toolmaker', 'A store of tools', 2, make('tools', 30), 2000),
    goal('deepmine', 'Deeper shafts', 2, building('mine', 2), 2200),
    goal('thirty', 'Thirty souls', 2, residents(30), 2100),
    goal('fields', 'Fields to the river', 2, building('farm', 2), 2200),
    goal('stores', 'Full granaries', 2, building('storehouse', 1), 2000),
    goal('stoneworks', 'Stone for the Village', 2, make('stone', 120), 2300),
  ],
  trips: {
    size: 2,
    ticks: 24,
    draws: 3,
    finds: [
      { resource: 'food', min: 15, max: 30 },
      { resource: 'wood', min: 10, max: 25 },
      { resource: 'stone', min: 8, max: 20 },
      { resource: 'ore', min: 6, max: 15 },
      { resource: 'tools', min: 2, max: 6 },
    ],
  },
};
