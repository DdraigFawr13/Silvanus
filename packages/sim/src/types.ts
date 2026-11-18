export type StreamName =
  'arrivals' | 'goals' | 'trader' | 'trips' | 'lots' | 'push' | `test:${string}`;
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
  plot: number; // the plot it stands on, an index in state.plots (D-058)
  shutLeft: number; // ticks a push method's mishap still shuts it, 0..48 (D-059)
  shutBy: string | null; // the mishap's `what` while shut, else null
  // A gathering building an older save had no site of its ground for: moved to a town lot,
  // where it works and gains nothing from a feature (D-058 amended). Only a save upgrade sets it.
  moved?: true;
};

// A place a building can stand (D-058): a town lot, or a site of one ground.
export type Plot = {
  id: number; // its index in state.plots
  ground: string | null; // null: a town lot; else a ground id (a site)
  feature: string | null; // town lots only; null is plain
  tier: number; // the Hall tier from which it can be cleared; 1 = open from the start
  open: boolean;
};

// A `tangle` job clears a plot (M2d S2) and names it in `plot`; its `toTier` is the plot's tier.
export type Job = {
  target: 'hall' | 'tangle' | number;
  toTier: number;
  ticksLeft: number;
  cost: Amounts;
  plot?: number;
};
export type LogLine = { tick: number; type: string; text: string };

// The board (M2e, rule 6): goals, the trader's offers, goods on the way and a forage trip.
export type Offer = {
  id: number;
  give: { resource: string; amount: number };
  get: { resource: string; amount: number };
  until: number; // the tick it is dropped at
};
export type Delivery = { resource: string; amount: number; at: number };
export type Trip = { residentIds: number[]; back: number };
export type Board = {
  goals: string[]; // on offer; [] until drawn
  active: string | null; // one of `goals`
  progress: number; // `make`: units made since the pick; 0 otherwise
  offers: Offer[]; // at most offersMax, oldest first
  nextOfferId: number; // offers number apart from nextId, so resident and building ids stay as they are
  nextOfferTick: number;
  deliveries: Delivery[]; // oldest first
  trip: Trip | null;
};

export type State = {
  contentVersion: number; // from Content.version; set to the running content's version on load
  seed: number;
  tick: number; // whole game hours since the start
  rng: RngState;
  stock: Amounts;
  hallTier: number;
  nextId: number; // shared by residents and buildings
  plots: Plot[]; // 31 in M2d: the town lots, then each ground's sites (D-058)
  buildings: Building[]; // in the order they were ordered; one per open plot
  queue: Job[]; // [0] is under way; length <= 1 + queueMax
  residents: Resident[];
  lastLeftTick: number; // tick of the last departure, minus the leaving gap at start
  jobsDirty: boolean;
  log: LogLine[]; // newest last, at most logMax
  board: Board;
};

export type Command =
  | { type: 'build'; kind: string; plot: number }
  | { type: 'upgrade'; buildingId: number }
  | { type: 'upgradeHall' }
  | { type: 'cancelJob'; index: number } // 1..queue.length-1; refunds its cost
  | { type: 'clear'; buildingId: number }
  | { type: 'setMethod'; buildingId: number; method: string }
  | { type: 'setOpen'; buildingId: number; count: number }
  | { type: 'pin'; residentId: number; buildingId: number | null }
  | { type: 'pickGoal'; id: string }
  | { type: 'acceptOffer'; id: number }
  | { type: 'declineOffer'; id: number }
  | { type: 'sendTrip'; residentIds: number[] };

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
  | { type: 'village'; tier: number }
  // the board (rule 6); each writes a log line. `offerGone`: an offer reached its `until`
  | { type: 'goalDone'; id: string; paid: Amounts }
  | { type: 'delivered'; resource: string; amount: number }
  | { type: 'tripBack'; finds: Amounts }
  | { type: 'offerGone'; id: number };

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
  site?: string; // a ground id: it stands only on a site of that ground; else on town lots
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

// What a goal asks for (D-049): goods made since the pick, a building at a tier, or residents.
export type GoalWhen =
  | { type: 'make'; resource: string; amount: number }
  | { type: 'building'; kind: string; tier: number }
  | { type: 'residents'; count: number };
// `hall`: the lowest Hall tier it is offered at. `reward`: a value (D-053), split across the
// stores with room when it is met.
export type Goal = { id: string; name: string; hall: number; when: GoalWhen; reward: number };

export type Content = {
  version: number;
  town: string;
  cycleTicks: number;
  // `value`: a whole number that sizes swaps and rewards (D-053); never shown, not a price
  resources: { id: string; name: string; cap: number; start: number; value: number }[];
  hall: {
    tiers: {
      name: string;
      lots: number; // shown only: the town lots open at this tier (townLots)
      residents: number;
      catchUpCap: number;
      cost: Amounts; // to reach this tier; {} for tier 1
      ticks: number;
      needResidents: number;
    }[];
  };
  // Plots (D-058). `townLots[i]`: the town lots Hall tier i + 1 lets be cleared; each Hall tier's
  // `lots` is the sum up to it. The lots' features are a deck of each feature `count` times and
  // `plainLots` plain ones, shuffled on the `lots` stream. Each ground has one site per Hall tier.
  grounds: { id: string; name: string }[];
  townLots: number[];
  // a lot's feature raises the output of the kinds in `boosts` by rules.boostPct
  features: { id: string; name: string; count: number; boosts: string[] }[];
  plainLots: number;
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
    leaveGapTicks: number; // ticks between two departures, at least (D-039)
    moraleStep: number;
    tavernPerWorker: number;
    tavernMax: number;
    logMax: number;
    founders: number;
    rewardPct: number; // every goal reward x rewardPct / 100 (the pace lever, spec J10)
    goalsOffered: number;
    offerEveryTicks: number;
    offersMax: number;
    firstOfferTick: number;
    deliveryTicks: number;
    tradeSharePct: number; // an offer's give, in percent of its resource's base cap
    tradeGetBelowPct: number; // an offer's get, only below this percent of its cap
    offerExtraTicks: number; // an offer lasts the catch-up cap plus this
    boostPct: number; // what a lot's feature adds to the output of the kinds it boosts
  };
  names: Record<string, { starts: string[]; ends: string[] }>;
  goals: Goal[];
  // forage trips (D-051): `size` residents for `ticks`, back with `draws` finds from the table
  trips: {
    size: number;
    ticks: number;
    draws: number;
    finds: { resource: string; min: number; max: number }[];
  };
};
