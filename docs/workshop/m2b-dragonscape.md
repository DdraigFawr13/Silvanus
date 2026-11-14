# M2b workshop: DragonScape Idle reference

Morgan's inspiration for the M2b Art workshop (2026-11-13): DragonScape Idle, a browser idle RPG at dragonscapeidle.com, "games with something to always do". Morgan sent 15 phone screenshots in chat; they are third-party images and stay out of this public repo. This file is Claude's reading of them, in Claude's words. Nothing here is a decision; picks go to DECISIONS after the workshop rounds.

## What the screenshots show

- A pinned current-action bar on every tab: skill icon, "MINING: MITHRIL ORE", a percentage, a teal progress bar, a Stop button, and short pop-ups on the bar ("+1 Mithril Ore", "Action Failed").
- A top bar with gold, gems and total level, plus a book and a mail icon.
- Bottom tabs: Skills, Combat, Quests, Shop, More. More opens a sheet: Inv, Events, News, Discord, Top, Global, Wiki, Settings.
- Bank: item cards 3 across, a painted icon each, a count badge in the corner, grouped under collapsible headings (Logs, Ores, Bars, Raw Fish, Runes, Seeds, Crops, Materials), with a bank value, search, category chips and an Auto-sell tab.
- Skills: a grid of 16 skills with levels, "+3 skills to discover, unlocked by quests", and a skill page with XP to next level, XP/hour and items/hour.
- Recipes: each shows level, XP, time, an effect with "10 charges", and input chips as have/need ("Feather 3,126/5").
- Quests: a painted landscape map with quest nodes on a path (done, in progress 5/18, locked, side quests with rewards), and chain cards ("Farmer's Life, quest 8 of 21: Collect 3 Lettuces", a Start button, a hand-in step, a reward for finishing the chain). Tabs for Dailies, Masked Festival, Apprentice.
- Shop: "Recommended for you", "Top pick", gem prices, and a visiting Apothecary's Stall that "Leaves in 1d 10h".
- Combat: monsters by area with XP/h and food/h, "Strong", "Best XP" and "use (weapon)" tags, Fight buttons, and auto-eat.

## The look

Dark slate-blue panels with thin lighter borders, gold-filled main buttons, teal progress bars, green chips for good states, a serif small-caps face for big headings and a bold sans for labels. Item art is painted, soft-shaded and glossy. The quest map is one large painted landscape.

Close to D-028's lantern look already: dark panels and a warm gold that marks what you can act on.

## Ideas it suggests for Silvanus

Proposals only, sent to Morgan on the round 1 page (`art1`). Each must respect D-025 (no reward for tapping) and the charter's pillar that residents are records.

## Round 1 answers (`art1`, 2026-11-14)

Page: https://claude.ai/artifact/J6PPDhkAqtFpwFMtePv1Xz (answered the second time; the first answers stayed on the phone).

- Pull of DragonScape: "just having something to do and advancing my character in that game". Most time on "the skills or the quests or the battles". Must not have: "painfully slow progress and not enough engaging gameplay".
- Wants Silvanus versions of: the pinned "now" bar with +1 pop-ups, quest chains with small goals, the painted map with the quest path, dailies and festivals, "to discover" teasers, per-hour rates. (Input for M2e and later planning; D-040 already settles goals, trader swaps and forage trips.)
- Icon styles A painted, B flat, C pixel: all Cut. Note: "i hate all of what you made here ... I need to see higher quality mockups to choose."
- Town view and colours: "Show me samples in round 2". Item display: compact stock bar with a small icon per cell. Board cards: "A bigger picture on every card, like DragonScape's quest art".
- Art made by: VectorCraft, PhotoCraft, free CC0 packs like Kenney. Not OpenArt. Note: "i like the kenney look but modified to more fit my needs and desires".

## Round 2 (`art2`)

Page: https://claude.ai/artifact/LJsptFDjmGwyuDZNs1Qb2s. Shows Ashwick built from Kenney tiles in daylight, golden dusk and lantern night (graded in PhotoCraft), two full Town tab mock-ups (lantern colours with the night town; slate colours with the dusk town), five resource icons and three board card pictures. Numbers on the mock-ups are examples.

## Art sources (SAFE-05)

Working files are outside the repo, in `C:\Users\Morgan\CraftWork\silvanus-art` (scene and icon scripts, PhotoCraft exports). Nothing is in the game yet.

- Kenney "Tiny Town" 1.1, CC0 1.0, https://kenney.nl/assets/tiny-town (licence file read 2026-11-14).
- Kenney "Tiny Dungeon", CC0 1.0, https://kenney.nl/assets/tiny-dungeon (villager sprites, anvil, barrel, chest).
- Downloaded and not used: Kenney "Medieval RTS", "Roguelike RPG Pack", "Generic Items", all CC0.
- Food, stone and ore icons: drawn by Claude for this project in Tiny Town's palette and outline; no third-party source.

## Round 2 answers (`art2`, 2026-11-14)

