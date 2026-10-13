# Progress — Pegwork

What is built. Newest first.

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

## Milestones

| Milestone | Status |
|---|---|
| M0 — Foundation and the physics | done (2026-10-12) |
| M1 — The slice (town 1) | not started |
| M2 — The gate | not started |
| M3 — The art pass | waiting for the gate |
