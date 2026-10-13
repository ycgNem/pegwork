# Progress — Carpet Joint (repo: pegwork)

What is built. Newest first.

## 2026-10-12 — Milestone 1, stage B: staff and cheats

**Staff** (`src/data/staff.ts`, `src/sim/staff.ts`, `systems/staff.ts`): dealers, pit bosses,
security and a cashier with skill 1–3 and a wage (DESIGN §3). A dealer sets the table's pace (×0.8
/ ×1 / ×1.25) and a table needs one to open; pit bosses watch up to 3 tables; security walks the
flow field to a spotted cheat and walks them out; the doors need a cashier. Wages at dawn. The
day's hiring hall (6 seeded candidates); `hire`, `fire`, `assign` commands. Starting staff: 2
dealers, a pit boss watching both tables, a cashier.

**Cheats** (`src/data/cheats.ts`, `systems/tables.ts`, `systems/cheats.ts`): the dice slider and
the past-poster (DESIGN §8, DECISIONS #44), arriving 0.5 a night +0.25 a night, dressed as a local
or a tourist with one tell. Pit bosses spot cheating rounds (2% per skill level); a spotted cheat
is walked out and their winnings come back; `accuse` for the owner (−2 word of mouth if wrong).

**UI**: the right panel has Table / Staff tabs. Staff: each member's role, skill, name and job,
one button a row (deal the selected table, watch it, fire by day) and tooltips with the wage and
what the role does; by day the hiring hall with wages. Click a gambler for their card (type,
up/down, bet and stake, SPOTTED CHEATING, Accuse / Walk them out). Staff draw on the floor
(dealers at their tables, the pit boss between the tables they watch, the cashier at the cage,
security walking). Spotted '!' and the selection chevron (#45). Ticker lines for spots, walk-outs
and wrong accusations. Win floaters no longer overlap when they stack.

**Tests** (51): dealer pace, no dealer no table, wages and the cashier rule, the hiring hall, a
slider beats the dice, a pit boss spots a past-poster and security recovers the money, no
security means they keep playing, a wrong accusation, a whole night with cheats replays bit for
bit; the slice pace test with wages (DESIGN §11.1). **Screens** (15, 0 overlap issues): adds
day-1-staff, cheat-spotted, staff-night, ejected.

## 2026-10-12 — Milestone 1, stage A: the season

Days and nights over a 4-night slice (DECISIONS #39); the strip's crowd split by reputation and
posted edge (#40); word of mouth rebalanced with fast wipe-outs and 80% stop-losses (#41); the
Undercutter's nights and moves and the buyout (#42); the day panel and the result screen; season
bots (greedy, the 8% tuner) and the slice pace test (DESIGN §11.1).

## 2026-10-12 — Milestone 0: wipe and foundation

**The wipe** (its own commit, d18e8f7): the marble board's physics, Dry Run, data, renderer, debug
screen, art, scripts and tests are gone; the engine tooling stayed (DECISIONS #29).

**The screen**: 640x360 logical, whole-number scaling (x3 = 1080p), letterboxed. Input actions:
Space pause, 1 / 2 speed, Esc menu, M mute. Settings key `carpetjoint:settings`. Every Pegwork
name in the app, the .bat files, Electron (1920x1080 window) and package.json is now Carpet Joint.

**Data** (`src/data/`, every number with a derivation): `time.ts` (27 s game hours, 8pm-6am),
`games.ts` (randomizers, bet types in tenths, the starter Hi-Lo Dice, Red Wheel and Lucky Drum),
`tables.ts` (dice, wheel, drum: seats, pace, footprint, seat tiles, limits), `gamblers.ts` (four
types, the choice formula, tonight's crowd), `economy.ts` (bank, cage, armored car, the Sweat's
and the edge's color rules), `floor.ts` (the 16x11 sawdust joint).

**The odds** (`src/sim/odds/`): exact BigInt rationals; dice and wheels enumerated with whole-number
weights (gaffs are weights), the drum by hypergeometric odds; edge, volatility, hit rate, top
payout; apparent (fair) vs true odds for gaffed games. One `sample` + `ret` path shared by the
tables, the Sweat and the editor.

**The sim** (`src/sim/`): `Game.ts` with the 14 systems in CLAUDE.md's order (cheats, staff, heat,
rivals, events and progression are empty until M1), per-table RNG streams, the command log, a
state hash, `replay`, `applyNow` for orders while paused (#34). Gamblers arrive, score every open
table's best bet by the choice formula, pick by seeded softmax, walk the flow field to their seat,
bet every round, leave at stop-loss, win goal or patience, and walk out; word of mouth on the way.
Bets settle against the cage in seat order; a win the cage can't pay busts the house (#30). The
armored car moves money in an hour. At 6am the night ends.

**The Sweat** (`src/sim/sweat.ts`): 500 replays of the rest of tonight with the live bet path,
tabulated per outcome (#32), ± its error, the biggest win on the floor; the closed form with
Siegmund's correction as a test. 19 ms worst in Chrome with 12 seated (budget 50).

**The debug floor** (`src/app/floorScreen.ts`, `src/render/floor.ts`): the street, the walls, the
floor, y-sorted tables, fixtures and gamblers (interpolated), live dice faces, a spinning wheel with
the ball on the winning pocket, the neon sign, win floaters (small wins summed per table), the
ticker. Right panel: the selected table's bets with pays -/+ and exact edge (color rule), hit
rate and a tooltip with the exact fraction and the swing; limits; open/close; send in a whale. The
cage panel: cage, bank, the Sweat with its bar, the biggest win on the floor, the armored car.
A table flashes red when one max bet on its top payout would beat the cage. The count room at 6am,
and a bust screen.

**Art** (pixel-art-studio, two critique passes each; DECISIONS #37, STYLE.md): the tourist (12x20,
4 directions x 4 walk frames + seated, in chibi and slim variants; chibi packed), the dice table
(48x32), neon letters C A R P E T J O I N with flicker frames. `art/build_all.py` packs
`src/art/people|tables|neon`; `art/preview_context.py` shows them on the floor at 1x and x4.
Everything else is a code-drawn placeholder at its final name (`src/render/placeholders.ts`).

**Measured** (DESIGN §4): a starter night +$3,004 ± $270 over 20 seeds, 14.2% hold, no busts, word
of mouth +4.4: the greedy starter games aren't punished yet; M1 rebalances (#36).

**Tests** (`npm test`, 38): odds (the starter table exactly, simulation within 4 SE, gaffs),
determinism (system order, a full night's hashes, replay bit-identical, money conserved, everyone
gone by 6am), sessions (5 seeds: arrive, sit, play, leave, cage moves by their loss; can't afford;
bust), the Sweat (perf, determinism, whale, fast path = exact path, 500 vs 5,000, closed form),
data (derivations, DESIGN's table matches the real edges, seats valid and reachable, sprites
exist). **e2e**: `npm run shots` (floor, editor tooltip, whale with the Sweat at 28%, count room),
`npm run screens` (9 states, 0 overlap issues), `npm run perf`.

**Agents** rewritten for Carpet Joint: indie-critic, art-director, qa-screens, balance-auditor.

## 2026-10-12 — Re-planned as Carpet Joint

- With the owner: the marble board is dropped; the game is now a casino tycoon roguelike on a
  neon 1970s strip (DECISIONS #19–#29). `PLAN.md`, `DESIGN.md`, `ROADMAP.md`, `CLAUDE.md`,
  `STYLE.md`, `HANDOFF.md`, `IDEAS.md` and `START-HERE.md` rewritten. **No code changed**:
  everything below this entry describes the marble-board build, which Milestone 0 of the new
  roadmap wipes.

## 2026-10-12 — Published

- GitHub repo https://github.com/ycgNem/pegwork (public); GitHub Pages deploys `main` on every
  push after the tests pass: https://ycgnem.github.io/pegwork/ (the M0 debug board).

## 2026-10-12 — Milestone 0: foundation and the physics

**The engine layer** (from Sprocket & Sprout, every S&S name and asset stripped; DECISIONS #8):
`src/engine/` loop (fixed 60 Hz), rng, input (Pegwork's actions: column left/right, drop, mute),
audio shell + jsfxr bank mechanism (empty bank) + the music synth and song notation (no songs);
`src/ui/` the bitmap font (plus a `±` glyph), a small IMGUI kit (`ui.ts`: panels wood/felt/dark/
brass/inset, text, buttons, bars, tooltips, clip) and the overlap audit; `src/render/` the sprite
atlas, the pixel helpers and a sheet loader for pixel-art-studio JSON; the deploy workflow
(`.github/workflows/deploy.yml`, inert until the repo exists), `Play.bat`, `Build desktop app.bat`,
`Package for web.bat`, Electron (`electron/main.cjs`), vite/vitest/tsconfig.

**The screen** (`src/app/screen.ts`): everything draws into a 384x216 buffer, copied each frame to
the display canvas at the largest whole-number scale that fits the window (device pixels),
letterboxed, smoothing off. Settings (volumes, mute) in localStorage, never throwing.

**The physics** (`src/sim/physics/`): circle-vs-circle and circle-vs-segment, 4 sub-steps a tick,
gravity 600, terminal 400, restitution and friction from `src/data/materials.ts`, positions
rounded to 1/256 px and velocities toward zero after every sub-step. One function, `stepMarble`,
moves every marble, live or in the Dry Run. Bodies are bucketed by 8 px cell. Marbles don't touch
each other (DECISIONS #10). The rail tap and jam cap are a counted safety net (DESIGN §1).

**The sim** (`src/sim/`): commands (`drop`, `setStake`), events (`dropped`, `contact`, `landed`,
`jammed`, `rejected`), `Game.ts` with the nine systems in CLAUDE.md's order (duel, wear, rival and
skills are empty until M1), a state hash, `Game.replay` from a command log. Money in cents; stakes
$2–$20 capped at 10% of bankroll (`src/data/economy.ts`).

**The base board** (`src/data/boards.ts`): 20 x 28 cells, row 0 the hopper above the screen,
row 1 the rail (DECISIONS #9), five cups x0 x1 x3 x1 x0 of four cells, frame shoulders at row 3
(DECISIONS #11), 24 pegs on a staggered lattice tuned by `scripts/tune-base.ts` (EV per column in
DESIGN §2 and §8.1: best 0.94, worst 0.73 at 3,000 drops, no rail taps). `scripts/ev.ts`
prints every column's EV.

**The Dry Run** (`src/sim/dryrun.ts`): `dryRun(board, marble, column, n, seed)` returns the
histogram of payout per stake, the mean and its standard error, cup hit rates, contacts per body,
jams and taps. 300 drops: ~7 ms in Node, 2.4 ms median / 4 ms worst in Chrome (budget 50).

**The debug screen** (`src/app/debug.ts`): the board at the left (felt with chalk cell dots, wood
frame, brass rail with the drop column's ember arrow and a hover marker, pegs that flash when hit,
tin cups with their multipliers painted on in the font), click any column (or A/D + Space) to
drop a marble, drawn interpolated with the loop's alpha; on the felt beside it the Dry Run for the
hovered column: EV ± its error (green only when it clears 1.0 by two errors), the payout histogram (ink bars, ember mean), cup hit rates, EV by
column against the 1.0 line, bankroll, stake, the last three drops.

**Art** (`art/`, pixel-art-studio only): palette `pegwork` saved from `art/palette/pegwork.png`;
`art/common.py` (skill path, palette lock check, `E` names, ramps, `pack`); the Steel marble (6x6,
4-frame shine) and the Peg + bent Peg (8x8) with two critique passes each; `art/build_all.py`
packs `src/art/marbles.*` and `src/art/parts.*`. Cups are still code-drawn placeholders
(`src/render/placeholders.ts`, at the final names `cup:4`, `cup:2`). Material ramps in STYLE.md.

**Agents** (`.claude/agents/`): indie-critic, art-director, qa-screens rewritten for Pegwork;
balance-auditor added.

**Tests** (`npm test`): physics (1,000 seeded marbles through a dense field, half launched at
400 px/s, never leave except through the cups; no tunneling at 400 px/s from 64 offsets; energy
never rises across a bounce; head-on restitution; the 1/256 grid), determinism (system order,
same seed same hash every tick, replay from the log bit-identical, bankroll bookkeeping), Dry Run
(300 drops < 50 ms, same seed identical, live drops land exactly as the Dry Run says), data
(derivations name real DESIGN sections, the base board's validity and pocket rules, sprite names
exist), pace §8.1 (every column 0.70–0.95 and best 0.85–0.95 at 3,000 drops, no taps or jams).

**e2e** (`npm run shots | screens | perf`, dev server on 5183): the marble mid-fall, the Dry Run
histogram, the results; the overlap sweep (6 states); perf.

## 2026-10-13 — Planning

- PLAN, DESIGN, STYLE, CLAUDE, ROADMAP, START-HERE, HANDOFF, DECISIONS, IDEAS written. No code.

## Milestones (new roadmap)

| Milestone | Status |
|---|---|
| M0 — Wipe and foundation | done (2026-10-12) |
| M1 — The slice (nights 1–4, one rival) | not started |
| M2 — The gate | not started |
| M3 — The art pass | waiting for the gate |

The old marble-board roadmap: its M0 was done on 2026-10-12; the rest is dropped.
