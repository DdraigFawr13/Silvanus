# UI style

<!-- Template from the `ui-style` skill. Fill each section from the taste board picks and the project's files; keep these prompt comments. Never write a value from memory (WS-06). -->

## Target devices
<!-- Devices and widths in px, and which width is first (mock-ups and checks start there). Write the minimums as `Minimum text: <n> px` and `Minimum tap: <n> px`; `ui-mockups` reads them for its lint. Take these from the project's docs; if none say, ask Morgan. -->

One device: Morgan's Android phone, in Chrome and as the installed PWA (D-001). Portrait only.

- First width: 412 px. Second width: 360 px, where nothing may break or scroll sideways. Morgan confirmed 412 px on 2026-11-10, when he approved `mockups/town.html`.
- Minimum text: 12 px (the smallest text in the accepted sample, its stock labels).
- Minimum tap: 44 px (`docs/specs/m0-skeleton.md`, "each at least 44 px"; the accepted sample's controls).

## Idea
<!-- The look in two sentences, from the taste board picks. -->

Lantern at the forest edge (D-028): night in the Skarthorn, dark green panels lit by one lamp. Lamp-amber marks what the player can act on, moss marks what is fine, and ember marks what is short or going wrong.

## Tokens
<!-- Colours and spacing as named tokens, for light and dark. Screens use the names, never literal values. -->

One theme only (D-028); there is no light set. Values are copied from look B in the taste board's source.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#162120` | the page |
| `--panel` | `#1f2e2c` | cards, stock cells, stepper ground |
| `--line` | `#2f4541` | panel borders and rules |
| `--line-strong` | `#3d5853` | control borders |
| `--ink` | `#e6e3d6` | body text and numbers |
| `--head` | `#f0d9a4` | the town's name, building names, headings |
| `--muted` | `#9fb0a4` | labels, secondary lines, the log |
| `--act` | `#d9a441` | lamp-amber: buttons and anything that takes a tap to change the town |
| `--act-ink` | `#1a1608` | text on `--act` |
| `--fine` | `#8fbf8a` | moss: tier labels, "working", full morale |
| `--warn` | `#ef8a62` | ember: short stock, a dropped method, low morale |
| `--r-page` | `14px` | the outer frame of a sheet or screen block |
| `--r` | `10px` | panels, cells, buttons, steppers |
| `--gap` | `8px` | between cells; panels sit 10px apart; panel padding is 10px 12px |

`--act` is never used for decoration and `--warn` never for a button.

## Type
<!-- Faces, sizes and number settings (tabular figures, units). Copy settings from the accepted specimen, not from memory (adventure-manager LESSONS:10). -->

- Display: Alegreya SC, weight 700, fallback Georgia, serif. Body and numbers: Alegreya Sans, weights 400, 500 and 700, fallback system-ui, sans-serif. Both are SIL Open Font License 1.1. The game makes no network calls (D-003), so the font files ship inside the app; the M1 spec names the packages.
- Sizes, from the sample: town name 26 px, weight 700, letter-spacing 0.03em. Building or resident name 18 px, display face. Body 16 px, line height 1.35. Secondary lines and the log 14 px. Tier label 13 px, weight 600. Stock label 12 px. Stock number 17 px, weight 600. Button text 15 px, weight 700. Stepper glyphs 18 px, weight 600.
- Numbers use `font-variant-numeric: tabular-nums`. Stock shows as `142` over a label, or `142 / 200` where the cap matters. Time shows in game units ("3 game hours", "1 game day"), never in ticks.

## Controls
<!-- Buttons, sheets, inputs: how each looks and how it answers a tap (done, waiting, or refused and why). -->

- Button: 44 px tall, `--act` ground, `--act-ink` text, radius `--r`, padding 0 16px. A second-rank button has a `--line-strong` border, no fill and `--ink` text. A disabled button keeps its place, drops to `--muted` text on `--panel`, and the line under it says why ("Needs 20 wood").
- Stepper: three 44 px cells (−, the number, +) in one `--line-strong` border, `--panel` ground. A cell at its limit shows `--muted` and does not answer.
- Every tap answers on the same screen (the master Avoid list): the value changes at once, or a line appears saying it is queued or why it was refused. A tap that costs something that cannot be undone (clearing a lot) asks first in a sheet; the browser's own confirm dialogs are not used.
- Sheet: slides over the tab from the bottom, `--panel` ground, radius `--r-page` on the top corners. Its title and close button stay pinned while its body scrolls (master Pitfalls).

## Layout and sizes
<!-- Columns, gutters and spacing at each target width; what moves or hides at each width. -->

- One column. Side gutter 14 px. Middle density (D-028): the stock bar stays pinned under the town's name and the list below it scrolls.
- The stock bar is a grid of equal cells, 4 across at both widths; a second row is added when there are more than 4 resources. Nothing hides at 360 px; cells get narrower.
- The tab bar is pinned to the bottom, 56 px tall, each tab at least 44 px wide, clear of the phone's bottom inset. Only tabs that work are shown.
- Live lists are filled in place, never rebuilt on a tick (master Pitfalls).

## Avoid
<!-- The master Avoid list is linked below. Add this project's own items under Project, each tagged (lint) or (look) and ending with its source in brackets. -->
Master list: `../.claude/skills/ui-style/references/avoid.md` (the path from `docs/`; from another folder, make it relative to that folder).
### Project

- (look) A light theme, or a second accent colour beyond `--act`, `--fine` and `--warn` [D-028]
- (look) Ticks shown to the player as a unit of time [docs/CHARTER.md "Time"]
- (look) A map, a grid of lots or anything that looks like placement [docs/CHARTER.md "Pillars"]
- (look) A "Collect" control, or any reward for tapping [D-025]

## Pitfalls
<!-- The master Pitfalls are linked below. A LESSONS `ui` entry at count 2 becomes a Project pitfall here, ending with its source in brackets (SRC-05). -->
Master list: `../.claude/skills/ui-style/references/avoid.md`.
### Project

## Where facts live
<!-- The files that hold the names, numbers and options screens show (content files, schemas, rules), plus docs/DECISIONS.md. Mock-ups take facts only from these. -->

- `packages/content/src/index.ts`: every building, resource, method, cost and cap the screens show.
- `packages/sim/src/types.ts`: the fields a resident, a building and the town have.
- `packages/sim/src/calendar.ts`: how a date reads ("Year 1, season 1, day 1, hour 0").
- `docs/specs/m1-town.md`, "Content": M1's numbers until the content file holds them.
- `docs/DECISIONS.md`.

## New-screen checklist
<!-- Run before calling a screen done. Add project items at the end. -->
1. Colours and faces come from Tokens and Type; no literal values.
2. Fits the first target width without sideways scroll; text and taps meet the minimums.
3. Every view state screenshotted (normal, empty, alert, loading).
4. New class names grepped against the CSS.
5. Every tap answers on the same screen (done, waiting, or refused and why).
6. Buttons, alerts and empty states worded on purpose; no Avoid-list copy.
7. The built screen screenshotted at the same width beside its approved mock-up; differences listed for Morgan.
8. Checked at 360 px as well as 412 px.
9. No tick counts on screen; no network request in the browser's log.
