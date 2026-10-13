# Carpet Joint — Roadmap

Each milestone ends with the Definition of Done in `CLAUDE.md`. **Nothing from Milestone 3
onward starts until Milestone 2's gate is marked passed below.** The owner reviews this order
before any code (and must be asked before it changes).

## Milestone 0 — Wipe and foundation

- **The wipe** (one commit, so history keeps it): delete the marble board's sim, physics, Dry
  Run, data, renderer, debug screen, art, scripts and their tests. Keep the engine tooling
  (DECISIONS #8): `src/engine/`, the font, the IMGUI kit, the overlap audit, the atlas and sheet
  loader, the e2e harness, the deploy workflow, the `.bat` files, Electron, the art pipeline's
  `common.py`, `pack()` and palette lock.
- The **640×360** whole-number scaler.
- `src/sim/`: seeded RNG streams, the command log, `Game.ts` with the system order from
  `CLAUDE.md`, the state hash and replay test.
- `src/sim/odds/`: the exact odds calculator for dice, wheels and ball drums (rational
  arithmetic), edge, volatility and hit rate; tests against the hand-checked starter table in
  `DESIGN.md` §2, plus a seeded simulation that agrees within its ±.
- A floor tile grid with the flow-field pathing, one table, one gambler agent who walks in, sits,
  bets from the paytable, wins and loses, and leaves; the cage paying out; the Sweat (§6) computed
  by simulation and checked against the closed form.
- A debug screen: the floor, the table with its paytable and edge readout, the cage with the
  Sweat, a speed control and pause.
- The four agents in `.claude/agents/` rewritten for Carpet Joint.
- The art director confirms `pixel-art-studio` still works and draws three test sprites (a
  tourist, the dice table, one neon letter with its glow) and proposes the neon palette.
- README and the live page say what the game is now.

Exit: a gambler plays a full session deterministically; the odds calculator matches the
starter table exactly; the Sweat is within §11.7's bounds; `npm test` green; deploys.

## Milestone 1 — The slice (nights 1–4 against one rival)

- The day and night loop at the real pace (§1), pause / 1× / 2×.
- **The game editor:** dice and wheel randomizers, the bet menu, the paytable, limits, exact
  odds always shown, the color rule.
- **The floor:** place, move and sell tables, the bar, the cage, the entrance; traffic matters.
- **Staff:** dealers, pit bosses, security, cashiers; hire, fire, assign live.
- **The crowd:** tourists, locals, conventioneers, one high roller a night from night 2, cheats
  (the dice slider and the past-poster), word of mouth and reputation.
- **The cage and the Sweat**, the armored car, busting.
- **One gaff** (shaved dice), heat, the inspector, a raid.
- **One rival** (the Undercutter) with its bot and the buyout. Buying it ends the slice as a win.
- **A Web fragment:** one background (the Bookmaker) and the 30 nodes around its start,
  including 3 Specials and 1 House Rule, with the real web UI (pan, zoom, search).
- Title, results, settings. Lesson cards at: the first paytable edit, the first whale, the first
  cheat, the first Sweat over 10%.
- Pace tests §11.1–§11.4 and §11.7 at slice scale. Placeholder sprites at the final names; the
  readability rules in `STYLE.md` apply anyway.

Exit: a new player wins or loses the slice in 20–25 minutes. Screenshots looked at.

## Milestone 2 — The gate

`indie-critic` reviews against `DESIGN.md` §12, the removal test and the not-list. The owner
plays it. Either the model changes or the gate is marked passed here with the date.

**Gate status: not yet passed.**

## Milestone 3 — The art pass (slice content)

Every slice sprite through `pixel-art-studio`: gamblers (each type, walk and sit), staff, the
three tables, the cage, the bar, carpet and sawdust floors, the neon marquee and its glow,
the dice and wheel close-ups in the editor, icons, the Undercutter's portrait. `e2e/coverage.mjs`
at 100%.

## Milestone 4 — The full season

All 10 nights, the Showman and the Outfit, the flagship boss, the strip map, rival moves, all
layer-0 gambler types and cheats, the ball drum, the wheel brake and weighted ball gaffs, the
high-limit room's layer-0 version, events (buses, sell-out shows, the power flicker), staff
traits and poaching. Pace tests §11.5–§11.6.

## Milestone 5 — The Web

All 300 nodes, the four backgrounds, all 12 House Rules, respec, a build summary screen,
search and filters. The balance auditor checks §11.5 on every background.

## Milestone 6 — The Marquee

Legend, 12 signs, wattage, the two active-ability slots, the marquee screen between runs, the
meta save in localStorage (versioned, never throwing).

## Milestone 7 — Sound and juice

Dice on felt, the wheel's tick slowing down, chips stacking, the cage drawer, the crowd's murmur
rising with buzz, a big win's cheer that carries across the floor, neon hum, lounge music
through the S&S music synth.

## Milestone 8 — Prestige layer 1: Go Carpet

Card shoes as a randomizer (simulated odds with ±), staff gear, the high-limit room, card
counters, the Charter, the new Web region and Marquee signs.

## Milestone 9 — Prestige layers 2 and 3: The Hotel and The Wire

Rooms and a second floor; the race and sports book with bets that settle later.

## Milestone 10 — Prestige layer 4: The Syndicate

Several houses at once, incremental-scale numbers and their display.

## Milestone 11 — Onboarding and UX

Tooltips with edge deltas on every change ("−3.1% edge, +0.4 σ"), key rebinding, controller.

## Milestone 12 — Balance and release

Bots across every layer, the balance auditor clean, perf on a weak laptop (crowds of 200 agents
at 2×), README, itch page, the Windows build.

## IDEAS.md

Everything else, one line each with why. Reviewed at each gate.
