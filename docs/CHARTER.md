# Silvanus — Project Charter

As of 2026-11-09. Exported from the planning doc; this file is the home of the charter from here on.

Silvanus is a fantasy frontier-town management idle sim for an Android phone. The town stands under a Crown writ at the edge of a deep forest that is rich in magical resources and full of monsters. The player builds and upgrades on open lots, steers population into professions, and runs an adventurers' guild by posting and funding quests. Seeded random events and a generated town chronicle supply the story. The first target is a playable loop installed on the phone as a PWA, with zero runtime LLM cost.

## At a glance

Loop: People → Lots and buildings → Stores and treasury → Guild and quest board → The Gloamwood → Loot, renown, safety → People. The inbox asks the player for a decision at every stage; the chronicle records every outcome.

People staff buildings, buildings fill the stores, the stores fund quests, and what the quests bring back draws more people. The inbox is where the player steers the loop; the chronicle is what the loop leaves behind.

## Design pillars and non-goals

Five pillars decide every scope question. A feature that serves none of them goes to the parking list.

- **Decisions, not placement.** Building means choosing what occupies the next open lot. There is no grid, no roads and no adjacency puzzle. Lots are scarce, so every choice excludes another.
- **Idle with a pulse.** The town produces while the app is closed. Each session opens on a short inbox of decisions (events, quest reports, petitions), not a row of collect buttons.
- **People are the content.** Townsfolk and adventurers carry professions, skills and traits. They advance, retire, die and are remembered.
- **The town has a direction.** Charters lock and unlock buildings, professions and event pools. Two towns from different seeds and choices play differently.
- **Story falls out of the simulation.** The chronicle renders what the rules produced into prose. Nothing is narrated that did not happen in the state.

Target session shape: a 2 to 5 minute check-in several times per day, with 20 to 30 minute sessions possible when there is a backlog to spend.

**Non-goals for v1.0**

- Town layout, pathfinding or a simulated map view
- Direct control of combat or of individual residents
- Runtime LLM calls of any kind
- Multiplayer, accounts, cloud sync, monetization
- App-store release

## Lineage

Each earlier project contributes one system and leaves its most expensive part behind.

| Source | Carried into Silvanus | Left behind |
| --- | --- | --- |
| Story generator | Template-and-grammar narrative; the chronicle as the readable output | Free-form generation with no game state underneath |
| Adventure manager | Guild roster, quest posting, funding, expedition reports | Direct control of the expedition itself |
| Vulcan | Indirect control through policies and priorities; deep characters; deterministic rules-based TypeScript engine; no API cost | Map simulation, pathfinding, real-time with pause, multi-generational scale at launch |
| Pantheon | Power tiers 1 to 5 and segmented threat clocks, as mechanisms only | The AI narrator; single-character play; the world bible |
| Caravan concept | Reactive supply and demand; rumors; caravans as timed trade expeditions; grounded low-fantasy tone | Deck-building, card combat, the painted map |

The common failure of the earlier projects was simulation depth arriving before a playable loop. The milestone plan below inverts that order.

## Setting

The setting is a fresh low-fantasy world, written for this game. Place names below are placeholders.

- **The town** is a frontier settlement founded under a writ from a distant Crown. It is the last stop before the forest.
- **The Gloamwood** is the forest. It has three depth bands: the **Eaves**, the **Deepwood** and the **Heart**. Each band holds richer magical materials and worse monsters than the one before it.
- **Sites** are scattered inside each band (dens, ruins, groves, old roads) and are found by scouting. A band opens once enough of the previous band is scouted and the guild hall reaches the required tier.
- **The Crown** expects a yearly levy of forest goods. Demands and inspections arrive as events. **Favor** is a resource: high favor brings grants, settlers and a garrison; low favor brings fines and withdrawn protection. The writ cannot be revoked, which keeps decline recoverable.
- **Peoples.** The town is mixed: humans, dwarves, elves and halflings settle side by side. A people gives leanings toward certain traits and professions, never restrictions.
- **Magic is a craft.** Heartwood, glowcap and spirit amber are high-tier resources. Enchanters and alchemists are ordinary professions with ordinary recipes.

## Core loop and time model

A check-in is four steps: read the inbox, resolve what it asks, spend what accumulated, leave.

1. **Read.** The inbox lists events awaiting a decision, quest reports, arrivals and departures since the last session.
2. **Resolve.** Each event offers 2 to 4 choices with visible costs and stated checks.
3. **Spend.** Build or upgrade on a lot, post or commission quests, adjust worker quotas, appoint notables, change policies.
4. **Leave.** The simulation continues from the saved state on the next open.

