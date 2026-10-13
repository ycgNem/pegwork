# Pegwork — Roadmap

Each milestone ends with the Definition of Done in `CLAUDE.md`. **Nothing from Milestone 3
onward starts until Milestone 2's gate is marked passed below.**

## Milestone 0 — Foundation and the physics

Extract the engine layer from Sprocket & Sprout (loop, rng, input, audio, sfxr, music, font,
IMGUI kit, overlap audit, atlas and sheet loader, e2e harness, deploy workflow, `.bat` files,
Electron, vite/vitest/tsconfig). Strip every S&S name. The 384×216 whole-number scaler.
`src/sim/physics/` with the circle physics from `DESIGN.md` §1, the determinism test and the
no-tunneling test. The base board as data, the drop command, marbles falling and landing in
cups, a Dry Run that returns a histogram and a perf test on it. A debug screen that draws the
board, drops a marble on click, and shows the histogram. Copy and rewrite the three agents;
add `balance-auditor`. The art director confirms `pixel-art-studio` works (draws one Steel
marble and one Peg through a build script, palette-locked to Endesga 32) and writes the
material ramps into `STYLE.md`.

Exit: a marble drops through the base board deterministically; the Dry Run runs 300 drops in
< 50 ms; `npm test` green; `npm run screens` reports; the workflow deploys (inert until the
repo exists); `PROGRESS.md`, `HANDOFF.md`, `DECISIONS.md` have their first entries.

## Milestone 1 — The slice (town 1)

Exactly `DESIGN.md`: the base board and its measured EV written back into §2, the ten parts
with durability, bend and repair, the six marbles, the workshop (place, rotate, repair, sell),
the market, the marble bag, the duel (ante, five rounds, three marbles, stakes, pot) against
three town-1 rivals and the boss with the Trap rule, the rival bot, the Dry Run panel beside
the board with EV, cup hit rates and wear cost, the first three nodes of each tree, run start
and run end, results, title, settings. The seven pace tests from `DESIGN.md` §8. Placeholder
sprites at the final names and sizes; the readability rules in `STYLE.md` are not optional
even with placeholders.

Exit: a new player finishes or loses town 1 in 15–20 minutes with a two-line title and lesson
cards at: the first Dry Run, the first part placed, the first bent part, the first duel pot.
Pace tests pass. Screenshots in `e2e/out/`, looked at.

## Milestone 2 — The gate

`indie-critic` reviews against `DESIGN.md` §9 and the not-list. The owner plays it. Either
the model changes or the gate is marked passed here with the date.

**Gate status: not yet passed.**

## Milestone 3 — The art pass

Every sprite through `pixel-art-studio` build scripts: marbles (4-frame shine), parts and
their bent variants, the Spinner's 8 frames, cups, the rail, the felt and wood frame, the
histogram palette, icons, four town-1 rival portraits and the boss. `e2e/coverage.mjs` at 100%.

## Milestone 4 — Towns 2–4 and the full trees

Twelve more rivals and three bosses with their rules (your marbles on their board; pegs
hidden until hit; a cup swapped each round), the rest of the parts pool (Ramp variants, Cup
×10, a second Spinner, Gate pairs), all eight nodes per tree, side bets, scouting, the hustle
re-drop, the circuit map and travel.

## Milestone 5 — Wear and the workshop deep

Bend states per part, repair as a mini-decision (repair now vs. ride it one more duel), part
salvage from beaten rivals, selling, a board history (which parts earned what).

## Milestone 6 — Meta

Achievements that add parts and marbles to the market pool; run seeds as shareable codes; a
daily seed; a board gallery of past runs. Nothing purchasable.

## Milestone 7 — Sound and juice

Marble on brass, on tin, on wood; the bumper's ping with its tag ring; the spinner's whir; the
cup's clunk by multiplier; the duel reveal; the bend crack.

## Milestone 8 — Onboarding and UX

Lesson cards, tooltips with EV deltas on every market item ("+0.04 EV at column 11"),
settings, key rebinding, controller.

## Milestone 9 — Balance and release

Bots across all four towns; the balance auditor clean; perf on a weak laptop; README, itch
page, GitHub Pages at the final name; the Windows build.

## IDEAS.md

Everything else, one line each with why. Reviewed at each gate.
