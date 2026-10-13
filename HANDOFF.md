# Handoff — Carpet Joint (repo: pegwork)

Read this first, every session.

## Where things stand (2026-10-12)

**Milestone 0 is done** (PROGRESS.md): the marble board is wiped; the foundation of Carpet Joint
is built: the 640x360 screen, the exact odds calculator, the floor sim with gamblers who choose,
walk, bet and leave, the cage and busting, the Sweat, the debug floor, the art-direction test
sprites, the four agents, 38 tests, the e2e scripts.

- **Pushed** to `main`: https://ycgnem.github.io/pegwork/ shows the M0 debug floor (stages A
  and B are committed locally, not pushed; push when the owner says).
- **Now: Milestone 1, the slice** (ROADMAP.md), approved by the owner (DECISIONS #38). Done:
  stage A (the season, crowd share, the Undercutter, the buyout; #39–#42) and stage B (staff
  and cheats; #43–#45). **Next: stage C**: the shaved-dice gaff, Heat, the inspector and the raid,
  pace test §11.4. Then D (whales with demands, the Sweat's arrival forecast; §11.2, §11.7),
  E (place/move/sell on the floor, the full game editor), F (the Web fragment: Bookmaker, 30
  nodes, 3 Specials, 1 House Rule, Know-How), G (title, results, settings, lesson cards,
  indie-critic review).

**Settled with the owner:** chibi proportions, Endesga 32 (#38). Still unanswered from the
re-plan: anything in PLAN.md to cut.

The M0 balance problem (#36) is fixed by #40–#42: pace test §11.1 passes (greedy 2/20, tuner
8/20 with wages).

## Publishing and identity

- Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm test`, `npm run
  build`, then deploys `dist/` to GitHub Pages. A failing test blocks the deploy. Check a run with
  `gh run list -R ycgNem/pegwork`.
- Commits are authored as **ycgNem <337835027+ycgNem@users.noreply.github.com>** (set in this
  repo's `.git/config`), never the owner's real name or email. `gh` is logged in as ycgNem.
- Commit or push only when the owner asks. The repo is public: no tokens in it.

## Running it

- Node is portable at `C:\Users\jacks\tools\node-v22.20.0-win-x64` (not on PATH). In Git Bash:
  `export PATH="/c/Users/jacks/tools/node-v22.20.0-win-x64:$PATH"`; in PowerShell:
  `$env:Path = "$env:USERPROFILE\tools\node-v22.20.0-win-x64;$env:Path"`. `Play.bat` does it itself.
- `npm run dev -- --port 5183` (or the `pegwork` entry in `.claude/launch.json`).
- `npm run typecheck`, `npm test`, `npm run shots`, `npm run screens` (report in
  `e2e/out/screens/report.md`), `npm run perf`.
- Art: `python art/build_all.py` (Python 3 + Pillow and the skill at
  `~/.claude/skills/pixel-art-studio`); each `art/<family>/build_*.py` run alone writes its
  previews; `python art/preview_context.py` shows the test sprites on the floor at 1x and x4.

## Code map

- `src/sim/` pure and deterministic: `Game.ts` (system order, hash, replay, `applyNow`),
  `commands.ts`, `events.ts`, `state.ts`, `systems/` (one per file), `odds/` (`odds.ts` compile,
  `sample`, `ret`, `betOdds`; `rational.ts`), `settle.ts` (the one place money moves),
  `choice.ts` (how a gambler picks), `floor.ts` (walkable grid, seats, flow fields), `sweat.ts`.
- `src/data/`: `time`, `games`, `tables`, `gamblers`, `economy`, `floor`, `strip`, `staff`,
  `cheats`, `palette`. Every record
  has a `derivation` naming a DESIGN.md section (tests/data.test.ts enforces it).
- `src/app/`: `app.ts` (loop, input, audio, `window.__app` for e2e), `floorScreen.ts` (the debug
  floor; `screen.order(cmd)`, `screen.tick()`), `screen.ts` (scaler), `settings.ts`.
- `src/render/`: `floor.ts` (the floor, neon, floaters), `placeholders.ts` (code-drawn sprites at
  final names, `spriteNames()`), `atlas.ts`, `sheets.ts`, `pixel.ts`. `src/ui/`: `ui.ts`, `font.ts`,
  `audit.ts`. `src/art/`: packed sheets from `art/`.

## Things to know

- The editor, the live tables and the Sweat share `compile(game).sample/ret` and `settle`. Keep it
  that way: never resolve a bet anywhere else.
- A `GameDef` is immutable: edits replace it (`withPays`), which is what invalidates the compiled
  and odds caches (WeakMaps keyed by the object).
- Placing or moving a table must bump `floor.version` (the flow-field cache key).
- Bets at one table are correlated; tourists love the one-pocket bet (thrill × log2 of the top
  payout), so a full wheel swings hard. That's real, and M1's balance should keep it visible.
- `mirror_x` in pixel-art-studio copies half a sprite; flip a cel for left/right facing.
- The other game folders in Documents are read-only for this project.
- `assign` is a toggle for pit bosses (watch / stop watching a table) and a move for dealers
  (table -1 takes them off the floor); the generic table check in `systems/commands.ts` skips it.
- The e2e `cheat-spotted` screen holds security back (role swapped for the loop) so the spotted
  cheat is still seated for the shot.