**Time model** (all figures are starting values for tuning)

| Quantity | Value |
| --- | --- |
| Simulation tick | 1 game hour |
| Real time per tick | 60 s |
| Game day | 24 ticks = 24 min real |
| Season | 7 game days = 2 h 48 min real |
| Game year | 4 seasons = 11 h 12 min real |
| Offline catch-up cap | 8 h (480 ticks) at start; raised to 24 h by civic upgrades |
| Pending decisions held | 5; older ones resolve by their timeout choice |

- **Offline catch-up.** On resume the engine runs `min(elapsed, cap)` ticks deterministically. The result is identical to having left the app open, because the simulation takes no input from wall-clock time other than the tick count.
- **The Steward.** Every event declares a timeout choice. A decision left pending past its deadline resolves by that choice, so the simulation never stalls while the player is away. Steward behavior becomes configurable through policies in M4.
- **No tap rewards.** Presence improves decision quality, not production rate. There is nothing to collect by tapping.
- **No hard loss.** Unrest, exodus, debt and raids degrade the town and are recoverable. A ruined town can be refounded once the legacy system exists.

**Lifespans at this pace.** A resident comes of age at 16 game years, which is 7 d 11 h of real time. A 65-year life is 30 d 8 h of real time. One real year of daily play spans many generations, so families, not individuals, are the long-term unit of attachment. Both figures are tuning values.

## Game systems

Eight systems, each defined entirely by content data interpreted by one rules engine.

### Lots and buildings

- The town is a list of lots, not a map. A new town holds 6 lots. Town tier raises the count: Hamlet 6, Village 10, Town 16, City 24.
- Most lots accept any building. Special lots (riverside, hillside, crossroads) accept a restricted set and grant a bonus, which makes them contested.
- A building has a category, tiers 1 to 5, worker slots, recipes (inputs, outputs, ticks, governing skill), upkeep and unlocks.
- Tier 3 is a branch point. Example: Smithy becomes Armory (weapons and armor for the guild) or Artificer (tools and trade goods). The branch is permanent for that building.
- Demolition refunds 50 % of invested materials and frees the lot.
- Categories: Housing, Food, Materials, Craft, Trade, Guild, Faith, Learning, Defense, Civic.

### Economy

- Three resource layers. Raw: food, wood, stone, ore, herbs, and forest materials (heartwood, glowcap, spirit amber). Goods: tools, weapons, potions, cloth, ale. Abstract: gold, renown, faith, lore.
- Stock is capped by storage. Overflow is lost, which gives trade and quests a reason to exist as sinks.
- Production chains are at most 2 steps deep in v0.1 and at most 3 in v1.0.
- Gold sources: taxes, market sales, quest loot, caravans. Gold sinks: wages, upkeep, bounties, construction.
- All quantities are integers. Fractional rates accumulate in fixed-point remainders so that offline catch-up and live play cannot diverge.

### Population, professions and skills

- **Every resident is an individual.** Each has a name, a people, an age, a profession and rank, skills, 2 to 3 traits, family ties and a history. Resident caps by town tier: Hamlet 25, Village 60, Town 100, City 150.
- **Generations.** Residents marry, have children, come of age at 16, slow down near 55 and die near 65. A child inherits one trait from each parent and learns a parent's trade faster. Households hold homes and pass them to heirs.
- **Growth** comes from births and from migration. Migrants arrive once per game day when housing capacity, food surplus and appeal all allow it.
- **Professions** are grouped into 8 families: Farming, Extraction, Smithing, Alchemy and Enchanting, Trade, Scholarship, Faith, Arms. Each profession has three ranks: Apprentice, Journeyman, Master.
- **Skills.** 12 skills on a 0 to 100 scale. Work trains the governing skill. Skill thresholds gate advanced recipes and decide event and quest checks.
- **Job assignment is automatic with override.** Residents fill building quotas according to skill, trait and family trade. Any one resident can be pinned to a job by hand; the pin holds until released.
- **Appointments.** Posts (Steward, Guildmaster, Quartermaster, Captain of the Watch) are filled by the player. An appointee's skills and traits modify the system the post governs.
- **Roster view.** The People tab is a filterable list (by profession, family, people, age, idle) with a detail page and biography per resident. At 150 residents the list, not the individual, is the working surface.

### Adventurers and quests