- Town light: "1 · Daylight", note: "but it needs to be modified a bit like idk it is too bright and i want this to be more of like a new art style as well".
- Town picture needs: a more dangerous forest, more detail (fences, crops, smoke, signs), lots easier to tell apart, less crowded.
- Mock-up A (lantern colours) Keep; B (slate) Cut, so D-028 stands. Order: picture, then board, then buildings. The "now" bar: pinned on every tab, like DragonScape. Icon set: Keep. Card pictures: keep as shown. Section note: "still need more work on the art though".

## Round 3 (`art3`)

Page: https://claude.ai/artifact/7MypCWa46iLafokEYXxPaq. Kenney's 33 colours repainted into three Silvanus palettes (Moss, Autumn edge, Faded ink; Moss recommended), shown on a rebuilt town: lots spread out with dirt yards, a darker and colder Skarthorn with eyes and a warning post, smoke on working chimneys, crop rows, a mine entrance from Tiny Dungeon tiles. Each palette also repaints the card pictures and icons. Script: `scene2.py` in the art folder.

## Round 3 answers (`art3`, 2026-11-14)

- Palettes: Moss Keep, Faded ink Keep, Autumn edge After. Pick: "Mix", note: "mix of moss and faded ink but mostly moss. also I want the game to be like scrollable to the left and right to see the whole town and like the center would be the main building and then just buildings out left and right from there".
- Layout: "Good, with the changes in my note"; needs work: the Hall should stand out more, still too crowded, note "zoom out a little bit more maybe?".
- Look ready to write down: "Yes, with my palette pick".

## Final mock-up

`mockups/town-art.html` (published: https://claude.ai/artifact/JpUgrhhvgo9Wi7bQfUFW9B). Ashwick palette 70% Moss and 30% Faded ink (`docs/workshop/ashwick-palette.json`); a 35-tile-wide town at 1.5 times tile size that opens centred on a two-storey Hall with banners and a cobbled square, lots to both sides along one road; four states at 412 and 360 px; check record on the page. Scripts: `scene3.py`, `mock_final.py` in the art folder. D-041 is Proposed until Morgan approves it.

## After the mock-up (2026-11-14)

Morgan: "actually i want the symbol buttons on the bottom. makes them easier to touch. also i need to be able to click lots on the map. I want that to be the main way to like be able to interact with things", then "use the design tool for another round of this please" (the Claude Design canvas). Canvas: https://claude.ai/artifact/MS4YKVneBzq2RyfBSBPN9J. Tab icons (a house, a villager) are in the Ashwick palette; the house is drawn for this project, the villager is a Tiny Dungeon tile.

## Canvas round 2 (2026-11-14)

Morgan, on the canvas: "make that whole area the town and also have buildings going like down toward the bottom and have a little square in front of the town hall where like events could be held or it shows like seasons and festivals and whatnot but have the buildings maybe closer together a little and more organic. also do something where the road enters the forest and make the town have like generic but slightly gritty roads. I actually want this design changed to be a little more graveyard keeper in style but like haunted woods type thing but subtle", then "buildings need to have more character to them. more detail and vibe". Earlier: "the lots need to have a better glow".

Built (`scene4.py` in the art folder): the town fills the Town screen (28 × 32 tiles, pans both ways, opens on the Hall and its square); hand-drawn dirt roads with ruts and pebbles; a flagstone square with the well, lanterns, festival pennants and the notice board, which opens the board (D-040); a lantern-lit gate where the north road enters the Skarthorn; mist at the treeline, dead trees, crows and a small old graveyard; a duskier "Hollow" grade over the Ashwick palette; ivy, mossy eaves, door lanterns, window boxes, hanging trade signs and clutter on each building; staked future lots down the south road that open at the Village; lots glow and breathe, brighter when tapped. Style reference is the mood Morgan named (earthy, moody, a little macabre); no art from that game is used.

## Canvas round 3 (2026-11-14)

Morgan: no blend between the square and the roads; set the Hall back "so the town square is a little bit farther with like an ornate walkway to the hall. but not really ornate just slightly decorated"; "more feel"; "the buildings did not seem to change enough"; centre the Hall and the square ("they are not aligned"). Built (`scene5.py`): a 29-tile-wide map symmetric about the centre line (Hall door, walkway, square, south road); a slab walkway with kerbs, planters and lanterns; a worn dirt ring where the flagstones break up and the roads run in; soft shadows under buildings and trees; warm light pools at lanterns, the Hall's windows and the forge; weathered roofs; and an extra per building (a woodshed, a workbench lean-to, mine rails with a cart, a scarecrow and hay bales, a cottage garden and washing line, a herb rack).

## Canvas round 4 (2026-11-14)

Morgan: "I don't want the lots to constantly glow like that. I want the empty lots to have a pale glow. And add more richness around the buildings that are built". Built lots now have no glow until tapped; empty lots breathe a pale, moonlight glow; yards gained doorsteps and worn paths, stumps and chips, barrels and a tool rack, walkway benches and flowers, chickens, pumpkins, a water trough, berry bushes, rock piles and a timber stack.
