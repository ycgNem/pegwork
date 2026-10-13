# CLAUDE.md — Pegwork

You are building **Pegwork**, a pixel-art gambling roguelike where you build the marble machine
you gamble on. Read `PLAN.md` (what and why), `DESIGN.md` (every number and its derivation),
`STYLE.md` (the look and the art pipeline), `ROADMAP.md` (what to build now) and
`PROGRESS.md` (what exists) at the start of every session, in that order. `DECISIONS.md` holds
every decision with its reason; add to it, never silently contradict it. `HANDOFF.md` says
where the last session stopped.

## Stack (decided, don't relitigate)

TypeScript strict · Vite · one HTML5 Canvas 2D at 384×216 logical with whole-number
scaling and `imageSmoothingEnabled = false` · fixed 60 Hz pure, deterministic, command-driven
simulation with **our own fixed-step circle physics** (no physics library) · immediate-mode
canvas UI with the bitmap font · Web Audio (S&S synth + jsfxr bank) · localStorage for settings
and meta · Vitest · Playwright + headless Chromium · GitHub Pages · Electron later.
**Art: the `pixel-art-studio` skill only** (see `STYLE.md`); not PixelLab, not SpriteCook.

The engine layer comes from Sprocket & Sprout (`C:\Users\jacks\Documents\sprocket-and-sprout`):
`src/engine/` (loop, rng, input, audio, sfxr, music), the bitmap font and IMGUI kit, the overlap
audit, `render/atlas.ts` and the sheet loader, the e2e harness, the deploy workflow, the `.bat`
files, Electron. **Nothing from its `sim/`, `data/`, `app/`, renderer or art.** Every other
game folder in `Documents` (candlepower, trotline, slipstream-salvager, slipstream-salvager-3d,
the-vig) is **read-only**: never write, commit or run npm there.

## Architecture rules

- **`src/sim/` is pure and deterministic.** No DOM, canvas, audio, time or `Math.random`.
  Commands in (`place`, `rotate`, `repair`, `sell`, `buy`, `pickMarble`, `setStake`,
  `drop(column)`, `sideBet`, `skill`), events out. Positions and velocities are rounded to
  1/256 px after each sub-step. A test replays a recorded duel and asserts a bit-identical
  state hash.
- **Physics in `src/sim/physics/`**: circle-vs-circle, circle-vs-segment, 4 sub-steps per
  tick, restitution and friction from `src/data/materials.ts`. No tunneling at 400 px/s (a
  test fires 1,000 seeded marbles through a dense field and asserts none leave the board
  except through the cups).
- **The Dry Run is the sim.** `dryRun(board, marble, column, n, seed)` runs the same physics
  headless and returns the histogram. It must do 300 drops in < 50 ms on the owner's PC
  (a perf test); if it can't, optimize the physics, don't approximate the Dry Run.
- One system per file in `src/sim/systems/`, fixed order in `Game.ts`: duel state →
  commands → physics (active marbles) → payouts and tags → wear → bankroll → rival bot →
  skill effects → stats.
- Content is typed data in `src/data/` (parts, marbles, cups, boards, rivals, bosses, towns,
  nodes, materials). The validation test checks cross-references, that **every number has a
  `derivation` string** naming a `DESIGN.md` section, that every part declares a
  `distributionEffect` and every node declares `moves: 'distribution' | 'knowledge'` (never a
  flat payout multiplier), and that every sprite name exists in a sheet.
- Rendering: the board region is drawn from the sim each frame (marbles interpolated with the
  loop's alpha), the Dry Run histogram and heatmap as pixel geometry, UI through the IMGUI kit.

## Definition of done (every milestone, every PR-sized change)

1. `npm run typecheck` clean, `npm test` green (sim, physics, data validation, pace tests on
   20 seeds, determinism replay).
2. `npm run screens` run and the overlap report inspected.
3. For anything the player sees: a Playwright screenshot taken and **looked at** (Read the PNG).
4. For anything that changes a number: the derivation updated in `DESIGN.md`, and the pace
   test that encodes the lesson still passes or is updated with the reasoning written down.
5. `PROGRESS.md` and `HANDOFF.md` updated; `DECISIONS.md` if a decision was made; one commit.

## Standing instructions

- **Slice first.** Nothing from Milestone 3 onward until Milestone 2's gate is passed. Ideas
  go to `IDEAS.md`.
- **Flag anything derivative.** CloverPit and Luck Be a Landlord are references for one
  quality each and nothing else. If a mechanic, part, marble, node, rival, number, name or UI
  you are about to write resembles either (or Balatro, Peggle, pachinko, a plinko app, or any
  other shipped game), stop, say so in chat and in `DECISIONS.md`, and re-derive it from the
  model or drop it. The not-list in `PLAN.md` is a floor.
- **The odds are never hidden** for the player's own board. The Dry Run is always available.
- **No real-money anything**, ever. Don't propose it.
- **No new currency, no new tree** without a `DECISIONS.md` entry naming the pillar it serves.
- **Art only through `pixel-art-studio`**, as scripts in `art/`. If the skill is missing, say
  so and use the code-drawn placeholders at the final sprite names; never substitute another
  generator.
- Play the build with the bots before asking for a review; send screenshots of: the base
  board's Dry Run, a Bumper-tagged marble landing in ×3, a bent peg, the duel results, the
  town-1 boss placing a Trap.
- Ask before: changing the resolution, the cell size, the physics constants in §1, the
  currency list, or the milestone order. Everything else: decide, write it down, move on.

## Agents (in `.claude/agents/`)

- `indie-critic`: reviews against the pillars, the removal test and the not-list; plays the
  build and does the EV arithmetic from the Dry Run itself. Knows roguelikes, gambling design,
  physics toys and incremental games.
- `art-director`: owns `STYLE.md`; draws every sprite through `pixel-art-studio` build
  scripts; two critique passes before showing the owner; never another generator.
- `qa-screens`: screenshot sweep, overlap audit, pixel-diff report.
- `balance-auditor`: recomputes every derived number in `DESIGN.md` §2–§8 from `src/data`
  via the Dry Run and reports any lesson that no longer holds.

## Environment notes

Windows. Node is a portable copy at `C:\Users\jacks\tools\node-v22.20.0-win-x64`, not on PATH
(the `.bat` files add it; in a terminal use the PATH line from the S&S `HANDOFF.md`). Python 3
and Pillow are needed for the art pipeline (`STYLE.md` says how). The repo is public; no
tokens in it.
