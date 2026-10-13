# Handoff — Carpet Joint (repo: pegwork)

Read this first, every session.

## Where things stand (2026-10-12)

**The game was re-planned with the owner.** The marble board (Pegwork, whose Milestone 0 was
built and published) is dropped. The new game is **Carpet Joint**: you run a casino on a neon
1970s strip (DECISIONS #19–#29). The docs are rewritten (`PLAN.md`, `DESIGN.md`, `ROADMAP.md`,
`CLAUDE.md`, `STYLE.md`). **The code is still the marble board**, and so is the live page.

- **Next: the owner reviews `ROADMAP.md`**, then Milestone 0 (the wipe and the foundation).
  Don't start it until the owner says so.
- **The old build, still live:** https://ycgnem.github.io/pegwork/ (the marble board).
- **Repo:** https://github.com/ycgNem/pegwork (public), branch `main`.

**Open with the owner:** whether anything in the new `PLAN.md` should be cut before code (asked,
not yet answered).

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
- `npm run typecheck`, `npm test`, `npm run shots`, `npm run screens`, `npm run perf`.
- Art: `python art/build_all.py` (needs Python 3 + Pillow and the skill at
  `~/.claude/skills/pixel-art-studio`).

## What the M0 wipe keeps and deletes (ROADMAP M0, DECISIONS #29)

- **Keep:** `src/engine/`, `src/ui/` (font, IMGUI kit, audit), `src/render/atlas.ts`, `sheets.ts`,
  `pixel.ts`, `src/app/screen.ts` (re-scaled to 640×360) and `settings.ts`, the e2e harness
  pattern, `.github/`, the `.bat` files, `electron/`, `art/common.py` and `art/palette/`.
- **Delete:** `src/sim/physics/`, `src/sim/dryrun.ts`, the marble systems, `src/data/boards.ts`,
  `marbles.ts`, `materials.ts`, `src/render/board.ts`, `placeholders.ts`, `src/app/debug.ts`,
  `src/art/marbles.*`, `parts.*`, `art/marbles/`, `art/parts/`, `scripts/ev.ts`,
  `scripts/tune-base.ts`, and the tests for all of it.
- The other game folders in Documents are read-only for this project.
