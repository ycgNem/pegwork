# Handoff — Carpet Joint (repo: pegwork)

Read this first, every session.

## Where things stand (2026-10-12, end of session)

**Milestone 0 is done**, and **Milestone 1 (the slice) is three stages in** (PROGRESS.md):

- **Stage A** (the season: day/night over 4 nights, the strip's crowd share, the Undercutter,
  the buyout; DECISIONS #39–#42).
- **Stage B** (staff and cheats: dealers, pit bosses, security, cashier, wages, the hiring hall;
  the dice slider and the past-poster, spotting, accusing; #43–#45).
- **Stage C** (shaved dice, Heat, the Gaming Commission's inspector, the raid, the license;
  #46–#48).
- **Pushed** to `main` and live at https://ycgnem.github.io/pegwork/ (the debug floor with all of
  the above). 64 tests, 19 screens with 0 overlap issues.

**Next: stage D**, then E, F, G (ROADMAP.md Milestone 1):

- **D:** high rollers with demands (comp, raise the limit, a private table; `answerWhale`), one a
  night from night 2; the Sweat's arrival forecast (it still holds the seated crowd fixed, #33);
  pace tests §11.2 (the Sweat matters) and §11.7 (the Sweat is honest) at slice scale.
- **E:** the floor: place, move and sell tables and fixtures (bump `floor.version`); the full game
  editor (the bet menu, add/remove bets, the color rule); the eye-in-the-sky replay for cheats.
- **F:** the Web fragment: the Bookmaker background, 30 nodes around its start (3 Specials, 1
  House Rule), Know-How, the web UI (pan, zoom, search). Every node declares what it `moves`.
- **G:** title, results, settings; lesson cards (first paytable edit, first whale, first cheat,
  first Sweat over 10%); `npm run screens`/`shots` for all of it; the `indie-critic` review; then
  the owner plays it (Milestone 2, the gate).

**Open questions for the owner:** anything in PLAN.md to cut (unanswered since the re-plan).
Stage C made one design call the owner may want to revisit: the shave is a *tilt* that only pays
when the paytable steers the crowd onto the shaved side (#46).

**Balance to watch:** over 60 seeds the slice is hard: greedy wins 7%, the 8% tuner 28% (#48);
the gaffer 7/40 vs the tuner's 12/40 (§11.4). When E and F add tools, a good human should beat the
tuner by a lot; if playtests say the slice is too hard, the buyout price (§7) is the first knob.

**Naming drift:** CLAUDE.md's command list says `setGaff`, `assignStaff`, `eject`; the code has
`gaff`, `assign`, and `accuse` (security walks out spotted cheats on its own). Rename or update
CLAUDE.md when stage E touches the commands.

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
  `cheats`, `heat`, `palette`. Every record
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
- A gaff lives on the table (`t.gaff`) and the game's dice weights follow it (`setGaff`); never
  set weights any other way. `closeTable` lives in `choice.ts` (the raid uses it too).
- The heat system reads this tick's `round` events (allowed: same tick). Spot rolls come from
  `heatRng`, so a gaff doesn't disturb any table's own stream.
- Measuring: `npx vite-node <script.ts>` runs a TypeScript script against `src/` (how the 40- and
  60-seed numbers in DESIGN §11 were taken).
- The e2e `cheat-spotted` screen holds security back (role swapped for the loop) so the spotted
  cheat is still seated for the shot.
