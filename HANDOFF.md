# Handoff — Pegwork

Read this first, every session.

## Where things stand (2026-10-12)

**Milestone 0 is done** (see PROGRESS.md): the engine layer, the 384x216 whole-number scaler, the
deterministic circle physics, the sim with its command log and replay, the base board tuned to
DESIGN §2's EV targets, the Dry Run, the debug screen, the Steel marble and Peg sprites through
pixel-art-studio, the four agents, the tests and the e2e scripts. **Next: Milestone 1** (START-HERE
Prompt 1), only when the owner says so.

## Running it

- Node is portable at `C:\Users\jacks\tools\node-v22.20.0-win-x64` (not on PATH). In Git Bash:
  `export PATH="/c/Users/jacks/tools/node-v22.20.0-win-x64:$PATH"`; in PowerShell:
  `$env:Path = "$env:USERPROFILE\tools\node-v22.20.0-win-x64;$env:Path"`. `Play.bat` does it itself.
- `npm run dev -- --port 5183` (or the `pegwork` entry in `.claude/launch.json`). 5173 and 5180
  are used by other projects' servers on this PC. The e2e scripts default to
  `http://localhost:5183/`; `BASE=` overrides.
- `npm run typecheck`, `npm test`, `npm run shots`, `npm run screens` (report in
  `e2e/out/screens/report.md`), `npm run perf`.
- `npx vite-node scripts/ev.ts` prints every column's EV for the base board (or a candidate peg
  field as JSON); `npx vite-node scripts/tune-base.ts [restarts] [iters] [seed] [drops] [start]`
  hill-climbs a field (slow: about 1.4 s an evaluation at 3,000 drops).
- Art: `python art/build_all.py` (needs Python 3 + Pillow and the skill at
  `~/.claude/skills/pixel-art-studio`); each `art/<family>/build_*.py` run alone writes its
  previews; `python art/preview_context.py` shows them on the felt at 1x and x4.

## Code map

- `src/sim/` pure and deterministic: `Game.ts` (system order, hash, replay), `commands.ts`,
  `events.ts`, `state.ts`, `systems/` (one per file), `physics/` (`world.ts` bodies and cell
  buckets, `marble.ts` spawn + `stepMarble`, `fixed.ts` the 1/256 grid), `dryrun.ts`, `rng.ts`.
- `src/data/`: `materials.ts` (physics constants, rail tap, materials), `boards.ts`,
  `marbles.ts` (Steel only), `economy.ts`, `palette.ts` (Endesga 32). Every record has a
  `derivation` naming a DESIGN.md section (tests/data.test.ts enforces it).
- `src/app/`: `app.ts` (loop, input, audio, `window.__app` for e2e: `screen`, `loop`,
  `renderNow(alpha)`), `screen.ts` (scaler), `debug.ts` (the M0 screen), `settings.ts`.
- `src/render/`: `board.ts` (board + marbles), `placeholders.ts` (code-drawn sprites at final
  names), `atlas.ts`, `sheets.ts`, `pixel.ts`. `src/ui/`: `ui.ts`, `font.ts`, `audit.ts`.

## Things to know

- The Dry Run and live drops share `stepMarble`; a test proves live drops land exactly where the
  Dry Run says for the same draws. Keep it that way: never add physics only one of them sees.
- At 300 drops a column's EV is ±0.06; the debug screen shows it. §8.1 is judged at 3,000 drops
  (DECISIONS #12). Expect the Dry Run's numbers to wobble when you change its seed.
- A peg in a wall column, or within two cells of a shoulder, makes a pocket a marble rests in;
  the data test rejects both. If a board ever needs a rail tap, the pace test says so.
- Empty systems (`duel`, `wear`, `rival`, `skills`) hold their place in the order for M1.
- `e2e/coverage.mjs` (STYLE.md) doesn't exist yet; until M3 the data test checks that every
  sprite name the data uses is defined.
- The repo is local only (`git init` done, one commit); create the GitHub repo when the owner
  asks. The deploy workflow is inert until then.
- The other game folders in Documents are read-only for this project.
