# CLAUDE.md — Carpet Joint

You are building **Carpet Joint**, a pixel-art roguelike tycoon where you run a casino on a neon
1970s strip: you design the games and their odds, lay out the floor, run the staff and court the
crowd, then work the floor live while rival houses fight you for gamblers. (The repo is still
named `pegwork`; the marble-board game it used to hold was dropped on 2026-10-12, DECISIONS #19.)

Read `PLAN.md` (what and why), `DESIGN.md` (every number and its derivation), `STYLE.md` (the
look and the art pipeline), `ROADMAP.md` (what to build now) and `PROGRESS.md` (what exists) at
the start of every session, in that order. `DECISIONS.md` holds every decision with its reason;
add to it, never silently contradict it. `HANDOFF.md` says where the last session stopped.

## Stack (decided, don't relitigate)

TypeScript strict · Vite · one HTML5 Canvas 2D at **640×360** logical with whole-number scaling
and `imageSmoothingEnabled = false` · fixed 60 Hz pure, deterministic, command-driven simulation
(crowd agents on a 16 px tile grid plus randomizers; no physics engine) · immediate-mode canvas
UI with the bitmap font · Web Audio (S&S synth + jsfxr bank) · localStorage for settings and the
meta save · Vitest · Playwright + headless Chromium · GitHub Pages · Electron later.
**Art: the `pixel-art-studio` skill only** (see `STYLE.md`); not PixelLab, not SpriteCook.

The engine tooling already in this repo came from Sprocket & Sprout (`src/engine/`, the bitmap
font and IMGUI kit, the overlap audit, `render/atlas.ts` and the sheet loader, the e2e harness,
the deploy workflow, the `.bat` files, Electron; DECISIONS #8). Keep it; take nothing else from
S&S. Every other game folder in `Documents` (sprocket-and-sprout, candlepower, trotline,
slipstream-salvager, slipstream-salvager-3d, the-vig) is **read-only**: never write, commit or
run npm there. **The Vig** is also a casino game: share no names, mechanics or code with it.

## Architecture rules

- **`src/sim/` is pure and deterministic.** No DOM, canvas, audio, time or `Math.random`. One
  seeded RNG stream per table, one for the crowd, one for events, one per rival. Money in integer
  cents; agent positions in integer 1/16 px. Commands in (`placeFixture`, `moveFixture`,
  `sellFixture`, `editGame`, `setLimits`, `openTable`, `closeTable`, `setGaff`, `hire`, `fire`,
  `assignStaff`, `comp`, `answerWhale`, `accuse`, `eject`, `callArmoredCar`, `transferCash`,
  `setMarketing`, `allocateNode`, `respecNode`, `buyout`, `useAbility`), events out. Pause and
  speed are the loop's business, not commands. A test replays a recorded night and asserts a
  bit-identical state hash.
- **Odds in `src/sim/odds/`**: exact rational arithmetic for every randomizer that can be
  enumerated (dice, wheels, drums); a seeded simulation with its ± for the rest, cross-checked
  against exact math wherever it exists. The editor and the live tables share one bet-resolution
  function.
- **The Sweat is the sim.** `sweat(state, n, seed)` simulates the rest of tonight's bet flow with
  the same bet-resolution code the live night uses and returns P(bust) with its ±. 500 nights in
  < 50 ms on the owner's PC (a perf test). If it can't, optimize; don't approximate.
- One system per file in `src/sim/systems/`, fixed order in `Game.ts`: clock → commands →
  arrivals → agents (paths, seating) → tables (rounds, bets) → cheats and security → cage
  (payouts, refills, bust) → staff → heat → rivals → events → reputation and word of mouth →
  progression (Know-How, milestones) → stats.
- Content is typed data in `src/data/` (randomizers, starter games, fixtures, staff, gambler
  types, cheats, gaffs, rivals, events, web nodes, marquee signs, layers). The validation test
  checks cross-references, that **every number has a `derivation` string** naming a `DESIGN.md`
  section, that **no Web node, sign or Charter entry is a flat cash multiplier** (each declares
  the system it `moves`), that the web is connected and every start reaches every region, and
  that every sprite name exists in a sheet.
- Rendering: the floor drawn from the sim each frame (agents interpolated with the loop's
  alpha), sorted by y; odds readouts, the Sweat and the web as pixel geometry; UI through the
  IMGUI kit.

## Definition of done (every milestone, every PR-sized change)

1. `npm run typecheck` clean, `npm test` green (sim, odds, data validation, pace tests on 20
   seeds, determinism replay).
2. `npm run screens` run and the overlap report inspected.
3. For anything the player sees: a Playwright screenshot taken and **looked at** (Read the PNG).
4. For anything that changes a number: the derivation updated in `DESIGN.md`, and the pace
   test that encodes the lesson still passes or is updated with the reasoning written down.
5. `PROGRESS.md` and `HANDOFF.md` updated; `DECISIONS.md` if a decision was made; one commit.

## Standing instructions

- **Slice first.** Nothing from Milestone 3 onward until Milestone 2's gate is passed. Ideas go
  to `IDEAS.md`.
- **Flag anything derivative.** Path of Exile (the web's shape), Grim Dawn (constellations),
  Antimatter Dimensions (prestige layers) and tycoon floor sims are references for one quality
  each and nothing else. If a mechanic, node, game, gambler, rival, number, name or UI you're
  about to write resembles any of them, or Balatro, CloverPit, Luck Be a Landlord, The Vig, or any
  other shipped game, stop, say so in chat and in `DECISIONS.md`, and re-derive it from the model
  or drop it. The not-list in `PLAN.md` is a floor. Real casino games (dice, wheels) are fine as
  randomizers; the games the player starts with and the names are ours.
- **The odds are never hidden from the owner**, including a gaffed table's true odds.
- **No real-money anything**, ever. Don't propose it.
- **No new currency, no new tree** without a `DECISIONS.md` entry naming the pillar it serves.
- **Art only through `pixel-art-studio`**, as scripts in `art/`. If the skill is missing, say so
  and use the code-drawn placeholders at the final sprite names; never substitute another
  generator.
- Play the build with the bots before asking for a review; send screenshots of: the game editor
  with a bet's edge, volatility and hit rate; a whale at a table with the Sweat over 10%; a cheat
  caught in the eye-in-the-sky replay; a raid; the Web with an allocated path.
- **Include the owner** in design calls that change what the game is: ask with concrete options
  and a recommendation, then write the answer into `DECISIONS.md`.
- Ask before: changing the resolution, the tile size, the night length (§1), the currency list,
  or the milestone order. Everything else: decide, write it down, move on.

## Agents (in `.claude/agents/`; rewritten for Carpet Joint in Milestone 0)

- `indie-critic`: reviews against the pillars, the removal test and the not-list; plays the
  build and does the edge and Sweat arithmetic itself. Knows roguelikes, gambling math, tycoon
  sims, ARPG passive trees and incremental games.
- `art-director`: owns `STYLE.md`; draws every sprite through `pixel-art-studio` build scripts;
  two critique passes before showing the owner; never another generator.
- `qa-screens`: screenshot sweep, overlap audit, pixel-diff report.
- `balance-auditor`: recomputes every derived number in `DESIGN.md` §2–§10 from `src/data` with
  the odds calculator and the bots, and reports any lesson that no longer holds.

## Environment notes

Windows. Node is a portable copy at `C:\Users\jacks\tools\node-v22.20.0-win-x64`, not on PATH
(the `.bat` files add it; in Git Bash `export PATH="/c/Users/jacks/tools/node-v22.20.0-win-x64:$PATH"`).
Dev server on port 5183. Python 3 and Pillow are needed for the art pipeline (`STYLE.md` says
how). The repo is public; no tokens in it. Commits as ycgNem with the no-reply email
(DECISIONS #18).