- Adventurers come from two sources. Outsiders are attracted by renown, tavern tier and open bounties. Residents with the right traits can take up arms, leaving a family and a trade behind. Each has a class, level, power tier 1 to 5, 3 gear slots, traits, condition (injury, morale) and loyalty.
- The Gloamwood is three depth bands, each a list of scattered sites: dens, ruins, groves, old roads. Each has a threat level and a state: undiscovered, scouted, active, cleared or overrun.
- **The player writes the quest.** A quest is a site, an objective (scout, clear, hunt, gather, escort, delve), a bounty, optional provisions (potions, loaned gear) and a risk posture (cautious or bold).
- Two contract modes. **Posted**: freelancers accept when bounty outweighs perceived risk; cheap, unreliable. **Commissioned**: the player assigns a retained guild party; costs wages, gives control over who goes.
- Resolution runs off-screen in stages: travel, 2 to 4 encounters, return. At key moments the party sends word back for a decision (press on, retreat, pay a ransom, split the find). A message left unanswered past its deadline is resolved by the quest's risk posture. Each stage is a skill check on the seeded generator, modified by gear, provisions and posture. Duration is 1 to 10 game days.
- The report lists loot, injuries, deaths, discoveries and level gains, rendered as prose into the chronicle.
- Funding levers: bounty size, guild hall tier, training grounds, infirmary, gear from the town's own smiths and alchemists, pensions and memorials. Gear demand is the main coupling between the guild and the economy.
- Ignored sites escalate. An overrun site advances a threat clock; a filled clock triggers a raid on the town.

### Events

- An event is data: trigger conditions, a weight, 2 to 4 choices, outcomes, and a timeout choice. Outcomes may be fixed or checked against a town stat or a notable's skill.
- Categories: seasonal, visitor, crisis, opportunity, personal (about one notable), and chains that span several events.
- Starting cadence: 1 minor event per game day, 1 major event per season.
- Every choice carries tags (trade, guild, forge, arcane, faith, march). Tags accumulate as charter affinity.

### Town paths

