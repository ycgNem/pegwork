# Start here — Pegwork

## What you have

`PLAN.md`, `DESIGN.md`, `STYLE.md` (look + the pixel-art-studio pipeline), `CLAUDE.md`,
`ROADMAP.md`, this file, and seeded `DECISIONS.md`, `PROGRESS.md`, `HANDOFF.md`, `IDEAS.md`.

## By hand, before Prompt 0 (15 minutes)

1. **Install the art skill.** In PowerShell:
   ```
   python --version
   pip install --user pillow
   git clone https://github.com/Gamezxz/pixel-art-studio "$env:USERPROFILE\.claude\skills\pixel-art-studio"
   ```
   If `python` isn't found, install Python 3 from python.org with "Add to PATH" ticked, then
   rerun the three lines. Open a Code session anywhere and confirm `/skills` lists
   `pixel-art-studio`.
2. Keep or change the name. Check itch.io, Steam and the domain before the first public build.
3. `git init` in this folder. Create the GitHub repo after Milestone 0, not before.
4. Read `DESIGN.md` §3–§5 as a gambler and a tinkerer. If a part, marble or price feels
   wrong, change it there and write why.
5. You have several planned games. Pick one to take to its slice gate first.

## Prompt 0 — Milestone 0: foundation and the physics

```
Read PLAN.md, DESIGN.md, STYLE.md, CLAUDE.md and ROADMAP.md in that order before doing
anything. Then do Milestone 0 only.

The other game folders in C:\Users\jacks\Documents (sprocket-and-sprout, candlepower,
trotline, slipstream-salvager, slipstream-salvager-3d, the-vig) are read-only: never write,
commit or run npm in them. Extract this repo's engine layer from sprocket-and-sprout exactly
as CLAUDE.md lists (engine, font, IMGUI kit, overlap audit, atlas and sheet loader, e2e
harness, deploy workflow, .bat files, Electron, vite/vitest/tsconfig, package.json scripts),
strip every Sprocket & Sprout name, string, color alias and asset, and copy nothing from its
sim, data, app, renderer or art.

Then:
1. The 384x216 whole-number scaler, letterboxed, imageSmoothingEnabled = false.
2. src/sim/physics/: circle-vs-circle and circle-vs-segment with the constants in DESIGN.md
   §1, 4 sub-steps per tick, 1/256 px rounding, materials from src/data/materials.ts. Tests:
   a recorded drop replays bit-identically; 1,000 seeded marbles through a dense peg field
   never leave the board except through the cups; energy never increases on a bounce.
3. src/sim/: the command type, the seeded RNG, Game.ts with the system order from CLAUDE.md,
   the event queue, the base board from DESIGN.md §2 as data (24 staggered pegs, five cups at
   x0 x1 x3 x1 x0), the drop(column) command with the ±1 px seeded jitter, payout on landing.
4. dryRun(board, marble, column, n, seed) returning a histogram, mean, cup hit rates; a perf
   test that 300 drops finish in under 50 ms; a test that two Dry Runs with the same seed are
   identical. Measure the base board's EV from every column and write the numbers into
   DESIGN.md §2 and §8.1 with the measured values (adjust the peg field until the best column
   is in 0.85-0.95 and every column is in 0.70-0.95; record what you changed in DECISIONS.md).
5. A debug screen: the board at the left, click a column on the rail to drop a marble (drawn
   interpolated with the loop's alpha), the Dry Run histogram on the felt beside it, the
   bitmap-font EV readout. The marble is a 6x6 code-drawn placeholder at the final sprite
   name.
6. Copy .claude/agents/ from sprocket-and-sprout (art-director, indie-critic, qa-screens) and
   rewrite each for Pegwork from PLAN.md, STYLE.md and CLAUDE.md, including the standing
   instruction to flag anything derivative of CloverPit, Luck Be a Landlord, Balatro, Peggle,
   pachinko or plinko apps; add balance-auditor. Have the art director confirm the
   pixel-art-studio skill is available and draw one Steel marble (4-frame shine) and one Peg
   with its bent variant through build scripts in art/, palette-locked to Endesga 32, with two
   critique passes, and write the material ramps into STYLE.md. Show me the preview PNGs. If
   the skill is missing, tell me and stop the art step; do not substitute another generator.
7. e2e: shots.mjs (debug screen with a marble mid-fall; the histogram after 300 drops),
   screens.mjs overlap report, perf.mjs. Run them and look at every screenshot before showing
   me.

Finish with typecheck and tests clean, PROGRESS.md and HANDOFF.md describing exactly what
exists, DECISIONS.md with the first entries, one commit. Stop there. Do not begin Milestone 1.
```

## Prompt 1 — Milestone 1: the slice (town 1)

```
Read HANDOFF.md, PLAN.md, DESIGN.md, STYLE.md, CLAUDE.md, ROADMAP.md, DECISIONS.md and
PROGRESS.md. Build Milestone 1, town 1, exactly as DESIGN.md specifies and nothing more. Same
read-only rule for the other game folders.

Order of work, each step tested and committed before the next: (1) parts as data and physics
bodies with durability, the bent state and repair (DESIGN §3), with the data validation test
enforcing derivation strings and distributionEffect; (2) the six marbles (§4) with their
rules; (3) the workshop: place, rotate, repair, sell, with snapping and a validity check
(no overlaps, cups only on the bottom row); (4) the market and the marble bag; (5) the duel
(§5): ante, five rounds, three marbles, stakes with the 10% cap, pot, results, three town-1
rival boards as data with the rival bot, the boss with the Trap rule; (6) the Dry Run panel
beside the board with EV, cup hit rates and wear cost, live-updating as you edit the board;
(7) the first three nodes of each tree (§7) and skill points per duel won; (8) run start, run
end on bankroll < next ante, title, settings; (9) the seven pace-test bots from §8 on 20
seeds (never-builds, random-builder, EV-builder, wear-disabled, marble choice, determinism,
boss); (10) the four lesson cards; (11) placeholder sprites at the final names and sizes, with
the readability rules in STYLE.md honored even as placeholders (bent parts look bent, cup
multipliers painted on, tags visible on marbles).

Rules: every number carries a derivation; if a DESIGN.md number produces a lesson that
doesn't hold (for example the never-builds bot survives town 2 on more than 4 of 20 seeds),
don't tune silently: write the new derivation in DESIGN.md, explain it in DECISIONS.md, then
change the data. The Dry Run is always available for the player's own board. If you catch
yourself writing something that resembles CloverPit, Luck Be a Landlord, Balatro, Peggle,
pachinko, a plinko app or any other shipped game, stop and tell me. No art generation in this
milestone beyond placeholders; the art pass is Milestone 3.

Send me screenshots at: the base board's Dry Run, a Bumper-tagged marble landing in x3, a bent
peg next to a true one, the duel results, the town-1 boss placing a Trap. Finish with the
Definition of Done, PROGRESS.md and HANDOFF.md updated, then run the indie-critic against
DESIGN.md §9 and paste its ranked findings. Do not start Milestone 3.
```

## After the slice

Play town 1 twice: once reading the Dry Run before every change, once ignoring it. If the
second run isn't clearly worse, pillar 2 isn't carrying the game yet and the model needs work
before any art or more towns. Then read the critic's report and decide the gate.
