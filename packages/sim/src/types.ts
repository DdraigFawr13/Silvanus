export type StreamName = 'yield' | 'spare';
// stream name -> unsigned 32-bit state; a stream is added on its first draw
export type RngState = Record<string, number>;

export type Resident = {
  // unused in M0; holds the age and family fields (D-020). M1 adds trade, skills, traits and morale with schema 2 and an upgrade step
  id: number;
  name: string;
  people: string;
  bornTick: number;
  motherId: number | null;
  fatherId: number | null;
  spouseId: number | null;
  householdId: number | null;
};

export type State = {
  contentVersion: number; // from Content.version; set to the running content's version on load
  seed: number;
  tick: number; // whole game hours since the start
  rng: RngState;
  stock: { food: number };
  foragers: number; // M0 only, 0..content.camp.maxForagers
  residents: Resident[]; // [] in M0
};

export type Content = {
  version: number;
  resources: { food: { cap: number } };
  camp: {
    everyTicks: number;
    maxForagers: number;
    yieldMin: number;
    yieldMax: number;
  };
};

export type Command = { type: 'setForagers'; count: number };

export type LogEntry =
  | { tick: number; type: 'produced'; amount: number }
  | { tick: number; type: 'lost'; amount: number } // over the cap
  | { tick: number; type: 'foragersSet'; count: number }
  | { tick: number; type: 'rejected'; command: Command };