- Six charters: **Market** (trade hub), **Guild** (delver's hold), **Forge** (craft town), **Arcane** (college), **Faith** (shrine seat), **March** (border fortress).
- Affinity comes from buildings present and choices made. At Village tier the player selects a primary charter from the top three affinities; at City tier a secondary.
- Each charter unlocks 3 buildings, 3 professions, 3 policies and its own event pool, and locks the capstone building of its opposing charter.
- Policies are standing laws with stated tradeoffs. Example: Open Gates raises migration and visitor events, and raises crime.

**Charter goals, then sandbox.** Each charter has one capstone goal, for example a great work built, the Heart reached, or a standing levy met for 10 years. Completing it is recorded in the chronicle and unlocks a town title. Play continues without limit afterwards.

### Trade and caravans

- A Trade Post dispatches caravans to 3 to 5 neighboring settlements, each with its own demand profile.
- Prices respond to what the town sells and to regional events. Rumors arrive as inbox items that hint at a coming shift.
- A caravan is a timed expedition with route risk. An adventurer escort reduces the risk and occupies the party.

### Chronicle

- Every significant state change emits a typed log entry. Grammar templates with trait and context slots render entries to prose.
- The chronicle is organized by game year. Each notable has a biography assembled from the entries that name them.
- Template packs are authored at build time. The shipped game makes no network calls.

### Legacy (after v1.0)

- A mature town can found a daughter town that inherits heirlooms, a few veteran notables and the parent's chronicle.

## Content targets

These counts are the scope cap. v0.1 is the first version worth playing for a week; v1.0 is the full design above.

| Content | v0.1 (end of M3) | v1.0 (end of M6) |
| --- | --- | --- |
| Buildings | 12 | 45 |
| Building tiers | 3 | 5 |
| Resources | 8 | 20 |
| Professions | 8 | 30 |
| Skills | 6 | 12 |
| Adventurer classes | 3 | 8 |
| Quest objectives | 3 | 6 |
| Region sites | 6 | 25 |
| Events | 30 | 200 |
| Chronicle templates | 40 | 300 |
| Charters | 0 | 6 |
| Policies | 0 | 18 |
| Trade partners | 0 | 5 |
| Forest bands | 1 (Eaves) | 3 |
| Peoples | 2 | 4 |
| Traits | 12 | 40 |
| Resident cap | 60 | 150 |

Content is cheap to add once the engine interprets it, so breadth is deferred and the engine's set of condition and effect types is settled first.

## Technical approach

### Platform options

| Option | Phone install | Fit for a menu-driven idle UI | Iteration with Claude Code | Main cost |
| --- | --- | --- | --- | --- |
| PWA: TypeScript, React, Vite | Add to Home Screen; no store | Strong: lists, panels and forms are native to the DOM | Strong: simulation tests run headless; UI previews in a browser | No background execution; browser storage can be evicted |
| Godot 4 | Sideloaded APK or TestFlight | Weaker: dense management screens are slow to build in Control nodes | Weaker: scene files and an editor in the loop | Export pipeline per platform |
| React Native with Expo | Native build | Strong | Medium: device toolchain required | Toolchain overhead; store accounts for distribution |
| Capacitor wrapper around the PWA | Native shell, later | Same as PWA | Same as PWA | Deferred until a store build is wanted |

**Recommendation: PWA.** The game is text, lists and numbers with no map and no real-time rendering, which is the case the web platform handles best. The no-background-execution limit is absorbed by the offline catch-up model, and the eviction risk by save export. The caravan brief recommended Godot 4 because of its painted map and card combat; Silvanus has neither. Keeping the simulation core free of any UI framework leaves the Capacitor and Godot paths open.

### Architecture

- **`packages/sim`** is pure TypeScript with no DOM access. Its contract is `step(state, commands) -> { state, log }`. It owns the seeded generator, so the same seed and the same commands always produce the same town.
- **`packages/content`** holds every building, profession, event, site and template as typed data, validated by schema at build time. Adding content does not touch the engine.
- **`apps/web`** is the React interface: five bottom tabs (Town, People, Guild, Inbox, Chronicle), a state store that holds the latest simulation state, and a Web Worker that runs ticks so catch-up never blocks the screen.
- **Persistence** is IndexedDB with a versioned save schema and explicit migrations. Autosave runs every 10 ticks and when the page is hidden. Save export and import as a JSON file is in M0, because it is also the debugging tool.
- **Verification** is a headless soak script: a random-policy bot plays 10,000 ticks, asserts invariants (no negative stock, no NaN, population at or above 0, every pending event resolvable) and prints a balance report. This script is the feedback loop that lets Claude Code tune the economy without a phone in hand.
- Device clock tampering is not defended. The game is single-player.

### Content as data

A building and an event, as they would be authored:

```ts
export const smithy: BuildingDef = {
  id: "smithy",
  category: "craft",
  lot: "any",
  tiers: [
    { cost: { gold: 120, wood: 40, stone: 20 }, slots: 2,
      recipes: [{ in: { ore: 2, wood: 1 }, out: { tools: 1 },
                  ticks: 6, skill: "smithing" }] },
    { cost: { gold: 400, stone: 80, tools: 10 }, slots: 4,
      recipes: [{ in: { ore: 3, wood: 1 }, out: { weapons: 1 },
                  ticks: 8, skill: "smithing", minSkill: 30 }] },
  ],
  branchAt: 3,
  branches: ["armory", "artificer"],
};

export const wanderingHealer: EventDef = {
  id: "wandering-healer",
  category: "visitor",
  weight: 10,
  when: { minTownTier: 1, season: ["autumn", "winter"],
          lacksBuilding: "infirmary" },
  choices: [
    { id: "hire", cost: { gold: 60 },
      effects: [{ type: "healAll", who: "adventurers" }],
      tags: ["guild"] },
    { id: "settle", check: { stat: "appeal", dc: 40 },
      pass: [{ type: "addNotable", profession: "healer" }],
      fail: [{ type: "log", template: "healer-moves-on" }],
      tags: ["faith"] },
    { id: "decline", effects: [] },
  ],
  timeoutChoice: "decline",
};
```

The smithy declares two tiers, each with a cost, a worker-slot count and one recipe; the second recipe requires a smithing skill of 30. At tier 3 it must become an Armory or an Artificer. The healer event fires only in autumn or winter for a town without an infirmary. It offers a paid heal, a checked attempt to settle the healer as a notable, or a refusal. The refusal is the timeout choice the Steward applies offline, and the tags on the first two choices add Guild and Faith affinity.

The engine interprets a closed set of condition types (`when`) and effect types (`effects`). That set is the real interface of the project: it is defined in M1 to M3 and changed deliberately afterwards.

## Milestones

Every milestone ends with a build installed on the phone. No dates are set; the order and the exit criteria are the commitment.

| Milestone | Scope | Exit criterion |
| --- | --- | --- |
| **M0 Skeleton** | Repository, tick loop, seeded generator, save and load, export and import, PWA shell, soak script | The app is installed on the phone; a resource counter survives close and reopen with the correct offline catch-up |
| **M1 Town** | Lots, 12 buildings at 3 tiers, 8 resources, individual residents with skills and traits, automatic job assignment with override, migration, 8 professions | 20 minutes of play contain real tradeoffs; 10,000-tick soak passes all invariants |
| **M2 Guild** | Adventurers from outsiders and residents, 6 Eaves sites, quest authoring, mid-quest decisions, posted and commissioned contracts, staged resolution, reports | A quest written by the player resolves while the app is closed and returns a readable report |
| **M3 Events and chronicle** | Event engine, 30 events, inbox, Steward timeouts, chronicle with 40 templates | One game year produces a chronicle worth reading. **This is v0.1.** |
| **M4 Paths and policies** | Families, aging and inheritance, town tiers, the Deepwood band, 6 charters, 18 policies, tier-3 building branches, configurable Steward | Two towns with different charters differ in available buildings, professions and events |
| **M5 Trade** | Trade Post, 5 partners, Crown levies and favor, reactive prices, rumors, escorted caravans | Trade is a viable primary income under the Market charter |
| **M6 Depth and polish** | Content raised to v1.0 counts, the Heart band, charter capstone goals, family trees, balance pass, art and sound pass, legacy | **v1.0** |

M0 to M3 is the vertical slice. If interest fades after M3, the result is still a complete small game.

## Risks, assumptions and open decisions

### Risks

| Risk | Mechanism | Control |
| --- | --- | --- |
| Scope drift | Four parent projects each bring a full feature list | The content-targets table is the cap; new ideas go to `docs/parking.md`; v0.1 ends at M3 |
| Idle economy diverges | Compounding rates either explode or stall over long offline spans | Soak script and balance report from M0; storage caps; integer arithmetic |
| Menu fatigue on a small screen | Management depth turns into tap count | Inbox-first sessions; quotas instead of per-person assignment; frequent actions within 3 taps |
| Flat narrative without an LLM | Templates repeat and stop reading as story | Trait and context slots, event chains, biographies; judged explicitly at the M3 exit |
| Save loss | Browser storage eviction or a failed migration | Save export from M0; versioned migrations with a test per version |
| Individual residents overload the player | 150 people with families and jobs exceed what a phone screen can manage by hand | Automatic assignment by default; roster filters; the inbox surfaces only residents who need a decision; families deferred to M4 |

### Decisions from the workshop

| Topic | Decision |
| --- | --- |
| Phone | Android |
| Pacing | 1 game hour per 60 s; game year = 11 h 12 min real |
| Population | Every resident is an individual; cap 150 |
| Aging | Full generations: marriage, children, aging, death, inheritance |
| Control | Automatic job assignment with manual override |
| Focus | Even balance across town, guild and characters |
| Adventurers | Outsiders and residents |
| Quests | Mid-quest decisions; risk posture answers when the player does not |
| Stakes | Recoverable decline; the town cannot be lost |
| Long game | Charter capstone goals, then sandbox |
| Presentation | Text and icons for v0.1 |
| Setting | Fresh world; frontier town beside a deep, dangerous, resource-rich forest |
| Forest | Three depth bands with scattered, scouted sites in each |
| Backer | Crown writ with levies and favor |
| Peoples | Mixed town |
| Magic | A normal craft built on forest materials |

### Assumptions

These remain assumed after the workshop and can be reversed.

- Silvanus is the project name: the Roman god of woods and wild land, beside Vulcan and Pantheon.
- Single-player, personal use, no monetization, prototype-to-hobby scope.
- No runtime LLM, carried over from the Vulcan constraint on API cost.
- A new repository, not a directory inside the Vulcan repo.
- The four peoples are humans, dwarves, elves and halflings, and all share one lifespan.
- The Gloamwood, its band names and the writ are placeholder names.
- The "adventure manager" is read as a guild-management concept: roster, quests, funding, reports.

### Open decisions

- [ ] Names for the town, the forest, the Crown and the peoples' cultures.
- [ ] Lifespans: one shared figure as assumed, or a different span per people.
- [ ] Family life: observed only, or steered by the player (matchmaking, naming heirs).
- [ ] The capstone goal for each of the six charters.
- [ ] Whether a resident with a strong trait can refuse a pinned job.
- [ ] Whether forest peoples or spirits exist as a faction to negotiate with.

## Kickoff

Repository rules live in `AGENTS.md` and the synced `.claude/master/RULES.md`. Current state and the next step live in `docs/HANDOFF.md`. Settled choices live in `docs/DECISIONS.md`.

M0 builds an npm workspace with `packages/sim`, `packages/content` and `apps/web`, plus `scripts/soak.ts`. One session takes one milestone and stops at its exit criterion from the table above.
