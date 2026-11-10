export type StreamName = 'arrivals' | `test:${string}`;
// stream name -> unsigned 32-bit state; a stream is added on its first draw
export type RngState = Record<string, number>;
// resource id -> whole units (or the scaled unit a comment names)
export type Amounts = Record<string, number>;

export type Resident = {
  id: number;
  name: string;
  people: string;
  bornTick: number;
  // null in M1; the family fields are kept for M4a (D-020)
  motherId: number | null;
  fatherId: number | null;
  spouseId: number | null;
  householdId: number | null;
  skills: Record<string, number>; // 0..100 per content skill id
  traits: string[]; // 2 trait ids
  morale: number; // 0..100
  reasons: { id: string; amount: number }[]; // the terms of the last morale target
  jobId: number | null; // a building id
  pinnedTo: number | null; // a building id
  workDays: number; // game days worked in the current job since the last skill point
  arrivedTick: number;
};

export type Building = {
  id: number;
  kind: string;
  tier: number; // 0 while its first build is queued or under way
  method: string | null; // null for buildings without methods
  open: number; // open worker slots, 0..slots at this tier
  retoolLeft: number; // ticks
  carry: Amounts; // ten-thousandths of a unit made and not yet whole
  debt: Amounts; // hundredths of a unit of input owed
  short: boolean; // ran by its fallback in the last cycle
  owned: string[]; // methods this building owns: its free ones and what it bought (D-034)
};

export type Job = { target: 'hall' | number; toTier: number; ticksLeft: number; cost: Amounts };
export type LogLine = { tick: number; type: string; text: string };

export type State = {
  contentVersion: number; // from Content.version; set to the running content's version on load
  seed: number;
  tick: number; // whole game hours since the start
  rng: RngState;
  stock: Amounts;
  hallTier: number;
  nextId: number; // shared by residents and buildings
  buildings: Building[]; // in lot order; length <= lots
  queue: Job[]; // [0] is under way; length <= 1 + queueMax
  residents: Resident[];
  lastLeftTick: number; // tick of the last departure, minus a season at start
  jobsDirty: boolean;
  log: LogLine[]; // newest last, at most logMax
};

export type Command =
  | { type: 'build'; kind: string }
  | { type: 'upgrade'; buildingId: number }
  | { type: 'upgradeHall' }
  | { type: 'cancelJob'; index: number } // 1..queue.length-1; refunds its cost
  | { type: 'clear'; buildingId: number }
  | { type: 'setMethod'; buildingId: number; method: string }
  | { type: 'setOpen'; buildingId: number; count: number }
  | { type: 'pin'; residentId: number; buildingId: number | null };

export type Reason =
  | 'unknown'
  | 'noLot'
  | 'queueFull'
  | 'noStock'
  | 'busy'
  | 'notReady'
  | 'tooFew'
  | 'notAllowed'
  | 'same'
  | 'range';

// What a tick did. `built`, `upgraded`, `cleared`, `capLost`, `short`, `arrived`, `left` and
// `village` also write a log line.
export type Event =
  | { type: 'rejected'; command: Command; reason: Reason }
  | { type: 'made' | 'used' | 'lost'; resource: string; amount: number }
  | { type: 'built' | 'upgraded' | 'cleared'; kind: string; tier: number }
  | { type: 'capLost'; resource: string; amount: number }
  // a building's `short` turned true; writes a log line
  | { type: 'short'; buildingId: number; resource: string }
  // a production cycle run by a building's fallback
  | { type: 'fellBack'; buildingId: number }
  | { type: 'arrived' | 'left'; residentId: number; name: string }
  // the Hall reached a new tier
  | { type: 'village'; tier: number };

export type Summary = {
  ticks: number;
  made: Amounts;
  lost: Amounts;
  used: Amounts;
  arrived: string[];
  left: string[];
  finished: string[]; // "Mine, tier 2"
  shortCycles: Record<number, number>; // building id -> production cycles run by a fallback
};

export type BuildingKind = {
  id: string;
  name: string;
  trade: string | null; // what its workers are called
  skill: string | null; // the skill its work uses and grows
  freeWhenNone?: boolean; // costs nothing while the town has none of this kind
  storage?: boolean; // each finished tier adds one base cap to every store
  cheers?: boolean; // each worker adds rules.tavernPerWorker to everyone's morale, to tavernMax
  tiers: { cost: Amounts; ticks: number; slots: number; beds: number }[]; // [0] is tier 1
};

export type Method = {
  id: string;
  building: string;
  name: string;
  tier: number; // the building tier that unlocks it
  makes: Amounts; // hundredths of a unit per worker per production cycle
  uses: Amounts;
  fallback: string | null; // the basic method a method with inputs drops to
  cost: Amounts; // paid once by a building to own it; {} for a method every building owns (D-034)
};

export type Content = {
  version: number;
  town: string;
  cycleTicks: number;
  resources: { id: string; name: string; cap: number; start: number }[];
  hall: {
    tiers: {
      name: string;
      lots: number;
      residents: number;
      catchUpCap: number;
      cost: Amounts; // to reach this tier; {} for tier 1
      ticks: number;
      needResidents: number;
    }[];
  };
  buildings: BuildingKind[];
  methods: Method[]; // a building's first method listed is the one it starts on
  skills: { id: string; name: string }[];
  peoples: { id: string; name: string; leans: string[] }[];
  traits: { id: string; name: string; likes: string[]; dislikes: string[] }[];
  rules: {
    eatPerDay: number;
    arrivalFoodPerHead: number;
    skillDays: number;
    retoolTicks: number; // to set up a method the building has just bought
    switchTicks: number; // to switch to a method the building owns
    queueMax: number;
    leaveBelow: number;
    leaveFloor: number;
    moraleStep: number;
    tavernPerWorker: number;
    tavernMax: number;
    logMax: number;
    founders: number;
  };
  names: Record<string, { starts: string[]; ends: string[] }>;
};
